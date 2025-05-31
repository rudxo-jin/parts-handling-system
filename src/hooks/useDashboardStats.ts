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
  // 새로운 운영부 통계 추가
  monthlyRequests?: number;
  avgCompletionTime?: number;
  requestAccuracy?: number;
  awaitingConfirmation?: number;
  inProgress?: number;
  completed?: number;
  operationsWaiting?: number; // 운영부 요청 완료 → 물류팀 처리 대기
  operationsPoCompleted?: number; // 운영부용 po_completed 건수
  operationsWarehouseReceived?: number; // 운영부용 warehouse_received 건수
  
  // 유통사업본부용
  awaitingLogistics?: number;
  overdueRequests?: number;
  todayDeliveries?: number;
  todayCompleted?: number;
  weeklyDispatched?: number;
  avgProcessingTime?: number;
  monthlyCompleted?: number;
  monthlyDispatched?: number;
  // 단계별 실제 건수
  operationsSubmitted?: number;
  poCompleted?: number;
  warehouseReceived?: number;
  branchDispatched?: number;
  
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
            let monthlyCompleted = 0;
            let monthlyDispatched = 0;
            let totalProcessingDays = 0;
            let completedRequestsCount = 0;
            
            // 단계별 실제 건수
            let operationsSubmittedCount = 0;
            let poCompletedCount = 0;
            let warehouseReceivedCount = 0;
            let branchDispatchedCount = 0;

            // 운영부 새로운 통계 변수들
            let monthlyRequestsCount = 0;
            let operationsCompletionDays = 0;
            let operationsCompletedCount = 0;
            let accurateRequestsCount = 0;
            let totalRequestsForAccuracy = 0;
            let awaitingConfirmationCount = 0;
            let inProgressCount = 0;
            let completedCount = 0;
            let operationsWaitingCount = 0; // 운영부용 operations_submitted 건수
            let operationsPoCompletedCount = 0; // 운영부용 po_completed 건수
            let operationsWarehouseReceivedCount = 0; // 운영부용 warehouse_received 건수

            const now = new Date();
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // 이번 달 시작일
            const recentRequests: PurchaseRequest[] = [];

            // 관리자용 통계 (모든 사용자 데이터)
            let adminCompletedCount = 0;
            let adminOperationsSubmittedCount = 0;
            let adminPoCompletedCount = 0;
            let adminWarehouseReceivedCount = 0;
            let adminBranchDispatchedCount = 0;
            
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
              const warehouseReceiptAt = data.warehouseReceiptAt ? safeToDate(data.warehouseReceiptAt) : null;
              const branchReceiptConfirmedAt = data.branchReceiptConfirmedAt ? safeToDate(data.branchReceiptConfirmedAt) : null;
              
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
                  
                  // 이달 요청 건수 (요청일 기준)
                  if (requestDate && requestDate >= monthStart) {
                    monthlyRequestsCount++;
                  }
                  
                  // 단계별 분류
                  if (status === 'operations_submitted') {
                    operationsWaitingCount++; // 물류팀 처리 대기
                  } else if (['po_completed', 'warehouse_received'].includes(status)) {
                    inProgressCount++; // 물류 처리 중
                    
                    // 운영부용 세부 단계별 카운트
                    if (status === 'po_completed') {
                      operationsPoCompletedCount++;
                    } else if (status === 'warehouse_received') {
                      operationsWarehouseReceivedCount++;
                    }
                  } else if (status === 'branch_dispatched') {
                    awaitingConfirmationCount++; // 지점 입고 확인 필요
                  } else if (status === 'branch_received_confirmed') {
                    completedCount++; // 완료
                    
                    // 완료 시간 계산 (운영부 관점)
                    if (requestDate && branchReceiptConfirmedAt) {
                      const completionDays = Math.ceil((branchReceiptConfirmedAt.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
                      operationsCompletionDays += completionDays;
                      operationsCompletedCount++;
                    }
                  }
                  
                  // 요청 정확도 계산 (완료된 요청만)
                  if (status === 'branch_received_confirmed') {
                    totalRequestsForAccuracy++;
                    const originalQuantity = data.totalRequestedQuantity || 0;
                    const finalQuantity = data.branchDispatchQuantities?.reduce((sum: number, branch: any) => 
                      sum + (branch.confirmedQuantity || branch.dispatchedQuantity || 0), 0) || 0;
                    
                    // 원래 요청 수량과 최종 확인 수량이 일치하면 정확한 요청
                    if (Math.abs(originalQuantity - finalQuantity) <= originalQuantity * 0.05) { // 5% 오차 허용
                      accurateRequestsCount++;
                    }
                  }
                  
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

                // 새로운 긴급처리 조건들
                let isUrgentCase = false;
                
                // 1. 긴급 요청으로 표시된 경우
                if (importance === 'urgent' && status !== 'branch_received_confirmed' && status !== 'process_terminated') {
                  isUrgentCase = true;
                }
                
                // 2. 운영부 요청완료 후 24시간 경과한 경우
                if (status === 'operations_submitted' && updatedAt) {
                  const hoursSinceSubmission = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
                  if (hoursSinceSubmission > 24) {
                    isUrgentCase = true;
                  }
                }
                
                // 3. 입고예정일을 넘긴 경우 (입고 완료되지 않은 경우만)
                if (expectedDeliveryDate && 
                    expectedDeliveryDate < now && 
                    status !== 'branch_received_confirmed' && 
                    status !== 'process_terminated' &&
                    !warehouseReceiptAt) {
                  isUrgentCase = true;
                }
                
                // 4. 입고완료 후 출고가 3일 이상 지연되는 경우
                if (status === 'warehouse_received' && warehouseReceiptAt) {
                  const daysSinceReceipt = (now.getTime() - warehouseReceiptAt.getTime()) / (1000 * 60 * 60 * 24);
                  if (daysSinceReceipt > 3) {
                    isUrgentCase = true;
                  }
                }
                
                if (isUrgentCase) {
                  overdue++; // 긴급처리 건수로 사용
                }
                
                // 이달 처리 완료된 요청들 (상태가 변경된 날짜 기준)
                if (updatedAt && updatedAt >= monthStart && 
                    ['po_completed', 'warehouse_received', 'branch_dispatched'].includes(status)) {
                  monthlyCompleted++;
                }
                
                // 이달 출고 완료된 요청들
                if (updatedAt && updatedAt >= monthStart && status === 'branch_dispatched') {
                  monthlyDispatched++;
                }
                
                // 완료된 요청들의 처리 시간 계산 (평균 처리시간용)
                if (status === 'branch_received_confirmed' && requestDate && updatedAt) {
                  const processingDays = Math.ceil((updatedAt.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
                  totalProcessingDays += processingDays;
                  completedRequestsCount++;
                }

                // 단계별 실제 건수
                if (status === 'operations_submitted') {
                  operationsSubmittedCount++;
                } else if (status === 'po_completed') {
                  poCompletedCount++;
                } else if (status === 'warehouse_received') {
                  warehouseReceivedCount++;
                } else if (status === 'branch_dispatched') {
                  branchDispatchedCount++;
                }
              }

              // 관리자용 전체 단계별 통계 계산
              if (userRole === 'admin') {
                if (status === 'operations_submitted') {
                  adminOperationsSubmittedCount++;
                } else if (status === 'po_completed') {
                  adminPoCompletedCount++;
                } else if (status === 'warehouse_received') {
                  adminWarehouseReceivedCount++;
                } else if (status === 'branch_dispatched') {
                  adminBranchDispatchedCount++;
                } else if (status === 'branch_received_confirmed') {
                  adminCompletedCount++;
                }
              }
            });

            // 평균 처리시간 계산 (물류팀용)
            const avgProcessingTime = completedRequestsCount > 0 
              ? Math.round((totalProcessingDays / completedRequestsCount) * 10) / 10 
              : 2.3; // 기본값

            // 운영부 평균 완료시간 계산
            const avgCompletionTime = operationsCompletedCount > 0 
              ? Math.round((operationsCompletionDays / operationsCompletedCount) * 10) / 10 
              : 0; // 기본값을 0으로 변경

            // 운영부 요청 정확도 계산
            const requestAccuracy = totalRequestsForAccuracy > 0 
              ? Math.round((accurateRequestsCount / totalRequestsForAccuracy) * 1000) / 10 
              : 0; // 기본값을 0으로 변경

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
              // 운영부 새로운 통계
              monthlyRequests: monthlyRequestsCount,
              avgCompletionTime,
              requestAccuracy,
              awaitingConfirmation: awaitingConfirmationCount,
              inProgress: inProgressCount,
              completed: completedCount,
              operationsWaiting: operationsWaitingCount,
              operationsPoCompleted: operationsPoCompletedCount,
              operationsWarehouseReceived: operationsWarehouseReceivedCount,
              // 물류팀 통계
              awaitingLogistics,
              overdueRequests: overdue,
              avgProcessingTime,
              todayCompleted: monthlyCompleted,
              weeklyDispatched: monthlyDispatched,
              monthlyCompleted,
              monthlyDispatched,
              operationsSubmitted: operationsSubmittedCount,
              poCompleted: poCompletedCount,
              warehouseReceived: warehouseReceivedCount,
              branchDispatched: branchDispatchedCount,
              // 관리자용 완료 건수 추가
              ...(userRole === 'admin' && { 
                completed: adminCompletedCount,
                operationsSubmitted: adminOperationsSubmittedCount,
                poCompleted: adminPoCompletedCount,
                warehouseReceived: adminWarehouseReceivedCount,
                branchDispatched: adminBranchDispatchedCount,
              }),
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
                  activeUsers,
                  todayActivity: prev.operationsSubmitted || 0, // 오늘 제출된 요청 수 사용
                  errorRate: 0, // 실제 에러 추적 시스템이 없으므로 0으로 설정
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