# 🔔 무료 알림 시스템 설정 가이드

이 문서는 부품 관리 시스템에서 사용하는 **무료 알림 시스템**의 설정 방법을 안내합니다.

## 📋 **지원하는 알림 방식**

### ✅ **무료 알림 (추천)**
1. **브라우저 알림** - 즉시 적용, 설정 불필요
2. **텔레그램 봇** - 5분 설정, 완전 무료
3. **이메일 알림** - 10분 설정, 월 200통 무료

### 💰 **유료 알림**
4. **카카오톡 알림톡** - 딜러사 계약 필요, 건당 15-25원

---

## 🚀 **1단계: 브라우저 알림 (즉시 사용 가능)**

### **특징**
- ✅ **완전 무료**
- ✅ **즉시 적용**
- ✅ **설정 불필요**
- ⚠️ 브라우저가 열려있을 때만 작동

### **사용법**
1. 대시보드 접속
2. "실시간 알림 받기" 버튼 클릭
3. 브라우저에서 알림 허용

---

## 📱 **2단계: 텔레그램 봇 설정 (5분)**

### **특징**
- ✅ **완전 무료**
- ✅ **무제한 발송**
- ✅ **모바일 푸시 알림**
- ✅ **그룹 채팅 지원**

### **설정 방법**

#### **1) 텔레그램 봇 생성**
```
1. 텔레그램에서 @BotFather 검색
2. /newbot 명령 입력
3. 봇 이름 설정 (예: 부품관리시스템봇)
4. 봇 사용자명 설정 (예: parts_system_bot)
5. 받은 토큰 복사 (예: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
```

#### **2) 채팅 ID 확인**
```
1. 생성된 봇과 대화 시작 (/start 입력)
2. 브라우저에서 다음 URL 접속:
   https://api.telegram.org/bot<토큰>/getUpdates
3. "chat":{"id": 뒤의 숫자 복사 (예: 123456789)
```

#### **3) 환경 변수 설정**
```env
REACT_APP_TELEGRAM_BOT_TOKEN=bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz
REACT_APP_TELEGRAM_CHAT_ID=123456789
```

#### **4) 그룹 채팅 설정 (선택사항)**
```
1. 그룹 채팅 생성
2. 봇을 그룹에 초대
3. 그룹에서 메시지 발송 후 getUpdates로 그룹 ID 확인
4. 그룹 ID는 음수 (예: -123456789)
```

---

## 📧 **3단계: 이메일 알림 설정 (10분)**

### **특징**
- ✅ **월 200통 무료**
- ✅ **전문적인 이메일 템플릿**
- ✅ **첨부파일 지원**
- ⚠️ 월 200통 초과 시 유료

### **설정 방법**

#### **1) EmailJS 회원가입**
```
1. https://www.emailjs.com/ 접속
2. 무료 계정 생성
3. 이메일 인증 완료
```

#### **2) 이메일 서비스 연결**
```
1. Email Services 메뉴 클릭
2. Add New Service 클릭
3. Gmail/Outlook 등 선택
4. 계정 연결 및 인증
5. Service ID 복사 (예: service_xxxxxxx)
```

#### **3) 이메일 템플릿 생성**
```
1. Email Templates 메뉴 클릭
2. Create New Template 클릭
3. 다음 템플릿 사용:

제목: {{subject}}

안녕하세요 {{to_name}}님,

{{message}}

{{#action_url}}
처리하기: {{action_url}}
{{/action_url}}

감사합니다.
{{from_name}}

4. Template ID 복사 (예: template_xxxxxxx)
```

#### **4) Public Key 확인**
```
1. Account 메뉴 클릭
2. Public Key 복사 (예: xxxxxxxxxxxxxxx)
```

#### **5) 환경 변수 설정**
```env
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
```

---

## 🔧 **환경 변수 설정**

### **1) .env 파일 생성**
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Firebase 설정 (기존)
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# 텔레그램 봇 설정 (무료)
REACT_APP_TELEGRAM_BOT_TOKEN=bot123456789:ABCdefGHIjklMNOpqrsTUVwxyz
REACT_APP_TELEGRAM_CHAT_ID=123456789

# EmailJS 설정 (무료)
REACT_APP_EMAILJS_SERVICE_ID=service_xxxxxxx
REACT_APP_EMAILJS_TEMPLATE_ID=template_xxxxxxx
REACT_APP_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx

# 카카오톡 설정 (유료, 선택사항)
REACT_APP_API_URL=http://localhost:3001
```

### **2) 애플리케이션 재시작**
```bash
npm start
```

---

## 🧪 **테스트 방법**

### **1) 관리자 계정으로 로그인**
```
이메일: admin@example.com
비밀번호: admin123
```

### **2) 알림 테스트 페이지 접속**
```
좌측 메뉴 → "🔔 알림 시스템 테스트"
```

### **3) 각 알림 방식 테스트**
1. **브라우저 알림**: 권한 허용 후 테스트 버튼 클릭
2. **텔레그램**: 봇 상태 확인 → 알림 테스트
3. **이메일**: 서비스 상태 확인 → 알림 테스트

---

## 📊 **비용 비교**

| 알림 방식 | 초기 설정 | 월 비용 | 발송 한도 | 특징 |
|-----------|-----------|---------|-----------|------|
| 브라우저 | 0분 | 무료 | 무제한 | 즉시 적용 |
| 텔레그램 | 5분 | 무료 | 무제한 | 모바일 푸시 |
| 이메일 | 10분 | 무료 | 200통/월 | 전문적 |
| 카카오톡 | 1-2주 | 15-25원/건 | 무제한 | 높은 도달률 |

---

## 🔍 **문제 해결**

### **텔레그램 봇이 작동하지 않을 때**
1. 봇 토큰이 정확한지 확인
2. 채팅 ID가 정확한지 확인
3. 봇과 대화를 시작했는지 확인
4. 콘솔에서 오류 메시지 확인

### **이메일이 발송되지 않을 때**
1. EmailJS 계정이 활성화되었는지 확인
2. 이메일 서비스가 연결되었는지 확인
3. 템플릿이 올바르게 생성되었는지 확인
4. 월 발송 한도를 초과하지 않았는지 확인

### **브라우저 알림이 표시되지 않을 때**
1. 브라우저에서 알림을 허용했는지 확인
2. 브라우저 설정에서 사이트 알림이 차단되지 않았는지 확인
3. 방해 금지 모드가 활성화되지 않았는지 확인

---

## 🎯 **추천 설정**

### **소규모 팀 (5명 이하)**
- ✅ 브라우저 알림
- ✅ 텔레그램 봇 (그룹 채팅)

### **중간 규모 팀 (5-20명)**
- ✅ 브라우저 알림
- ✅ 텔레그램 봇
- ✅ 이메일 알림

### **대규모 팀 (20명 이상)**
- ✅ 브라우저 알림
- ✅ 텔레그램 봇
- ✅ 이메일 알림
- 💰 카카오톡 알림톡 (예산 허용 시)

---

## 📞 **지원**

문제가 발생하거나 추가 설정이 필요한 경우:
1. 콘솔 로그 확인
2. 네트워크 탭에서 API 호출 상태 확인
3. 환경 변수 설정 재확인

**개발 환경에서는 모든 알림이 시뮬레이션으로 작동하며, 실제 발송되지 않습니다.** 