# 신규 부품 취급 업무 자동화 시스템

## 시스템 개요

신규 부품 도입 요청부터 지점(매장) 최종 입고 확인까지의 전 과정을 자동화하고 추적하여, 업무 효율성 및 정확성을 증대시키고, 축적된 데이터를 통해 개선점을 도출하여 데이터 기반의 의사결정을 지원하는 웹 기반 시스템입니다.

## 주요 특징

### 🎯 핵심 목표
- 신규 부품 도입 프로세스 자동화
- 실시간 진행 상황 추적
- 데이터 기반 의사결정 지원
- 업무 효율성 및 정확성 향상

### 👥 사용자 역할
- **운영사업본부**: 신규 부품 요청 및 관리
- **유통사업본부(물류)**: 물류 프로세스 관리
- **시스템 관리자**: 전체 시스템 관리 및 사용자 권한 관리

### 🛠 주요 모듈

#### 1. 대시보드
- 역할별 맞춤형 실시간 현황판
- 처리 필요 업무 및 주요 알림
- 핵심 지표 요약 차트/그래프
- 깔끔하고 단순한 디자인

#### 2. 부품 관리
- 신규 부품 정보 등록 (사용자 친화적 UI/UX)
- 전체 부품 목록 조회 및 검색/필터/정렬
- 기존 부품 정보 수정
- 부품 활성화/비활성화 관리

#### 3. 구매 요청 관리
- 전체 구매 프로세스 추적:
  - 운영부 요청 → 이카운트 등록 → 구매처 발주
  - 물류창고 입고 → 지점 출고 → 지점 입고 확인
- 각 단계별 상세 정보 입력 및 관리
- 구매 요청 목록 조회 및 상세 조회

#### 4. 보고서
- 주요 운영 지표 분석 보고서
- 다양한 조회 조건 설정
- 다중 형식 내보내기 (Excel, PDF, Markdown)
- 데이터 시각화 및 상세 테이블

#### 5. 알림 시스템
- 실시간 업무 상태 변경 알림
- Firebase Cloud Functions 활용
- 알림 센터에서 이력 관리

#### 6. 관리자 기능
- 사용자 계정 관리
- 지점(매장) 정보 관리
- 시스템 전반 관리

## 기술 스택

### Frontend
- **React 19** with TypeScript
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **React Router** - 페이지 라우팅
- **Recharts** - 데이터 시각화

### Backend & Database
- **Firebase Firestore** - NoSQL 데이터베이스
- **Firebase Authentication** - 사용자 인증
- **Firebase Cloud Functions** - 서버리스 백엔드 로직
- **Firebase Storage** - 파일 저장

### Development
- **TypeScript** - 타입 안전성
- **ESLint** - 코드 품질 관리
- **Create React App** - 프로젝트 설정

## 설치 및 실행

### 필요 조건
- Node.js 16.x 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### Firebase 설정
1. Firebase 프로젝트 생성
2. 환경 변수 파일 생성 (`.env`)
```env
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 개발 서버 실행
```bash
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속

### 빌드
```bash
npm run build
```

## 데모 계정

테스트를 위한 데모 계정:
- **운영사업본부**: operations@company.com / password123
- **유통사업본부**: logistics@company.com / password123
- **관리자**: admin@company.com / password123

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   └── Layout/         # 레이아웃 컴포넌트
├── contexts/           # React Context (인증 등)
├── pages/              # 페이지 컴포넌트
├── types/              # TypeScript 타입 정의
├── firebase.ts         # Firebase 설정
└── App.tsx            # 메인 앱 컴포넌트
```

## 주요 설계 원칙

### UI/UX
- 사용자 중심의 직관적이고 단순한 디자인
- 입력 편의성 극대화 (클릭 최소화, 자동계산 등)
- 명확한 피드백 제공
- 반응형 디자인

### 기능
- 역할 기반 접근 제어
- 실시간 데이터 동기화
- 오프라인 지원 고려
- 확장 가능한 아키텍처

## 개발 가이드

### 코드 스타일
- TypeScript 엄격 모드 사용
- ESLint 규칙 준수
- 컴포넌트별 타입 정의
- 명확한 변수명 및 함수명 사용

### 상태 관리
- React Context for global state
- useState for local state
- 비동기 작업은 useEffect와 함께 관리

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 연락처

프로젝트 문의사항이 있으시면 이슈를 등록해 주세요.
