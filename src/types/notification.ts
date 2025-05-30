// 알림 타입 정의
export interface NotificationTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  targetRole: 'operations' | 'logistics' | 'admin' | 'all';
  triggerEvent: string;
}

// 카카오톡 알림 데이터
export interface KakaoNotification {
  id: string;
  templateId: string;
  recipientPhone: string;
  recipientName: string;
  variables: Record<string, string>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  errorMessage?: string;
  relatedEntityType: 'purchase_request' | 'part' | 'user' | 'branch';
  relatedEntityId: string;
  createdAt: Date;
}

// 알림 설정
export interface NotificationSettings {
  userId: string;
  phone: string;
  enableKakaoNotifications: boolean;
  enableBrowserNotifications: boolean;
  enableTelegramNotifications: boolean;
  enableEmailNotifications: boolean;
  notificationTypes: {
    // 구매 요청 관련
    purchaseRequestCreated: boolean;        // 구매 요청 생성
    ecountRegistrationNeeded: boolean;      // 이카운트 등록 필요
    purchaseOrderCompleted: boolean;        // 발주 완료
    warehouseReceived: boolean;             // 입고 완료
    branchDispatchReady: boolean;           // 지점 출고 준비
    
    // 긴급 및 경고
    urgentRequest: boolean;                 // 긴급 요청 (권장: 항상 ON)
    overdueRequest: boolean;                // 지연 요청 경고
    
    // 시스템
    systemMaintenance: boolean;             // 시스템 점검
    
    // 역할별 필터링 (운영사업본부용)
    onlyMyRequests: boolean;                // 내가 요청한 건만 받기
    allRequestsInMyDepartment: boolean;     // 우리 부서 요청 모두 받기
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // "22:00"
    endTime: string;   // "08:00"
  };
  roleBasedFiltering: {
    enabled: boolean;                       // 역할 기반 필터링 활성화
    operationsReceiveAll: boolean;          // 운영사업본부: 모든 알림 받기
    logisticsReceiveAll: boolean;           // 유통사업본부: 모든 알림 받기
  };
}

// 알림 템플릿 정의
export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'purchase_request_created',
    name: '구매 요청 생성',
    template: `[부품관리시스템] 신규 구매 요청이 등록되었습니다.

📋 요청자: {{requestorName}}
🔧 부품명: {{partName}}
📅 요청일: {{requestDate}}
⚡ 중요도: {{importance}}

👉 처리하기: {{actionUrl}}`,
    variables: ['requestorName', 'partName', 'requestDate', 'importance', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'purchase_request_created'
  },
  {
    id: 'ecount_registration_needed',
    name: '이카운트 등록 필요',
    template: `[부품관리시스템] 이카운트 등록이 필요합니다.

🔧 부품명: {{partName}}
📋 요청번호: {{requestId}}
👤 요청자: {{requestorName}}

⏰ 신속한 처리 부탁드립니다.
👉 처리하기: {{actionUrl}}`,
    variables: ['partName', 'requestId', 'requestorName', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'ecount_registration_needed'
  },
  {
    id: 'purchase_order_completed',
    name: '발주 완료',
    template: `[부품관리시스템] 발주가 완료되었습니다.

🔧 부품명: {{partName}}
📋 요청번호: {{requestId}}
📅 예상 입고일: {{expectedDate}}

✅ 발주 완료되었습니다.`,
    variables: ['partName', 'requestId', 'expectedDate'],
    targetRole: 'all',
    triggerEvent: 'purchase_order_completed'
  },
  {
    id: 'warehouse_received',
    name: '입고 완료',
    template: `[부품관리시스템] 부품이 입고되었습니다.

🔧 부품명: {{partName}}
📋 요청번호: {{requestId}}
📦 입고 수량: {{quantity}}개

👉 지점 출고 준비해주세요.
👉 처리하기: {{actionUrl}}`,
    variables: ['partName', 'requestId', 'quantity', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'warehouse_received'
  },
  {
    id: 'branch_dispatch_ready',
    name: '지점 출고 준비',
    template: `[부품관리시스템] 지점 출고가 준비되었습니다.

🔧 부품명: {{partName}}
🏪 출고 지점: {{branchName}}
📦 출고 수량: {{quantity}}개

👉 출고 처리해주세요.
👉 처리하기: {{actionUrl}}`,
    variables: ['partName', 'branchName', 'quantity', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'branch_dispatch_ready'
  },
  {
    id: 'urgent_request_alert',
    name: '긴급 요청 알림',
    template: `🚨 [긴급] 부품관리시스템 긴급 요청

🔧 부품명: {{partName}}
👤 요청자: {{requestorName}}
📞 연락처: {{requestorPhone}}
📋 사유: {{urgentReason}}

⚡ 즉시 처리 부탁드립니다!
👉 처리하기: {{actionUrl}}`,
    variables: ['partName', 'requestorName', 'requestorPhone', 'urgentReason', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'urgent_request_created'
  },
  {
    id: 'overdue_request_warning',
    name: '지연 요청 경고',
    template: `⚠️ [지연경고] 부품관리시스템 처리 지연

🔧 부품명: {{partName}}
📅 요청일: {{requestDate}}
⏰ 지연일수: {{overdueDays}}일

📋 현재 상태: {{currentStatus}}
👉 즉시 처리 부탁드립니다.
👉 처리하기: {{actionUrl}}`,
    variables: ['partName', 'requestDate', 'overdueDays', 'currentStatus', 'actionUrl'],
    targetRole: 'all',
    triggerEvent: 'request_overdue'
  }
];

// 알림 발송 결과
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
} 