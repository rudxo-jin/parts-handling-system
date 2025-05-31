import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

// 초기 지점 데이터
const initialBranches = [
  {
    id: 'branch-001',
    name: '서울본점',
    code: 'SEL001',
    address: '서울특별시 강남구 테헤란로 123',
    phone: '02-1234-5678',
    manager: '김지점',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'branch-002',
    name: '부산지점',
    code: 'BSN001',
    address: '부산광역시 해운대구 센텀로 456',
    phone: '051-9876-5432',
    manager: '이지점',
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: 'branch-003',
    name: '대구지점',
    code: 'DGU001',
    address: '대구광역시 수성구 동대구로 789',
    phone: '053-5555-1234',
    manager: '박지점',
    isActive: true,
    createdAt: new Date(),
  },
];

// 초기 부품 카테고리
const initialCategories = [
  { id: 'cat-001', name: '엔진부품', code: 'ENG', description: '엔진 관련 부품' },
  { id: 'cat-002', name: '전기부품', code: 'ELE', description: '전기 시스템 부품' },
  { id: 'cat-003', name: '브레이크', code: 'BRK', description: '제동 시스템 부품' },
  { id: 'cat-004', name: '서스펜션', code: 'SUS', description: '현가 장치 부품' },
  { id: 'cat-005', name: '타이어', code: 'TIR', description: '타이어 및 휠 관련' },
];

// 초기 부품 데이터 (샘플)
const initialParts = [
  {
    id: 'part-001',
    partNumber: 'ENG-001-001',
    name: '엔진오일 필터',
    category: 'cat-001',
    description: '고성능 엔진오일 필터',
    unit: '개',
    standardPrice: 15000,
    supplier: '현대부품',
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'part-002',
    partNumber: 'ELE-002-001',
    name: '배터리',
    category: 'cat-002',
    description: '12V 자동차 배터리',
    unit: '개',
    standardPrice: 120000,
    supplier: '삼성배터리',
    status: 'active',
    createdAt: new Date(),
  },
  {
    id: 'part-003',
    partNumber: 'BRK-003-001',
    name: '브레이크 패드',
    category: 'cat-003',
    description: '전륜 브레이크 패드 세트',
    unit: '세트',
    standardPrice: 45000,
    supplier: '만도부품',
    status: 'active',
    createdAt: new Date(),
  },
];

// 초기 관리자 사용자
const initialAdmin = {
  email: 'admin@company.com',
  password: 'Admin123!@#',
  userData: {
    name: '시스템 관리자',
    role: 'admin' as const,
    department: '정보시스템팀',
    phone: '02-1234-5678',
    isActive: true,
    createdAt: new Date(),
    lastLoginAt: null,
  }
};

// 초기 테스트 사용자들
const initialUsers = [
  {
    email: 'operations@company.com',
    password: 'Ops123!@#',
    userData: {
      name: '운영담당자',
      role: 'operations' as const,
      department: '운영사업본부',
      phone: '02-1234-5679',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: null,
    }
  },
  {
    email: 'logistics@company.com',
    password: 'Log123!@#',
    userData: {
      name: '물류담당자',
      role: 'logistics' as const,
      department: '유통사업본부',
      phone: '02-1234-5680',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: null,
    }
  },
];

// 데이터 초기화 함수들
export const initializeBranches = async () => {
  console.log('🏢 지점 데이터 초기화 중...');
  
  for (const branch of initialBranches) {
    try {
      await setDoc(doc(db, 'branches', branch.id), branch);
      console.log(`✅ 지점 생성: ${branch.name}`);
    } catch (error) {
      console.error(`❌ 지점 생성 실패 (${branch.name}):`, error);
    }
  }
};

export const initializeCategories = async () => {
  console.log('📂 카테고리 데이터 초기화 중...');
  
  for (const category of initialCategories) {
    try {
      await setDoc(doc(db, 'categories', category.id), {
        ...category,
        createdAt: new Date(),
        isActive: true,
      });
      console.log(`✅ 카테고리 생성: ${category.name}`);
    } catch (error) {
      console.error(`❌ 카테고리 생성 실패 (${category.name}):`, error);
    }
  }
};

export const initializeParts = async () => {
  console.log('🔧 부품 데이터 초기화 중...');
  
  for (const part of initialParts) {
    try {
      await setDoc(doc(db, 'parts', part.id), part);
      console.log(`✅ 부품 생성: ${part.name}`);
    } catch (error) {
      console.error(`❌ 부품 생성 실패 (${part.name}):`, error);
    }
  }
};

export const initializeAdmin = async () => {
  console.log('👤 관리자 계정 초기화 중...');
  
  try {
    // 이미 해당 이메일로 등록된 사용자가 있는지 확인
    const existingUserQuery = query(
      collection(db, 'users'),
      where('email', '==', initialAdmin.email)
    );
    const existingUserSnapshot = await getDocs(existingUserQuery);
    
    if (!existingUserSnapshot.empty) {
      console.log('⚠️ 관리자 계정이 이미 존재합니다:', initialAdmin.email);
      return;
    }
    
    // 관리자 계정 생성
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      initialAdmin.email,
      initialAdmin.password
    );
    
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      ...initialAdmin.userData,
      uid: userCredential.user.uid,
      email: initialAdmin.email,
    });
    
    console.log('✅ 관리자 계정 생성 완료');
    console.log(`📧 이메일: ${initialAdmin.email}`);
    console.log(`🔑 비밀번호: ${initialAdmin.password}`);
    
  } catch (error: any) {
    if (error?.code === 'auth/email-already-in-use') {
      console.log('⚠️ 관리자 이메일이 이미 사용 중입니다:', initialAdmin.email);
      console.log('🔄 기존 계정을 사용하거나 다른 이메일을 사용하세요.');
    } else {
      console.error('❌ 관리자 계정 생성 실패:', error);
    }
  }
};

export const initializeTestUsers = async () => {
  console.log('👥 테스트 사용자 계정 초기화 중...');
  
  for (const user of initialUsers) {
    try {
      // 이미 해당 이메일로 등록된 사용자가 있는지 확인
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', user.email)
      );
      const existingUserSnapshot = await getDocs(existingUserQuery);
      
      if (!existingUserSnapshot.empty) {
        console.log(`⚠️ 사용자가 이미 존재합니다: ${user.userData.name} (${user.email})`);
        continue; // 다음 사용자로 넘어감
      }
      
      // 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      
      // Firestore에 사용자 정보 저장
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        ...user.userData,
        uid: userCredential.user.uid,
        email: user.email,
      });
      
      console.log(`✅ 사용자 생성: ${user.userData.name} (${user.email})`);
      
    } catch (error: any) {
      if (error?.code === 'auth/email-already-in-use') {
        console.log(`⚠️ 이메일이 이미 사용 중입니다: ${user.email}`);
        console.log(`🔄 사용자 ${user.userData.name}의 기존 계정을 사용합니다.`);
      } else {
        console.error(`❌ 사용자 생성 실패 (${user.email}):`, error);
      }
    }
  }
};

// 전체 초기화 실행
export const initializeAllData = async () => {
  console.log('🚀 시스템 데이터 초기화 시작...');
  
  try {
    await initializeBranches();
    await initializeCategories();
    await initializeParts();
    await initializeAdmin();
    await initializeTestUsers();
    
    console.log('🎉 시스템 데이터 초기화 완료!');
    console.log('');
    console.log('📋 생성된 계정 정보:');
    console.log('👤 관리자: admin@company.com / Admin123!@#');
    console.log('🏢 운영담당자: operations@company.com / Ops123!@#');
    console.log('🚚 물류담당자: logistics@company.com / Log123!@#');
    console.log('');
    console.log('⚠️ 보안을 위해 배포 후 비밀번호를 변경하세요!');
    
  } catch (error) {
    console.error('❌ 초기화 중 오류 발생:', error);
  }
};

// 개발 환경에서만 실행되도록 체크
export const runInitialization = () => {
  if (process.env.REACT_APP_ENVIRONMENT === 'development') {
    console.log('🔧 개발 환경에서 초기화 실행');
    initializeAllData();
  } else {
    console.log('⚠️ 프로덕션 환경에서는 초기화를 실행하지 않습니다.');
  }
}; 