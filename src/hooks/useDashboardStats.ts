import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole, PurchaseRequest } from '../types';
import { safeToDate } from '../utils/dateUtils';

interface DashboardStats {
  totalParts: number;
  totalPurchaseRequests: number;
  totalUsers: number;
  totalBranches: number;
  pendingRequests: number;
  activeRequests: number;
  loading: boolean;
  error: string | null;
}

interface RoleSpecificStats {
  // 운영사업본부용
  myRequests?: number;
  urgentRequests?: number;
  recentRequests?: PurchaseRequest[];
  
  // 유통사업본부용
  awaitingLogistics?: number;
  overdueRequests?: number;
  todayDeliveries?: number;
  todayCompleted?: number;
  weeklyDispatched?: number;
  avgProcessingTime?: number;
  
  // 관리자용
  systemHealth?: {
    activeUsers: number;
    todayActivity: number;
    errorRate: number;
  };
}

interface ExtendedDashboardStats extends DashboardStats, RoleSpecificStats {}

export const useDashboardStats = (userRole: UserRole | undefined, userId?: string) => {
  const [stats, setStats] = useState<ExtendedDashboardStats>({
    totalParts: 0,
    totalPurchaseRequests: 0,
    totalUsers: 0,
    totalBranches: 0,
    pendingRequests: 0,
    activeRequests: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userRole) return;

    const unsubscribes: (() => void)[] = [];
    
    const fetchStats = async () => {
      try {
        setStats(prev => ({ ...prev, loading: true, error: null }));

        // 1. 부품 수량 실시간 조회
        const partsUnsubscribe = onSnapshot(
          query(collection(db, 'parts'), where('status', '==', 'active')),
          (snapshot) => {
            setStats(prev => ({ ...prev, totalParts: snapshot.size }));
          },
          (error) => {
            console.error('Error fetching parts:', error);
            setStats(prev => ({ ...prev, error: '부품 데이터를 불러오는데 실패했습니다.' }));
          }
        );
        unsubscribes.push(partsUnsubscribe);

        // 2. 구매 요청 수량 실시간 조회
        const purchaseRequestsUnsubscribe = onSnapshot(
          collection(db, 'purchaseRequests'),
          (snapshot) => {
            const total = snapshot.size;
            let pending = 0;
            let active = 0;
            let urgent = 0;
            let myRequests = 0;
            let awaitingLogistics = 0;
            let overdue = 0;
            
            // 물류팀 성과 지표
            let todayCompleted = 0;
            let weeklyDispatched = 0;
            let totalProcessingDays = 0;
            let completedRequestsCount = 0;

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay()); // 이번 주 시작일
            const recentRequests: PurchaseRequest[] = [];

            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const status = data.currentStatus;
              const importance = data.importance;
              const requestorUid = data.requestorUid;
              const expectedDeliveryDate = data.expectedDeliveryDate 
                ? safeToDate(data.expectedDeliveryDate) 
                : null;
              const requestDate = data.requestDate ? safeToDate(data.requestDate) : null;
              const updatedAt = data.updatedAt ? safeToDate(data.updatedAt) : null;
              
              // 기본 통계
              if (status === 'operations_submitted') {
                pending++;
              } else if (status !== 'branch_received_confirmed') {
                active++;
              }

              // 긴급 요청 (모든 역할)
              if (importance === 'urgent' && status !== 'branch_received_confirmed') {
                urgent++;
              }

              // 운영사업본부용 통계
              if (userRole === 'operations' && userId) {
                if (requestorUid === userId) {
                  myRequests++;
                  
                  // 최근 요청 (최대 5개)
                  if (recentRequests.length < 5) {
                    recentRequests.push({
                      id: doc.id,
                      ...data,
                      requestDate: safeToDate(data.requestDate),
                      createdAt: safeToDate(data.createdAt),
                      updatedAt: safeToDate(data.updatedAt),
                    } as PurchaseRequest);
                  }
                }
              }

              // 유통사업본부용 통계
              if (userRole === 'logistics') {
                // 물류 처리 대기 중인 요청들 (실제 물류팀이 처리해야 할 단계만)
                if (['operations_submitted', 'po_completed', 'warehouse_received'].includes(status)) {
                  awaitingLogistics++;
                }

                // 지연된 요청들 (예상 배송일이 지난 것들, 종료된 프로세스 제외)
                if (expectedDeliveryDate && expectedDeliveryDate < now && 
                    status !== 'branch_received_confirmed' && 
                    status !== 'process_terminated') {
                  overdue++;
                }
                
                // 오늘 처리 완료된 요청들 (상태가 변경된 날짜 기준)
                if (updatedAt && updatedAt >= today && 
                    ['po_completed', 'warehouse_received', 'branch_dispatched'].includes(status)) {
                  todayCompleted++;
                }
                
                // 이번주 출고 완료된 요청들
                if (updatedAt && updatedAt >= weekStart && status === 'branch_dispatched') {
                  weeklyDispatched++;
                }
                
                // 완료된 요청들의 처리 시간 계산 (평균 처리시간용)
                if (status === 'branch_received_confirmed' && requestDate && updatedAt) {
                  const processingDays = Math.ceil((updatedAt.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
                  totalProcessingDays += processingDays;
                  completedRequestsCount++;
                }
              }
            });

            // 평균 처리시간 계산
            const avgProcessingTime = completedRequestsCount > 0 
              ? Math.round((totalProcessingDays / completedRequestsCount) * 10) / 10 
              : 2.3; // 기본값

            // 최근 요청을 날짜순으로 정렬
            recentRequests.sort((a, b) => 
              (b.requestDate?.getTime() || 0) - (a.requestDate?.getTime() || 0)
            );

            setStats(prev => ({ 
              ...prev, 
              totalPurchaseRequests: total,
              pendingRequests: pending,
              activeRequests: active,
              urgentRequests: urgent,
              myRequests,
              recentRequests,
              awaitingLogistics,
              overdueRequests: overdue,
              todayCompleted,
              weeklyDispatched,
              avgProcessingTime,
            }));
          },
          (error) => {
            console.error('Error fetching purchase requests:', error);
            setStats(prev => ({ ...prev, error: '구매 요청 데이터를 불러오는데 실패했습니다.' }));
          }
        );
        unsubscribes.push(purchaseRequestsUnsubscribe);

        // 3. 관리자인 경우 사용자 및 지점 수량 조회
        if (userRole === 'admin') {
          // 사용자 수량
          const usersUnsubscribe = onSnapshot(
            query(collection(db, 'users'), where('isActive', '==', true)),
            (snapshot) => {
              const activeUsers = snapshot.size;
              setStats(prev => ({ 
                ...prev, 
                totalUsers: activeUsers,
                systemHealth: {
                  ...prev.systemHealth,
                  activeUsers,
                  todayActivity: Math.floor(Math.random() * 50), // 임시 데이터
                  errorRate: Math.random() * 5, // 임시 데이터
                }
              }));
            },
            (error) => {
              console.error('Error fetching users:', error);
            }
          );
          unsubscribes.push(usersUnsubscribe);

          // 지점 수량
          const branchesUnsubscribe = onSnapshot(
            query(collection(db, 'branches'), where('isActive', '==', true)),
            (snapshot) => {
              setStats(prev => ({ ...prev, totalBranches: snapshot.size }));
            },
            (error) => {
              console.error('Error fetching branches:', error);
            }
          );
          unsubscribes.push(branchesUnsubscribe);
        }

        setStats(prev => ({ ...prev, loading: false }));

      } catch (error) {
        console.error('Error in fetchStats:', error);
        setStats(prev => ({ 
          ...prev, 
          loading: false, 
          error: '데이터를 불러오는데 실패했습니다.' 
        }));
      }
    };

    fetchStats();

    // 클린업 함수
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userRole, userId]);

  return stats;
}; 