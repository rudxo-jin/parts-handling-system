// 사용자 역할 타입
export type UserRole = 'operations' | 'logistics' | 'admin';

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 부품 상태 타입
export type PartStatus = 'active' | 'inactive';

// 부품 정보 타입
export interface Part {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  itemGroup1?: string;
  itemGroup2?: string;
  itemGroup3?: string;
  price: number;
  currency: string;
  images: string[];
  status: PartStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Phase 2: 확장된 구매 요청 상태 타입
export type PurchaseRequestStatus = 
  | 'operations_submitted'      // 운영부 요청 완료
  | 'ecount_registered'         // 이카운트 등록 완료
  | 'po_completed'             // 구매처 발주 완료
  | 'warehouse_received'       // 물류창고 입고 완료
  | 'partial_dispatched'       // 부분 출고 완료 (신규 추가)
  | 'branch_dispatched'        // 전체 지점 출고 완료
  | 'branch_received_confirmed' // 지점 입고 확인 (완료)
  | 'logistics_issue_reported'  // 물류 이슈 보고 (신규 추가)
  | 'alternative_sourcing'      // 대체 조달 진행 중 (신규 추가)
  | 'process_terminated';       // 프로세스 종료 (신규 추가)

// Phase 2: 지점별 출고/수령 정보
export interface BranchDispatchInfo {
  branchId: string;
  branchName: string;
  requiredQuantity: number;      // 요청된 수량
  dispatchedQuantity: number;    // 출고 예정 수량
  actualDispatchedQuantity?: number; // 실제 출고된 수량 (신규 추가)
  isDispatched?: boolean;        // 개별 출고 완료 여부 (신규 추가)
  dispatchedAt?: Date;          // 개별 출고 완료 시각 (신규 추가)
  dispatchedByUid?: string;     // 개별 출고 처리자 (신규 추가)
  confirmedQuantity?: number;    // 지점에서 확인한 수량
  branchReceiptMemo?: string;    // 지점 수령 메모
}

// Phase 2: 확장된 구매 요청 정보 타입
export interface PurchaseRequest {
  id: string;
  requestId: string;
  internalPartId: string;
  requestedPartNumber: string;
  requestedPartName: string;
  requestorUid: string;
  requestorName: string;
  requestDate: Date;
  importance: 'low' | 'medium' | 'high' | 'urgent';
  branchRequirements: BranchRequirement[];
  logisticsStockQuantity: number;
  totalRequestedQuantity: number;
  initialSupplier?: string;
  price?: number;
  currency?: string;
  
  // 세트 관련 필드 (신규 추가)
  setId?: string;                   // 세트에 속한 경우
  setName?: string;                 // 세트명 (표시용)
  isPartOfSet: boolean;             // 세트 부품 여부 (기본값: false)
  partOrderInSet?: number;          // 세트 내 순서
  
  // Phase 2: 새로운 상태 필드
  currentStatus: PurchaseRequestStatus;
  currentResponsibleTeam: 'operations' | 'logistics' | 'completed';
  
  // Phase 2: 이카운트 등록 관련 필드
  ecountRegisteredAt?: Date;
  ecountRegistrarUid?: string;
  itemGroup1?: string;
  itemGroup2?: string;
  itemGroup3?: string;
  
  // Phase 2: 구매처 발주 관련 필드
  poCompletedAt?: Date;
  poCompleterUid?: string;
  expectedDeliveryDate?: Date;
  expectedDeliveryQuantity?: number;
  actualSupplier?: string;           // 실제 발주처 (초기 제안과 다를 수 있음)
  poMemo?: string;                   // 발주 관련 메모
  
  // Phase 2: 물류창고 입고 관련 필드
  warehouseReceiptAt?: Date;
  warehouseReceiptUid?: string;
  actualReceivedQuantity?: number;   // 실제 입고 수량
  
  // Phase 2: 지점 출고 관련 필드
  branchDispatchCompletedAt?: Date;
  branchDispatchCompleterUid?: string;
  branchDispatchQuantities?: BranchDispatchInfo[]; // 지점별 출고/수령 정보
  dispatchMemo?: string;             // 전체 출고 관련 메모
  trackingInformation?: string;      // 운송 정보
  
  // Phase 2: 지점 입고 확인 관련 필드
  branchReceiptConfirmedAt?: Date;
  branchReceiptConfirmerUid?: string;
  
  // 긴급 대응 관련 필드 (신규 추가)
  logisticsIssue?: {
    reportedAt: Date;
    reporterUid: string;
    reporterName: string;
    issueType: 'supply_delay' | 'supply_shortage' | 'supplier_issue' | 'quality_issue' | 'other';
    description: string;
    urgencyLevel: 'medium' | 'high' | 'critical';
    estimatedDelay?: number; // 예상 지연 일수 (undefined: 알 수 없음, -1: 공급 불가능, 0: 지연 없음, 양수: 지연 일수)
    alternativeRequired: boolean; // 대체 조달 필요 여부
  };
  
  alternativeSourcing?: {
    initiatedAt: Date;
    initiatorUid: string;
    initiatorName: string;
    method: 'direct_purchase' | 'branch_transfer' | 'external_supplier' | 'temporary_solution';
    description: string;
    estimatedCost?: number;
    estimatedDelivery?: Date;
  };
  
  processTermination?: {
    terminatedAt: Date;
    terminatorUid: string;
    terminatorName: string;
    reason: 'alternative_completed' | 'request_cancelled' | 'supply_impossible' | 'other';
    finalNotes: string;
  };
  
  // 🆕 상태별 코멘트 저장
  statusComments?: {
    operations_submitted?: string;
    po_completed?: string;
    warehouse_received?: string;
    branch_dispatched?: string;
    branch_received_confirmed?: string;
    logistics_issue_reported?: string;
    alternative_sourcing?: string;
    process_terminated?: string;
  };
  
  statusHistory: StatusHistory[];
  attachments?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 지점 배분 정보
export interface StoreAllocation {
  storeId: string;
  storeName: string;
  allocatedQuantity: number;
  shippedQuantity?: number;
  receivedQuantity?: number;
  receivedAt?: Date;
}

// 지점 정보 타입
export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 알림 타입
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  relatedEntityType?: 'part' | 'purchase_request' | 'user' | 'store';
  relatedEntityId?: string;
  createdAt: Date;
}

// 대시보드 통계 타입
export interface DashboardStats {
  pendingRequests: number;
  activeRequests: number;
  totalPartsThisMonth: number;
  averageLeadTime: number;
  supplierPerformance: SupplierPerformance[];
  recentActivity: ActivityItem[];
}

// 공급업체 성과 타입
export interface SupplierPerformance {
  supplier: string;
  onTimeDeliveryRate: number;
  totalOrders: number;
  averageLeadTime: number;
}

// 활동 로그 타입
export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operations' | 'logistics';
  department: string;
  isActive: boolean;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 지점 정보
export interface Branch {
  id: string;
  branchCode: string;
  branchName: string;
  isActive: boolean;
  creatorUid: string;
  createdAt: Date;
  lastModifierUid: string;
  lastModifiedAt: Date;
}

// 지점별 요구사항
export interface BranchRequirement {
  branchId: string;
  branchName: string;
  requestedQuantity: number | string;
}

// 상태 변경 이력
export interface StatusHistory {
  status: string;
  updatedAt: Date;
  updatedByUid: string;
  updatedByName: string;
  comments?: string;
}

// 다중 부품 요청 (세트) 관련 타입들
export type MultiPartRequestStatus = 'in_progress' | 'partial_complete' | 'complete';

export interface MultiPartRequest {
  id: string;
  setId: string;                    // 세트 고유 ID
  setName: string;                  // "에어컨 수리 세트"
  setDescription?: string;          // 세트 설명
  
  // 요청자 정보
  requestorUid: string;
  requestorName: string;
  requestDate: Date;
  importance: 'low' | 'medium' | 'high' | 'urgent';
  
  // 세트 전체 상태
  overallStatus: MultiPartRequestStatus;
  completedPartsCount: number;      // 완료된 부품 수
  totalPartsCount: number;          // 전체 부품 수
  
  // 개별 부품 ID 목록 (실제 부품은 purchaseRequests 컬렉션에 저장)
  partRequestIds: string[];
  
  // 세트 정책 (고정값)
  allowPartialDispatch: true;       // 부분 출고 허용
  
  // 메타 정보
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 세트 진행 상황 요약
export interface MultiPartProgress {
  setId: string;
  setName: string;
  totalParts: number;
  completedParts: number;
  inProgressParts: number;
  pendingParts: number;
  progressPercentage: number;
  lastUpdated: Date;
} 