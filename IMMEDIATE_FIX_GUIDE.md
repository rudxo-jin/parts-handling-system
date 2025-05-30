# 🚨 코멘트 시스템 즉시 수정 가이드

## 📋 문제 요약
- **현상**: "운영부 요청완료" 상태에서 입력한 코멘트가 "구매처 발주 완료" 상태에서도 보임
- **원인**: 전역 `comment` 상태로 인해 모든 처리 단계에서 동일한 코멘트 공유
- **영향**: 업무 추적성 저하, 잘못된 정보 전달 위험

## ⚡ 즉시 적용 가능한 해결책

### **1단계: 임시 해결 (5분 소요)**

#### **방법 A: 상태 변경 시 코멘트 초기화**
```typescript
// PurchaseRequestDetail.tsx의 각 처리 함수에서
const handleEcountRegistration = async () => {
  // ... 기존 로직
  
  // 🆕 상태 변경 후 코멘트 초기화
  setComment(''); // 이 라인 추가
  
  onUpdate();
  onClose();
};
```

**장점**: 즉시 적용 가능, 최소한의 코드 변경
**단점**: 이전 단계 코멘트 완전 소실

#### **방법 B: 코멘트에 상태 정보 포함**
```typescript
// 코멘트 저장 시 상태 정보 포함
const newHistoryEntry = {
  status: 'po_completed',
  // ... 기존 필드들
  comments: `[${getStatusLabel(request.currentStatus)}] ${comment.trim()}` || '이카운트 등록 및 구매처 발주 완료',
};
```

**장점**: 기존 데이터 보존, 상태별 구분 가능
**단점**: 히스토리에서만 확인 가능

### **2단계: 근본적 해결 (30분 소요)**

#### **상태별 코멘트 관리 구현**

1. **상태 변수 수정**
```typescript
// 기존
const [comment, setComment] = useState('');

// 🆕 수정
const [statusComments, setStatusComments] = useState<{[status: string]: string}>({});

const getCurrentComment = () => statusComments[request?.currentStatus || ''] || '';
const updateCurrentComment = (comment: string) => {
  if (!request) return;
  setStatusComments(prev => ({...prev, [request.currentStatus]: comment}));
};
```

2. **모든 comment 참조 변경**
```typescript
// 기존: comment.trim()
// 🆕 수정: getCurrentComment().trim()

// 기존: setComment(value)
// 🆕 수정: updateCurrentComment(value)
```

3. **Firebase 저장 로직 수정**
```typescript
await updateDoc(requestRef, {
  // ... 기존 필드들
  
  // 🆕 상태별 코멘트 저장
  statusComments: {
    ...request.statusComments,
    [request.currentStatus]: getCurrentComment().trim()
  },
  
  statusHistory: arrayUnion(newHistoryEntry),
});
```

## 🎯 권장 적용 순서

### **즉시 적용 (오늘)**
1. **방법 A** 적용하여 문제 상황 차단
2. 사용자에게 임시 해결 안내

### **이번 주 내 적용**
1. **2단계** 근본적 해결 구현
2. 타입 정의 업데이트 (이미 완료)
3. 테스트 및 검증

### **다음 주 적용**
1. 기존 데이터 마이그레이션 (선택사항)
2. UI/UX 개선
3. 사용자 가이드 업데이트

## 🔧 구체적 수정 파일

### **즉시 수정 필요**
- `src/components/PurchaseRequestDetail.tsx` (라인 380, 428, 482, 525 등)
- `src/components/BulkProcessDialog.tsx` (라인 155, 262, 279, 306 등)

### **타입 정의 (완료)**
- `src/types/index.ts` ✅ statusComments 필드 추가 완료

## 📝 테스트 시나리오

### **테스트 1: 상태별 독립성**
1. "운영부 요청완료" 상태에서 "호환 부품 정보" 코멘트 입력
2. "구매처 발주 완료"로 상태 변경
3. **기대결과**: 이전 코멘트가 보이지 않음
4. 새로운 코멘트 "입고 지연 예상" 입력
5. **기대결과**: 각 상태별로 다른 코멘트 저장

### **테스트 2: 히스토리 추적**
1. 여러 단계에서 각각 다른 코멘트 입력
2. 상태 히스토리 확인
3. **기대결과**: 각 단계별로 해당 시점의 코멘트만 표시

## 🚨 주의사항

### **데이터 손실 방지**
- 기존 comment 데이터 백업 필요
- 점진적 마이그레이션 권장

### **사용자 안내**
- 변경 사항에 대한 사용자 교육 필요
- 코멘트 입력 가이드 제공

### **롤백 계획**
- 문제 발생 시 즉시 이전 버전으로 복구 가능하도록 준비

---

**💡 결론**: 즉시 **방법 A**를 적용하여 문제 상황을 차단하고, 이번 주 내에 **2단계** 근본적 해결을 완료하는 것을 권장합니다. 