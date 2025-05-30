# 네이버 메일 연동 설정 가이드

## 🔧 **1단계: EmailJS 계정 생성**

### **1) EmailJS 회원가입**
```
1. https://www.emailjs.com/ 접속
2. "Sign Up" 클릭
3. 이메일/비밀번호로 계정 생성
4. 이메일 인증 완료
```

### **2) 무료 플랜 확인**
```
✅ 월 200통 무료
✅ 무제한 템플릿
✅ 기본 지원
```

---

## 📮 **2단계: 네이버 메일 서비스 연결**

### **1) 네이버 계정 보안 설정**
```
1. 네이버 로그인 → 내정보
2. 보안설정 → 2단계 인증 설정
3. 앱 비밀번호 → 새 앱 비밀번호 생성
4. 앱 이름: "부품관리시스템"
5. 생성된 16자리 비밀번호 복사 (예: abcd efgh ijkl mnop)
```

### **2) EmailJS 서비스 추가**
```
1. EmailJS 대시보드 → Email Services
2. "Add New Service" 클릭
3. "Other (SMTP)" 선택
4. 다음 정보 입력:

Service ID: service_naver_mail
Service Name: 네이버 메일
SMTP Server: smtp.naver.com
Port: 587
Security: TLS
Username: your_naver_id@naver.com
Password: [위에서 생성한 앱 비밀번호]
From Name: 부품관리시스템
From Email: your_naver_id@naver.com
```

### **3) 연결 테스트**
```
1. "Test" 버튼 클릭
2. 테스트 이메일 발송 확인
3. "Create" 버튼으로 서비스 생성
4. Service ID 복사 (예: service_abc123)
```

---

## 📝 **3단계: 이메일 템플릿 생성**

### **1) 템플릿 추가**
```
1. EmailJS 대시보드 → Email Templates
2. "Create New Template" 클릭
3. Template Name: "부품관리 알림"
```

### **2) 템플릿 내용**
```
Subject: {{subject}}

To: {{to_name}} <{{to_email}}>
From: {{from_name}} <{{from_email}}>

---

안녕하세요 {{to_name}}님,

{{message}}

{{#action_url}}
🔗 처리하기: {{action_url}}
{{/action_url}}

---
발송시간: {{sent_time}}
발송자: {{from_name}}

이 메일은 부품관리시스템에서 자동으로 발송되었습니다.
```

### **3) 템플릿 저장**
```
1. "Save" 클릭
2. Template ID 복사 (예: template_xyz789)
```

---

## 🔑 **4단계: Public Key 확인**

```
1. EmailJS 대시보드 → Account
2. "Public Key" 복사 (예: user_abcdefghijk)
```

---

## 📁 **5단계: 환경 변수 설정**

### **1) .env 파일 생성**
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용 추가:

```env
# Firebase 설정 (기존 값 유지)
REACT_APP_FIREBASE_API_KEY=your_existing_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_existing_domain
REACT_APP_FIREBASE_PROJECT_ID=your_existing_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_existing_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_existing_sender_id
REACT_APP_FIREBASE_APP_ID=your_existing_app_id

# 네이버 이메일 알림 설정
REACT_APP_EMAILJS_SERVICE_ID=service_abc123
REACT_APP_EMAILJS_TEMPLATE_ID=template_xyz789
REACT_APP_EMAILJS_PUBLIC_KEY=user_abcdefghijk

# 개발 환경
NODE_ENV=development
```

### **2) 실제 값으로 교체**
- `service_abc123` → 실제 Service ID
- `template_xyz789` → 실제 Template ID  
- `user_abcdefghijk` → 실제 Public Key

---

## 🧪 **6단계: 테스트**

### **1) 서버 재시작**
```bash
npm start
```

### **2) 알림 테스트 페이지 접속**
```
http://localhost:3000/admin/notification-test
```

### **3) 이메일 서비스 상태 확인**
```
1. "이메일 서비스 상태 확인" 버튼 클릭
2. 연결 상태 확인
```

### **4) 실제 이메일 발송 테스트**
```
1. 수신자 이메일: kt9411@naver.com (관리자 이메일)
2. "구매 요청 생성 알림 테스트" 버튼 클릭
3. 네이버 메일함 확인
```

---

## ⚠️ **주의사항**

### **보안**
- 앱 비밀번호는 절대 공유하지 마세요
- .env 파일은 Git에 커밋하지 마세요

### **제한사항**
- 월 200통 무료 (초과 시 유료)
- 네이버 메일 SMTP 일일 발송 제한 있음

### **문제 해결**
- 인증 실패: 앱 비밀번호 재생성
- 발송 실패: SMTP 설정 재확인
- 템플릿 오류: 변수명 확인

---

## 📞 **지원**

문제가 발생하면:
1. 개발자 도구(F12) → Console 탭에서 오류 확인
2. EmailJS 대시보드에서 발송 로그 확인
3. 네이버 메일 설정 재확인 