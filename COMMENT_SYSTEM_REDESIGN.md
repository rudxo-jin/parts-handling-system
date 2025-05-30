# 🔧 코멘트 시스템 재설계 방안

## 🚨 현재 문제점 분석

### **1. 설계 오류**
```typescript
// ❌ 잘못된 현재 구조
const [comment, setComment] = useState(''); // 전역 상태로 모든 단계에서 공유
```

### **2. 문제 발생 시나리오**
```
1. 사용자가 "운영부 요청 완료" 상태에서 "팬벨트는 호환 부품과 함께 사용" 코멘트 입력
2. 해당 코멘트가 전역 comment 상태에 저장됨
3. 상태가 "구매처 발주 완료"로 변경되어도 동일한 comment 상태 참조
4. 결과: 모든 상태에서 동일한 코멘트가 표시됨
```

## ✅ 올바른 해결책

### **1. 데이터 구조 재설계**

#### **Firebase 데이터 구조**
```typescript
interface PurchaseRequest {
  // ... 기존 필드들
  
  // 🆕 상태별 코멘트 저장
  statusComments?: {
    operations_submitted?: string;
    po_completed?: string;
    warehouse_received?: string;
    branch_dispatched?: string;
    branch_received_confirmed?: string;
  };
  
  // 기존 statusHistory는 유지 (전체 히스토리용)
  statusHistory: Array<{
    status: string;
    updatedAt: Date;
    updatedByUid: string;
    updatedByName: string;
    comments: string; // 해당 시점의 코멘트
  }>;
}
```

#### **컴포넌트 상태 관리**
```typescript
// ✅ 올바른 구조
const [statusComments, setStatusComments] = useState<{
  [status: string]: string;
}>({});

// 현재 상태의 코멘트 가져오기
const getCurrentComment = (): string => {
  return statusComments[request?.currentStatus || ''] || '';
};

// 현재 상태의 코멘트 업데이트
const updateCurrentComment = (comment: string) => {
  if (!request) return;
  setStatusComments(prev => ({
    ...prev,
    [request.currentStatus]: comment
  }));
};
```

### **2. 구현 단계**

#### **Phase 1: 데이터 구조 확장**
1. PurchaseRequest 타입에 statusComments 필드 추가
2. 기존 데이터 마이그레이션 (선택사항)

#### **Phase 2: 컴포넌트 수정**
1. 전역 comment 상태를 statusComments로 변경
2. 모든 comment 참조를 getCurrentComment()로 변경
3. 모든 setComment를 updateCurrentComment로 변경

#### **Phase 3: Firebase 저장 로직 수정**
1. 상태 변경 시 statusComments 필드도 함께 저장
2. statusHistory의 comments는 해당 시점의 코멘트로 저장

### **3. 구체적 구현 예시**

#### **상태 변경 시 저장 로직**
```typescript
const handleEcountRegistration = async () => {
  // ... 검증 로직

  const currentComment = getCurrentComment();
  
  const newHistoryEntry = {
    status: 'po_completed',
    updatedAt: Timestamp.now(),
    updatedByUid: userProfile?.id || '',
    updatedByName: userProfile?.name || '',
    comments: currentComment.trim() || '이카운트 등록 및 구매처 발주 완료',
  };

  await updateDoc(requestRef, {
    // ... 기존 업데이트 필드들
    
    // 🆕 상태별 코멘트 저장
    statusComments: {
      ...request.statusComments,
      [request.currentStatus]: currentComment.trim()
    },
    
    statusHistory: arrayUnion(newHistoryEntry),
    updatedAt: Timestamp.now(),
  });

  // 현재 상태 코멘트 초기화
  updateCurrentComment('');
};
```

#### **코멘트 표시 로직**
```typescript
// 처리 히스토리에서 각 단계별 코멘트 표시
{request.statusHistory?.map((history, index) => (
  <Box key={index}>
    <Chip label={getStatusLabel(history.status)} />
    <Typography>{history.updatedByName}</Typography>
    <Typography>{history.updatedAt.toLocaleString()}</Typography>
    
    {/* 🆕 해당 단계의 코멘트만 표시 */}
    {history.comments && (
      <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2">
          💬 "{history.comments}"
        </Typography>
      </Box>
    )}
  </Box>
))}
```

### **4. 사용자 경험 개선**

#### **코멘트 입력 UI**
```typescript
// 현재 상태에 맞는 코멘트 입력
<TextField
  label={`💬 ${getStatusLabel(request.currentStatus)} 단계 코멘트`}
  value={getCurrentComment()}
  onChange={(e) => updateCurrentComment(e.target.value)}
  placeholder={getCommentPlaceholder(request.currentStatus)}
  helperText="이 코멘트는 현재 처리 단계에만 기록됩니다."
/>
```

#### **플레이스홀더 함수**
```typescript
const getCommentPlaceholder = (status: string): string => {
  switch (status) {
    case 'operations_submitted':
      return '이카운트 등록 및 구매처 발주에 대한 특이사항 (예: 호환 부품 정보, 공급업체 변경 등)';
    case 'po_completed':
      return '물류창고 입고에 대한 특이사항 (예: 수량 차이, 품질 이슈, 지연 사유 등)';
    case 'warehouse_received':
      return '지점 출고에 대한 특이사항 (예: 우선 출고 사유, 특별 주의사항 등)';
    default:
      return '해당 단계의 특이사항이나 메모를 입력하세요';
  }
};
```

## 🎯 기대 효과

### **1. 문제 해결**
- ✅ 각 단계별 독립적인 코멘트 관리
- ✅ 상태 변경 시 코멘트 혼재 방지
- ✅ 명확한 업무 추적성 확보

### **2. 사용자 경험 향상**
- 🎯 상황에 맞는 코멘트 가이드
- 📝 단계별 명확한 기록 관리
- 🔍 효율적인 문제 추적

### **3. 시스템 안정성**
- 🛡️ 데이터 무결성 보장
- 📊 정확한 히스토리 관리
- 🔄 확장 가능한 구조

## 🚀 구현 우선순위

### **즉시 구현 (High Priority)**
1. 타입 정의 수정
2. 컴포넌트 상태 관리 변경
3. 핵심 저장 로직 수정

### **단계적 구현 (Medium Priority)**
1. UI 개선 및 가이드 추가
2. 기존 데이터 마이그레이션
3. 추가 검증 로직

### **향후 개선 (Low Priority)**
1. 코멘트 템플릿 기능
2. 자동 완성 기능
3. 코멘트 분석 대시보드

---

*이 재설계를 통해 코멘트 시스템의 근본적인 문제를 해결하고, 더 나은 사용자 경험을 제공할 수 있습니다.* 