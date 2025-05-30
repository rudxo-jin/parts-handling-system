import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  KakaoNotification, 
  NotificationResult, 
  NotificationSettings,
  NOTIFICATION_TEMPLATES 
} from '../types/notification';
import { browserNotificationService } from './browserNotificationService';
import { telegramService } from './telegramService';
import { emailService } from './emailService';

class NotificationService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // 카카오톡 알림 발송
  async sendKakaoNotification(
    templateId: string,
    recipientPhone: string,
    recipientName: string,
    variables: Record<string, string>,
    relatedEntityType: 'purchase_request' | 'part' | 'user' | 'branch',
    relatedEntityId: string
  ): Promise<NotificationResult> {
    try {
      // 1. 알림 기록을 Firebase에 저장
      const notification: Omit<KakaoNotification, 'id'> = {
        templateId,
        recipientPhone,
        recipientName,
        variables,
        status: 'pending',
        relatedEntityType,
        relatedEntityId,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);

      // 2. 실제 카카오톡 API 호출 (개발 환경에서는 시뮬레이션)
      const result = await this.callKakaoAPI(templateId, recipientPhone, variables);

      // 3. 발송 결과 업데이트
      await updateDoc(doc(db, 'notifications', docRef.id), {
        status: result.success ? 'sent' : 'failed',
        sentAt: result.success ? new Date() : undefined,
        errorMessage: result.errorMessage,
      });

      return result;
    } catch (error) {
      console.error('카카오톡 알림 발송 실패:', error);
      return {
        success: false,
        errorMessage: '알림 발송 중 오류가 발생했습니다.',
      };
    }
  }

  // 카카오톡 API 호출 (실제 환경에서는 서버에서 처리)
  private async callKakaoAPI(
    templateId: string,
    recipientPhone: string,
    variables: Record<string, string>
  ): Promise<NotificationResult> {
    // 개발 환경에서는 시뮬레이션
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 ===== 카카오톡 알림 시뮬레이션 시작 =====');
      console.log('📱 수신자:', recipientPhone);
      console.log('📋 템플릿 ID:', templateId);
      console.log('📝 변수:', variables);
      
      // 템플릿 내용 미리보기
      const template = NOTIFICATION_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        let previewMessage = template.template;
        Object.entries(variables).forEach(([key, value]) => {
          previewMessage = previewMessage.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        console.log('💬 발송될 메시지 미리보기:');
        console.log('─'.repeat(50));
        console.log(previewMessage);
        console.log('─'.repeat(50));
      }

      // 90% 성공률로 시뮬레이션
      const success = Math.random() > 0.1;
      
      return new Promise(resolve => {
        setTimeout(() => {
          if (success) {
            console.log('✅ 알림 발송 성공!');
          } else {
            console.log('❌ 알림 발송 실패 (시뮬레이션)');
          }
          console.log('🔔 ===== 카카오톡 알림 시뮬레이션 종료 =====\n');
          
          resolve({
            success,
            messageId: success ? `msg_${Date.now()}` : undefined,
            errorCode: success ? undefined : 'SIMULATION_ERROR',
            errorMessage: success ? undefined : '시뮬레이션 에러',
          });
        }, 1000); // 1초 지연
      });
    }

    // 실제 환경에서는 서버 API 호출
    try {
      const response = await fetch(`${this.baseUrl}/api/kakao/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          recipientPhone,
          variables,
        }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        errorMessage: 'API 호출 실패',
      };
    }
  }

  // 구매 요청 생성 시 알림
  async notifyPurchaseRequestCreated(
    requestId: string,
    requestorName: string,
    partName: string,
    importance: string,
    requestorUid?: string
  ) {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === 'purchase_request_created');
    if (!template) return;

    const variables = {
      requestorName,
      partName,
      requestDate: new Date().toLocaleDateString('ko-KR'),
      importance: importance === 'urgent' ? '🚨 긴급' : importance === 'high' ? '⚡ 높음' : '📋 보통',
      actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
    };

    // 모든 활성 사용자 조회
    const allUsers = await this.getAllActiveUsers();
    
    // 각 사용자의 알림 설정에 따라 개별 발송
    for (const user of allUsers) {
      const settings = await this.getUserNotificationSettings(user.userId);
      
      // 알림 수신 여부 결정
      if (!this.shouldReceiveNotification(user, settings, 'purchaseRequestCreated', requestorUid)) {
        continue;
      }

      // 1. 브라우저 알림 발송
      if (settings?.enableBrowserNotifications !== false) {
        try {
          await browserNotificationService.notifyPurchaseRequest(
            partName,
            requestorName,
            importance,
            requestId
          );
          console.log(`✅ 브라우저 알림 발송 성공: ${user.name}`);
        } catch (error) {
          console.error(`❌ 브라우저 알림 발송 실패 (${user.name}):`, error);
        }
      }

      // 2. 텔레그램 알림 발송
      if (settings?.enableTelegramNotifications !== false) {
        try {
          await telegramService.notifyPurchaseRequest(
            requestorName,
            partName,
            importance,
            requestId
          );
          console.log(`✅ 텔레그램 알림 발송 성공: ${user.name}`);
        } catch (error) {
          console.error(`❌ 텔레그램 알림 발송 실패 (${user.name}):`, error);
        }
      }

      // 3. 이메일 알림 발송
      if (settings?.enableEmailNotifications !== false && user.email) {
        try {
          await emailService.notifyPurchaseRequestCreated(
            user.email,
            user.name,
            requestorName,
            partName,
            importance,
            requestId
          );
          console.log(`✅ 이메일 알림 발송 성공: ${user.name}`);
        } catch (error) {
          console.error(`❌ 이메일 알림 발송 실패 (${user.name}):`, error);
        }
      }

      // 4. 카카오톡 알림 발송
      if (settings?.enableKakaoNotifications !== false && user.phone) {
        await this.sendKakaoNotification(
          template.id,
          user.phone,
          user.name,
          variables,
          'purchase_request',
          requestId
        );
      }
    }
  }

  // 긴급 요청 알림
  async notifyUrgentRequest(
    requestId: string,
    requestorName: string,
    requestorPhone: string,
    partName: string,
    urgentReason: string,
    allUsers: { phone: string; name: string }[]
  ) {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === 'urgent_request_alert');
    if (!template) return;

    const variables = {
      partName,
      requestorName,
      requestorPhone,
      urgentReason,
      actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
    };

    // 1. 브라우저 긴급 알림 발송 (즉시, 무료)
    try {
      await browserNotificationService.notifyUrgentRequest(
        partName,
        requestorName,
        urgentReason,
        requestId
      );
      console.log('🚨 브라우저 긴급 알림 발송 성공');
    } catch (error) {
      console.error('❌ 브라우저 긴급 알림 발송 실패:', error);
    }

    // 2. 텔레그램 긴급 알림 발송 (무료)
    try {
      await telegramService.notifyUrgentRequest(
        requestorName,
        partName,
        urgentReason,
        requestId
      );
      console.log('🚨 텔레그램 긴급 알림 발송 성공');
    } catch (error) {
      console.error('❌ 텔레그램 긴급 알림 발송 실패:', error);
    }

    // 3. 카카오톡 알림 발송 (기존 로직)
    for (const user of allUsers) {
      await this.sendKakaoNotification(
        template.id,
        user.phone,
        user.name,
        variables,
        'purchase_request',
        requestId
      );
    }
  }

  // 상태 변경 알림
  async notifyStatusChange(
    requestId: string,
    newStatus: string,
    partName: string,
    targetUsers: { phone: string; name: string }[]
  ) {
    let templateId = '';
    let variables: Record<string, string> = {};

    switch (newStatus) {
      case 'ecount_registered':
        templateId = 'ecount_registration_needed';
        variables = {
          partName,
          requestId,
          requestorName: '요청자', // 실제로는 요청자 정보 전달
          actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
        };
        break;

      case 'po_completed':
        templateId = 'purchase_order_completed';
        variables = {
          partName,
          requestId,
          expectedDate: '예상 입고일', // 실제 예상 입고일 계산
        };
        break;

      case 'warehouse_received':
        templateId = 'warehouse_received';
        variables = {
          partName,
          requestId,
          quantity: '수량', // 실제 수량 정보
          actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
        };
        break;

      case 'branch_dispatched':
        templateId = 'branch_dispatch_ready';
        variables = {
          partName,
          branchName: '지점명', // 실제 지점명
          quantity: '수량',
          actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
        };
        break;
    }

    if (templateId) {
      for (const user of targetUsers) {
        await this.sendKakaoNotification(
          templateId,
          user.phone,
          user.name,
          variables,
          'purchase_request',
          requestId
        );
      }
    }
  }

  // 지연 요청 경고
  async notifyOverdueRequest(
    requestId: string,
    partName: string,
    requestDate: Date,
    overdueDays: number,
    currentStatus: string,
    targetUsers: { phone: string; name: string }[]
  ) {
    const template = NOTIFICATION_TEMPLATES.find(t => t.id === 'overdue_request_warning');
    if (!template) return;

    const variables = {
      partName,
      requestDate: requestDate.toLocaleDateString('ko-KR'),
      overdueDays: overdueDays.toString(),
      currentStatus: this.getStatusDisplayName(currentStatus),
      actionUrl: `${window.location.origin}/purchase-requests/${requestId}`,
    };

    for (const user of targetUsers) {
      await this.sendKakaoNotification(
        template.id,
        user.phone,
        user.name,
        variables,
        'purchase_request',
        requestId
      );
    }
  }

  // 사용자 알림 설정 조회
  async getUserNotificationSettings(userId: string): Promise<NotificationSettings | null> {
    try {
      const q = query(
        collection(db, 'notificationSettings'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const docData = querySnapshot.docs[0].data();
      return {
        userId: docData.userId,
        phone: docData.phone,
        enableKakaoNotifications: docData.enableKakaoNotifications,
        enableBrowserNotifications: docData.enableBrowserNotifications,
        notificationTypes: docData.notificationTypes,
        quietHours: docData.quietHours,
      } as NotificationSettings;
    } catch (error) {
      console.error('알림 설정 조회 실패:', error);
      return null;
    }
  }

  // 역할별 담당자 조회
  async getUsersByRole(role: 'operations' | 'logistics' | 'admin'): Promise<{ phone: string; name: string; userId: string }[]> {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', role),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      const users = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          phone: data.phone || '',
          name: data.name || '',
          userId: doc.id,
        };
      }).filter(user => user.phone); // 전화번호가 있는 사용자만

      return users;
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      return [];
    }
  }

  // 상태 표시명 변환
  private getStatusDisplayName(status: string): string {
    const statusMap: Record<string, string> = {
      'operations_submitted': '요청 완료',
      'ecount_registered': '이카운트 등록',
      'po_completed': '발주 완료',
      'warehouse_received': '입고 완료',
      'branch_dispatched': '출고 완료',
      'branch_received_confirmed': '입고 확인',
    };
    return statusMap[status] || status;
  }

  // 조용한 시간 확인
  private isQuietHours(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = parseInt(settings.quietHours.startTime.replace(':', ''));
    const endTime = parseInt(settings.quietHours.endTime.replace(':', ''));

    if (startTime < endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // 모든 활성 사용자 조회
  private async getAllActiveUsers(): Promise<Array<{
    userId: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'admin' | 'operations' | 'logistics';
    department: string;
  }>> {
    try {
      // Firebase에서 사용자 목록 조회
      const q = query(
        collection(db, 'users'),
        where('isActive', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        userId: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        phone: doc.data().phone || '',
        role: doc.data().role || 'operations',
        department: doc.data().department || ''
      }));
    } catch (error) {
      console.error('사용자 목록 조회 실패:', error);
      return [];
    }
  }

  // 알림 수신 여부 결정 로직
  private shouldReceiveNotification(
    user: any,
    settings: NotificationSettings | null,
    notificationType: keyof NotificationSettings['notificationTypes'],
    requestorUid?: string
  ): boolean {
    // 기본 설정 (설정이 없으면 모든 알림 수신)
    if (!settings) return true;

    // 조용한 시간 확인 (긴급 알림은 예외)
    if (notificationType !== 'urgentRequest' && this.isQuietHours(settings)) {
      return false;
    }

    // 해당 알림 타입이 비활성화된 경우
    if (settings.notificationTypes[notificationType] === false) {
      return false;
    }

    // 역할 기반 필터링
    if (settings.roleBasedFiltering?.enabled) {
      // 운영사업본부 사용자의 경우
      if (user.role === 'operations') {
        // 모든 알림 받기가 비활성화된 경우
        if (!settings.roleBasedFiltering.operationsReceiveAll) {
          // 내가 요청한 건만 받기 설정 확인
          if (settings.notificationTypes.onlyMyRequests && requestorUid !== user.userId) {
            return false;
          }
          
          // 우리 부서 요청만 받기 설정 확인
          if (settings.notificationTypes.allRequestsInMyDepartment) {
            // 요청자가 같은 부서인지 확인 (실제로는 요청자 정보를 조회해야 함)
            return true;
          }
        }
      }
      
      // 유통사업본부 사용자의 경우
      if (user.role === 'logistics') {
        return settings.roleBasedFiltering.logisticsReceiveAll;
      }
    }

    return true;
  }
}

export const notificationService = new NotificationService(); 