import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit, addDoc, QuerySnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../types';

export interface ActivityItem {
  id: string;
  action: string;
  entityType: 'part' | 'purchase_request' | 'user' | 'branch';
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: Date;
  details?: string;
  importance?: 'low' | 'medium' | 'high' | 'urgent';
}

interface ActivityFeedState {
  activities: ActivityItem[];
  loading: boolean;
  error: string | null;
}

export const useActivityFeed = (userRole: UserRole | undefined, userId?: string, limitCount: number = 10) => {
  const [state, setState] = useState<ActivityFeedState>({
    activities: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userRole) return;

    // 실제 Firebase 데이터 사용 + 더미 데이터 보완
    const generateRecentActivities = async (): Promise<ActivityItem[]> => {
      const activities: ActivityItem[] = [];
      
      try {
        // 1. 최근 구매 요청 활동 가져오기
        const purchaseRequestsQuery = query(
          collection(db, 'purchaseRequests'),
          orderBy('updatedAt', 'desc'),
          limit(limitCount)
        );
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const unsubscribePurchase = onSnapshot(purchaseRequestsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' 
              ? data.updatedAt.toDate() 
              : new Date();
            
            // 상태에 따른 활동 생성
            let action = '구매 요청 생성';
            let importance: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
            
            switch (data.currentStatus) {
              case 'operations_submitted':
                action = '구매 요청 생성';
                importance = 'medium';
                break;
              case 'ecount_registered':
                action = '이카운트 등록 완료';
                importance = 'medium';
                break;
              case 'po_completed':
                action = '발주 완료';
                importance = 'high';
                break;
              case 'warehouse_received':
                action = '입고 확인';
                importance = 'medium';
                break;
              case 'branch_dispatched':
                action = '지점 출고';
                importance = 'high';
                break;
              case 'branch_received_confirmed':
                action = '입고 확인 완료';
                importance = 'high';
                break;
            }

            if (data.importance === 'urgent') {
              importance = 'urgent';
            }

            activities.push({
              id: `purchase-${doc.id}`,
              action,
              entityType: 'purchase_request',
              entityId: doc.id,
              entityName: data.requestedPartName || '부품명 미상',
              userId: data.requestorUid || 'unknown',
              userName: data.requestorName || '사용자 미상',
              userRole: 'operations', // 기본값
              timestamp: updatedAt,
              importance,
              details: `${data.requestedPartName} - ${data.currentStatus}`,
            });
          });
        });

        // 2. 최근 부품 등록 활동 가져오기
        const partsQuery = query(
          collection(db, 'parts'),
          orderBy('createdAt', 'desc'),
          limit(Math.floor(limitCount / 2))
        );
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const unsubscribeParts = onSnapshot(partsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
          snapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
              ? data.createdAt.toDate()
              : new Date();
            
            activities.push({
              id: `part-${doc.id}`,
              action: '신규 부품 등록',
              entityType: 'part',
              entityId: doc.id,
              entityName: data.partName || '부품명 미상',
              userId: data.creatorUid || 'unknown',
              userName: data.creatorName || '사용자 미상',
              userRole: 'operations',
              timestamp: createdAt,
              importance: 'medium',
              details: `${data.partName} - ${data.category}`,
            });
          });
        });

        // 3. 관리자인 경우 사용자/지점 활동도 포함
        if (userRole === 'admin') {
          // 최근 사용자 등록
          const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc'),
            limit(3)
          );
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const unsubscribeUsers = onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : new Date();
              
              activities.push({
                id: `user-${doc.id}`,
                action: '사용자 등록',
                entityType: 'user',
                entityId: doc.id,
                entityName: data.name || '사용자명 미상',
                userId: data.id || 'unknown',
                userName: '관리자',
                userRole: 'admin',
                timestamp: createdAt,
                importance: 'low',
                details: `${data.name} - ${data.role}`,
              });
            });
          });

          // 최근 지점 등록
          const branchesQuery = query(
            collection(db, 'branches'),
            orderBy('createdAt', 'desc'),
            limit(3)
          );
          
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const unsubscribeBranches = onSnapshot(branchesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
            snapshot.docs.forEach(doc => {
              const data = doc.data();
              const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate()
                : new Date();
              
              activities.push({
                id: `branch-${doc.id}`,
                action: '지점 등록',
                entityType: 'branch',
                entityId: doc.id,
                entityName: data.branchName || '지점명 미상',
                userId: data.creatorUid || 'unknown',
                userName: '관리자',
                userRole: 'admin',
                timestamp: createdAt,
                importance: 'medium',
                details: `${data.branchName} - ${data.branchCode}`,
              });
            });
          });
        }

        // 잠시 대기 후 데이터 반환 (실시간 리스너가 데이터를 채울 시간)
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('활동 데이터 로드 실패:', error);
        // 에러 시 더미 데이터로 폴백
        return generateFallbackActivities();
      }

      // 시간순 정렬 및 제한
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limitCount);
    };

    // 폴백용 더미 데이터 생성
    const generateFallbackActivities = (): ActivityItem[] => {
      const now = new Date();
      const activities: ActivityItem[] = [];

      for (let i = 0; i < limitCount; i++) {
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
        
        const activityTypes = [
          {
            action: '신규 부품 등록',
            entityType: 'part' as const,
            entityName: `부품-${Math.floor(Math.random() * 1000)}`,
            userRole: 'operations' as UserRole,
            importance: 'medium' as const,
          },
          {
            action: '구매 요청 생성',
            entityType: 'purchase_request' as const,
            entityName: `요청-${Math.floor(Math.random() * 1000)}`,
            userRole: 'operations' as UserRole,
            importance: 'high' as const,
          },
        ];

        const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        activities.push({
          id: `fallback-${i}-${timestamp.getTime()}`,
          action: randomActivity.action,
          entityType: randomActivity.entityType,
          entityId: `${randomActivity.entityType}-${Math.floor(Math.random() * 1000)}`,
          entityName: randomActivity.entityName,
          userId: userId || `user-${Math.floor(Math.random() * 10)}`,
          userName: `사용자${Math.floor(Math.random() * 10) + 1}`,
          userRole: randomActivity.userRole,
          timestamp,
          importance: randomActivity.importance,
        });
      }

      return activities;
    };

    // 데이터 로드 및 실시간 업데이트
    const loadActivities = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const activities = await generateRecentActivities();
        setState({
          activities,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('활동 피드 로드 실패:', error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: '활동 데이터를 불러오는데 실패했습니다.',
        }));
      }
    };

    // 초기 로드
    loadActivities();

    // 2분마다 데이터 새로고침 (실제 데이터 반영)
    const interval = setInterval(() => {
      loadActivities();
    }, 120000); // 2분

    return () => {
      clearInterval(interval);
    };
  }, [userRole, userId, limitCount]);

  return state;
};

// 실제 Firebase 활동 로그 저장 함수
export const logActivity = async (activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'activities'), {
      ...activity,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}; 