class BrowserNotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkPermission();
  }

  private async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  async showNotification(
    title: string,
    options: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      requireInteraction?: boolean;
      data?: any;
    }
  ): Promise<Notification | null> {
    if (this.permission !== 'granted') {
      console.log('알림 권한이 없습니다.');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        data: options.data,
      });

      // 클릭 이벤트 처리
      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      // 긴급이 아닌 경우 5초 후 자동 닫기
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      console.log('✅ 브라우저 알림 표시 성공:', title);
      return notification;
    } catch (error) {
      console.error('❌ 브라우저 알림 표시 실패:', error);
      return null;
    }
  }

  // 구매 요청 알림
  async notifyPurchaseRequest(
    partName: string,
    requestorName: string,
    importance: string,
    requestId: string
  ) {
    const urgencyIcon = importance === 'urgent' ? '🚨' : importance === 'high' ? '⚡' : '📋';
    const title = `${urgencyIcon} 새로운 구매 요청`;
    const body = `${requestorName}님이 "${partName}" 부품을 요청했습니다.`;
    
    return await this.showNotification(title, {
      body,
      tag: 'purchase-request',
      requireInteraction: importance === 'urgent',
      data: {
        url: `/purchase-requests/${requestId}`,
        type: 'purchase_request',
        requestId
      }
    });
  }

  // 상태 변경 알림
  async notifyStatusChange(
    partName: string,
    newStatus: string,
    requestId: string
  ) {
    const statusMessages: Record<string, string> = {
      'ecount_registered': '이카운트 등록 완료',
      'po_completed': '발주 완료',
      'warehouse_received': '입고 완료',
      'branch_dispatched': '지점 출고 완료',
      'completed': '처리 완료'
    };

    const title = '📋 상태 변경 알림';
    const body = `"${partName}" - ${statusMessages[newStatus] || newStatus}`;
    
    return await this.showNotification(title, {
      body,
      tag: 'status-change',
      data: {
        url: `/purchase-requests/${requestId}`,
        type: 'status_change',
        requestId
      }
    });
  }

  // 긴급 요청 알림
  async notifyUrgentRequest(
    partName: string,
    requestorName: string,
    urgentReason: string,
    requestId: string
  ) {
    const title = '🚨 긴급 요청 알림';
    const body = `${requestorName}님의 긴급 요청: "${partName}" - ${urgentReason}`;
    
    return await this.showNotification(title, {
      body,
      tag: 'urgent-request',
      requireInteraction: true,
      data: {
        url: `/purchase-requests/${requestId}`,
        type: 'urgent_request',
        requestId
      }
    });
  }

  // 지연 요청 경고
  async notifyOverdueRequest(
    partName: string,
    overdueDays: number,
    requestId: string
  ) {
    const title = '⚠️ 지연 요청 경고';
    const body = `"${partName}" 요청이 ${overdueDays}일 지연되었습니다.`;
    
    return await this.showNotification(title, {
      body,
      tag: 'overdue-request',
      requireInteraction: true,
      data: {
        url: `/purchase-requests/${requestId}`,
        type: 'overdue_request',
        requestId
      }
    });
  }
}

export const browserNotificationService = new BrowserNotificationService(); 