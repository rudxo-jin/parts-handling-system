# 🔒 배포 보안 가이드

## 1. 환경 변수 설정

### 1-1. .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Application Settings
REACT_APP_ENVIRONMENT=production
REACT_APP_VERSION=1.0.0
```

### 1-2. .gitignore 확인
`.env` 파일이 Git에 커밋되지 않도록 `.gitignore`에 포함되어 있는지 확인하세요.

## 2. Firebase 보안 규칙

### 2-1. Firestore 보안 규칙
Firebase Console에서 다음 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 문서 - 본인만 읽기/쓰기 가능, 관리자는 모든 사용자 읽기 가능
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 구매 요청 - 역할별 접근 제어
    match /purchaseRequests/{requestId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid));
      
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['operations', 'admin'];
      
      allow update: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['logistics', 'admin'] ||
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'operations' && 
          resource.data.requestorUid == request.auth.uid));
      
      allow delete: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 부품 정보 - 모든 인증된 사용자 읽기, 관리자만 쓰기
    match /parts/{partId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 지점 정보 - 모든 인증된 사용자 읽기, 관리자만 쓰기
    match /branches/{branchId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 공급업체 정보 - 물류팀과 관리자만 접근
    match /suppliers/{supplierId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['logistics', 'admin'];
    }
  }
}
```

### 2-2. Storage 보안 규칙
Firebase Storage에서 다음 보안 규칙을 설정하세요:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 구매 요청 관련 파일
    match /purchase-requests/{requestId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.metadata.uploadedBy ||
         getUserRole(request.auth.uid) in ['logistics', 'admin']);
    }
    
    // 사용자 프로필 이미지
    match /profile-images/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 부품 이미지 - 관리자만 업로드
    match /part-images/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        getUserRole(request.auth.uid) == 'admin';
    }
  }
  
  function getUserRole(uid) {
    return firestore.get(/databases/(default)/documents/users/$(uid)).data.role;
  }
}
```

## 3. 인증 설정

### 3-1. Firebase Authentication 설정
1. Firebase Console → Authentication → Sign-in method
2. 이메일/비밀번호 활성화
3. 승인된 도메인에 프로덕션 도메인 추가
4. 비밀번호 정책 강화 설정

### 3-2. 사용자 등록 제한
- 새 사용자 등록을 관리자 승인 방식으로 변경
- 이메일 인증 필수 설정

## 4. 데이터 보안

### 4-1. 민감 정보 암호화
- 사용자 개인정보 (전화번호, 주소 등)
- 공급업체 계약 정보
- 가격 정보

### 4-2. 접근 로그
- 사용자 로그인/로그아웃 기록
- 중요 데이터 변경 이력
- 파일 다운로드 기록

## 5. 네트워크 보안

### 5-1. HTTPS 강제
- Firebase Hosting에서 HTTPS 리디렉션 설정
- 모든 API 통신 HTTPS 사용

### 5-2. CORS 설정
- 허용된 도메인만 API 접근 가능
- 개발/스테이징/프로덕션 환경별 설정

## 6. 모니터링 및 알림

### 6-1. 보안 이벤트 모니터링
- 비정상적인 로그인 시도
- 대량 데이터 접근
- 권한 없는 접근 시도

### 6-2. 알림 설정
- 관리자에게 보안 이벤트 알림
- 시스템 오류 및 장애 알림

---

## ⚠️ 주의사항

1. **절대 하지 말아야 할 것:**
   - API 키를 코드에 하드코딩
   - 프로덕션 데이터베이스에 테스트 데이터 입력
   - 관리자 계정 정보 공유

2. **정기적으로 해야 할 것:**
   - 보안 규칙 검토 및 업데이트
   - 사용자 권한 정리
   - 접근 로그 분석

3. **배포 전 필수 체크:**
   - 모든 환경 변수 설정 확인
   - 보안 규칙 테스트
   - 권한별 기능 테스트 