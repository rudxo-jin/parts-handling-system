# 🚀 Parts Handling System - 엔터프라이즈급 부품 관리 시스템

[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)](https://github.com/rudxo-jin/parts-handling-system)
[![Version](https://img.shields.io/badge/Version-v4.0.0-blue.svg)](https://github.com/rudxo-jin/parts-handling-system/releases/tag/v4.0.0)
[![Firebase](https://img.shields.io/badge/Firebase-Powered-orange.svg)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.x-0081CB.svg)](https://mui.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple.svg)](https://web.dev/progressive-web-apps/)

Firebase와 React를 기반으로 한 **엔터프라이즈급 부품 관리 시스템**입니다. 4단계에 걸쳐 개발되어 성능 최적화, 보안 강화, PWA 지원까지 완성된 프로덕션 레디 시스템입니다.

## ✨ 주요 기능

### 🏢 **핵심 비즈니스 기능**
- **신규 부품 등록 및 구매 요청**: 체계적인 부품 정보 관리
- **다중 부품 일괄 처리**: Excel 업로드를 통한 대량 데이터 처리
- **역할 기반 접근 제어**: Admin, Operations, Logistics 역할별 권한 관리
- **실시간 알림 시스템**: 구매 요청 상태 변경 시 즉시 알림
- **지점별 관리**: 다중 지점 운영 지원

### 📊 **4단계 고급 기능**
- **번들 분석기**: Core Web Vitals 실시간 모니터링
- **보안 검사기**: 8가지 보안 항목 자동 검증
- **성능 대시보드**: 시스템 성능 종합 모니터링
- **CSP 관리**: Content Security Policy 시각적 편집
- **PWA 지원**: 앱과 같은 사용자 경험

### 🔧 **개발자 도구**
- **시스템 테스트**: 자동화된 무결성 검증
- **에러 추적**: 체계적인 에러 분류 및 처리
- **성능 리포트**: 다운로드 가능한 JSON 리포트
- **키보드 단축키**: 개발자 친화적 인터페이스

## 🏗️ 기술 스택

### **Frontend**
- **React 18** - 최신 React 기능 활용
- **TypeScript** - 타입 안전성 보장
- **Material-UI 5** - Google Material Design
- **React Router** - SPA 라우팅

### **Backend & Infrastructure**
- **Firebase Authentication** - 안전한 사용자 인증
- **Firestore** - NoSQL 데이터베이스
- **Firebase Storage** - 파일 저장소
- **Firebase Hosting** - 정적 호스팅

### **Performance & Security**
- **Service Worker** - 오프라인 지원
- **Bundle Analyzer** - 성능 최적화
- **Content Security Policy** - XSS 방지
- **Core Web Vitals** - Google 성능 지표

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/rudxo-jin/parts-handling-system.git
cd parts-handling-system
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 4. 개발 서버 실행
```bash
npm start
```

### 5. 프로덕션 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
src/
├── components/           # UI 컴포넌트
│   ├── Layout/          # 레이아웃 컴포넌트
│   ├── BundleAnalyzer.tsx    # 번들 분석기
│   ├── SecurityChecker.tsx   # 보안 검사기
│   ├── PerformanceDashboard.tsx # 성능 대시보드
│   └── SystemTest.tsx        # 시스템 테스트
├── hooks/               # 커스텀 훅
│   ├── useBundleAnalyzer.ts  # 번들 분석 훅
│   ├── usePerformanceMonitor.ts # 성능 모니터링
│   ├── useToast.ts          # 토스트 알림
│   └── useConfirmDialog.ts   # 확인 다이얼로그
├── pages/               # 페이지 컴포넌트
├── services/            # 비즈니스 로직
├── contexts/            # React Context
├── types/               # TypeScript 타입
└── scripts/             # 유틸리티 스크립트
```

## 🎯 성능 지표

### **Core Web Vitals**
- ✅ First Contentful Paint: < 1.8초
- ✅ Largest Contentful Paint: < 2.5초  
- ✅ First Input Delay: < 100ms
- ✅ Cumulative Layout Shift: < 0.1

### **번들 최적화**
- ✅ 총 번들 크기: < 2MB
- ✅ JavaScript 번들: < 1MB
- ✅ 캐시 효율성: > 70%
- ✅ 메모리 사용량: < 50MB

### **보안 점수**
- ✅ 보안 검사 점수: > 80점
- ✅ HTTPS 연결: 필수
- ✅ CSP 헤더: 설정됨
- ✅ Firebase 보안 규칙: 적용됨

## 🔒 보안

### **인증 & 인가**
- Firebase Authentication 기반 안전한 로그인
- 역할 기반 접근 제어 (RBAC)
- JWT 토큰 기반 세션 관리

### **데이터 보안**
- Firestore 보안 규칙 적용
- 환경 변수를 통한 민감 정보 관리
- 클라이언트 사이드 데이터 검증

### **웹 보안**
- Content Security Policy (CSP) 적용
- XSS 방지 헤더 설정
- HTTPS 강제 사용

## 📱 PWA 기능

- **오프라인 지원**: Service Worker 기반
- **앱 설치**: 데스크톱/모바일 설치 가능
- **푸시 알림**: 실시간 업데이트 알림
- **앱과 같은 UX**: 네이티브 앱 경험

## 🛠️ 개발 가이드

### **시스템 테스트 실행**
```bash
# 관리자 계정으로 로그인 후
# /admin/system-test 경로에서 전체 테스트 실행
```

### **성능 분석**
```bash
# /admin/bundle-analyzer에서 실시간 성능 확인
# Core Web Vitals 및 번들 크기 분석
```

### **보안 검사**
```bash
# /admin/security에서 보안 상태 확인
# CSP 설정 및 취약점 검사
```

## 📚 문서

- **[Stage 1 Guide](docs/STAGE1_SYSTEM_FOUNDATION.md)** - 시스템 기초 구축
- **[Stage 2 Guide](docs/STAGE2_PERFORMANCE_MONITORING.md)** - 성능 모니터링
- **[Stage 3 Guide](docs/STAGE3_UI_UX_IMPROVEMENTS.md)** - UI/UX 개선
- **[Stage 4 Guide](docs/STAGE4_PRODUCTION_DEPLOYMENT.md)** - 프로덕션 배포
- **[Deployment Guide](DEPLOYMENT_SECURITY_GUIDE.md)** - 배포 및 보안 가이드

## 🚀 배포

### **Firebase 배포**
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화
firebase init

# 프로덕션 배포
npm run build
firebase deploy
```

### **환경별 설정**
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경

## 🏆 4단계 개발 완료

### **Stage 1** - 시스템 기초 ✅
- 기본 CRUD 기능
- 사용자 인증
- 데이터베이스 설계

### **Stage 2** - 성능 모니터링 ✅
- 실시간 성능 측정
- 에러 추적 시스템
- 알림 기능

### **Stage 3** - UI/UX 개선 ✅
- 토스트 알림
- 확인 다이얼로그
- PWA 지원

### **Stage 4** - 프로덕션 준비 ✅
- 번들 분석기
- 보안 검사기
- 성능 최적화

## 🤝 기여하기

1. 이 저장소를 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👨‍💻 개발자

**rudxo-jin** - [GitHub](https://github.com/rudxo-jin)

## 🙏 감사의 말

- Firebase - 백엔드 인프라 제공
- Material-UI - 아름다운 UI 컴포넌트
- React 팀 - 훌륭한 프론트엔드 프레임워크

---

⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!

**엔터프라이즈급 부품 관리 시스템 - Production Ready v4.0.0** 🚀
