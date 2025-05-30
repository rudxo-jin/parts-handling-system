import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  MultiPartRequest, 
  MultiPartProgress, 
  PurchaseRequest, 
  BranchRequirement 
} from '../types';

// 세트 ID 생성 함수
export const generateSetId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `SET-${timestamp}-${randomStr}`.toUpperCase();
};

// 개별 부품 여러 건 등록 (세트 없이)
export const createIndividualPartsRequest = async (
  parts: Array<{
    partNumber: string;
    partName: string;
    itemGroup1?: string;
    itemGroup2?: string;
    itemGroup3?: string;
    price?: number;
    currency?: string;
    branchRequirements: BranchRequirement[];
    logisticsStockQuantity: number;
    importance: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }>,
  requestorUid: string,
  requestorName: string
): Promise<{ partRequestIds: string[] }> => {
  const batch = writeBatch(db);
  const partRequestIds: string[] = [];

  try {
    // 개별 부품들을 PurchaseRequest로 생성 (세트 정보 없이)
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // 고유한 타임스탬프와 랜덤 문자열로 ID 생성
      const timestamp = Date.now() + i; // 각 부품마다 다른 타임스탬프
      const randomStr = Math.random().toString(36).substring(2, 8);
      const requestId = `REQ-${timestamp}-${randomStr}`.toUpperCase();
      
      const totalRequestedQuantity = part.branchRequirements.reduce(
        (sum, req) => sum + Number(req.requestedQuantity), 0
      ) + part.logisticsStockQuantity;

      const purchaseRequest: Omit<PurchaseRequest, 'id'> = {
        requestId,
        internalPartId: `PART-${timestamp}-${randomStr}`,
        requestedPartNumber: part.partNumber,
        requestedPartName: part.partName,
        requestorUid,
        requestorName,
        requestDate: new Date(),
        importance: part.importance,
        branchRequirements: part.branchRequirements,
        logisticsStockQuantity: part.logisticsStockQuantity,
        totalRequestedQuantity,
        initialSupplier: undefined,
        price: part.price,
        currency: part.currency || 'KRW',
        
        // 세트 관련 필드 (개별 등록이므로 undefined/false)
        setId: undefined,
        setName: undefined,
        isPartOfSet: false,
        partOrderInSet: undefined,
        
        // 상태 필드
        currentStatus: 'operations_submitted',
        currentResponsibleTeam: 'logistics',
        
        // 품목그룹 정보
        itemGroup1: part.itemGroup1,
        itemGroup2: part.itemGroup2,
        itemGroup3: part.itemGroup3,
        
        statusHistory: [{
          status: 'operations_submitted',
          updatedAt: new Date(),
          updatedByUid: requestorUid,
          updatedByName: requestorName,
          comments: '개별 부품 요청',
        }],
        
        notes: part.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestore에 추가할 때 Date를 Timestamp로 변환
      const firestoreData = {
        ...purchaseRequest,
        requestDate: Timestamp.fromDate(purchaseRequest.requestDate),
        createdAt: Timestamp.fromDate(purchaseRequest.createdAt),
        updatedAt: Timestamp.fromDate(purchaseRequest.updatedAt),
        statusHistory: purchaseRequest.statusHistory.map(history => ({
          ...history,
          updatedAt: Timestamp.fromDate(history.updatedAt),
        })),
      };

      // undefined 값들을 제거
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      const partRef = doc(collection(db, 'purchaseRequests'));
      batch.set(partRef, firestoreData);
      partRequestIds.push(partRef.id);
    }

    // 배치 커밋
    await batch.commit();

    return { partRequestIds };
  } catch (error) {
    console.error('개별 부품 요청 생성 실패:', error);
    throw error;
  }
};

// 다중 부품 요청 생성
export const createMultiPartRequest = async (
  setData: {
    setName: string;
    setDescription?: string;
    requestorUid: string;
    requestorName: string;
    importance: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  },
  parts: Array<{
    partNumber: string;
    partName: string;
    itemGroup1?: string;
    itemGroup2?: string;
    itemGroup3?: string;
    price?: number;
    currency?: string;
    branchRequirements: BranchRequirement[];
    logisticsStockQuantity: number;
  }>
): Promise<{ setId: string; partRequestIds: string[] }> => {
  const batch = writeBatch(db);
  const setId = generateSetId();
  const partRequestIds: string[] = [];

  try {
    // 1. 개별 부품들을 PurchaseRequest로 생성
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // 고유한 타임스탬프와 랜덤 문자열로 ID 생성
      const timestamp = Date.now() + i; // 각 부품마다 다른 타임스탬프
      const randomStr = Math.random().toString(36).substring(2, 8);
      const requestId = `REQ-${timestamp}-${randomStr}`.toUpperCase();
      
      const totalRequestedQuantity = part.branchRequirements.reduce(
        (sum, req) => sum + Number(req.requestedQuantity), 0
      ) + part.logisticsStockQuantity;

      const purchaseRequest: Omit<PurchaseRequest, 'id'> = {
        requestId,
        internalPartId: `PART-${timestamp}-${randomStr}`,
        requestedPartNumber: part.partNumber,
        requestedPartName: part.partName,
        requestorUid: setData.requestorUid,
        requestorName: setData.requestorName,
        requestDate: new Date(),
        importance: setData.importance,
        branchRequirements: part.branchRequirements,
        logisticsStockQuantity: part.logisticsStockQuantity,
        totalRequestedQuantity,
        initialSupplier: undefined,
        price: part.price,
        currency: part.currency || 'KRW',
        
        // 세트 관련 필드
        setId,
        setName: setData.setName,
        isPartOfSet: true,
        partOrderInSet: i + 1,
        
        // 상태 필드
        currentStatus: 'operations_submitted',
        currentResponsibleTeam: 'logistics',
        
        // 품목그룹 정보
        itemGroup1: part.itemGroup1,
        itemGroup2: part.itemGroup2,
        itemGroup3: part.itemGroup3,
        
        statusHistory: [{
          status: 'operations_submitted',
          updatedAt: new Date(),
          updatedByUid: setData.requestorUid,
          updatedByName: setData.requestorName,
          comments: `세트 요청: ${setData.setName}`,
        }],
        
        notes: setData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestore에 추가할 때 Date를 Timestamp로 변환
      const firestoreData = {
        ...purchaseRequest,
        requestDate: Timestamp.fromDate(purchaseRequest.requestDate),
        createdAt: Timestamp.fromDate(purchaseRequest.createdAt),
        updatedAt: Timestamp.fromDate(purchaseRequest.updatedAt),
        statusHistory: purchaseRequest.statusHistory.map(history => ({
          ...history,
          updatedAt: Timestamp.fromDate(history.updatedAt),
        })),
      };

      // undefined 값들을 제거
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key as keyof typeof firestoreData] === undefined) {
          delete firestoreData[key as keyof typeof firestoreData];
        }
      });

      const partRef = doc(collection(db, 'purchaseRequests'));
      batch.set(partRef, firestoreData);
      partRequestIds.push(partRef.id);
    }

    // 2. 세트 정보 저장
    const multiPartRequest: Omit<MultiPartRequest, 'id'> = {
      setId,
      setName: setData.setName,
      setDescription: setData.setDescription,
      requestorUid: setData.requestorUid,
      requestorName: setData.requestorName,
      requestDate: new Date(),
      importance: setData.importance,
      overallStatus: 'in_progress',
      completedPartsCount: 0,
      totalPartsCount: parts.length,
      partRequestIds,
      allowPartialDispatch: true,
      notes: setData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Firestore에 추가할 때 Date를 Timestamp로 변환
    const multiPartFirestoreData = {
      ...multiPartRequest,
      requestDate: Timestamp.fromDate(multiPartRequest.requestDate),
      createdAt: Timestamp.fromDate(multiPartRequest.createdAt),
      updatedAt: Timestamp.fromDate(multiPartRequest.updatedAt),
    };

    // undefined 값들을 제거
    Object.keys(multiPartFirestoreData).forEach(key => {
      if (multiPartFirestoreData[key as keyof typeof multiPartFirestoreData] === undefined) {
        delete multiPartFirestoreData[key as keyof typeof multiPartFirestoreData];
      }
    });

    const setRef = doc(collection(db, 'multiPartRequests'));
    batch.set(setRef, multiPartFirestoreData);

    // 3. 배치 커밋
    await batch.commit();

    return { setId, partRequestIds };
  } catch (error) {
    console.error('다중 부품 요청 생성 실패:', error);
    throw error;
  }
};

// 세트 진행 상황 조회
export const getMultiPartProgress = async (setId: string): Promise<MultiPartProgress | null> => {
  try {
    // 1. 세트 정보 조회
    const setQuery = query(
      collection(db, 'multiPartRequests'),
      where('setId', '==', setId)
    );
    const setSnapshot = await getDocs(setQuery);
    
    if (setSnapshot.empty) {
      return null;
    }

    const setData = setSnapshot.docs[0].data() as MultiPartRequest;

    // 2. 개별 부품들의 상태 조회
    const partsQuery = query(
      collection(db, 'purchaseRequests'),
      where('setId', '==', setId),
      orderBy('partOrderInSet', 'asc')
    );
    const partsSnapshot = await getDocs(partsQuery);

    let completedParts = 0;
    let inProgressParts = 0;
    let pendingParts = 0;

    partsSnapshot.docs.forEach(doc => {
      const part = doc.data() as PurchaseRequest;
      switch (part.currentStatus) {
        case 'branch_received_confirmed':
          completedParts++;
          break;
        case 'operations_submitted':
          pendingParts++;
          break;
        default:
          inProgressParts++;
          break;
      }
    });

    const totalParts = partsSnapshot.docs.length;
    const progressPercentage = totalParts > 0 ? (completedParts / totalParts) * 100 : 0;

    return {
      setId,
      setName: setData.setName,
      totalParts,
      completedParts,
      inProgressParts,
      pendingParts,
      progressPercentage,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('세트 진행 상황 조회 실패:', error);
    throw error;
  }
};

// 세트 상태 업데이트
export const updateMultiPartStatus = async (setId: string): Promise<void> => {
  try {
    const progress = await getMultiPartProgress(setId);
    if (!progress) return;

    let newStatus: 'in_progress' | 'partial_complete' | 'complete';
    
    if (progress.completedParts === progress.totalParts) {
      newStatus = 'complete';
    } else if (progress.completedParts > 0) {
      newStatus = 'partial_complete';
    } else {
      newStatus = 'in_progress';
    }

    // 세트 상태 업데이트
    const setQuery = query(
      collection(db, 'multiPartRequests'),
      where('setId', '==', setId)
    );
    const setSnapshot = await getDocs(setQuery);
    
    if (!setSnapshot.empty) {
      const setDocRef = setSnapshot.docs[0].ref;
      await updateDoc(setDocRef, {
        overallStatus: newStatus,
        completedPartsCount: progress.completedParts,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('세트 상태 업데이트 실패:', error);
    throw error;
  }
};

// 사용자의 세트 목록 조회
export const getUserMultiPartRequests = async (userUid: string): Promise<MultiPartRequest[]> => {
  try {
    const q = query(
      collection(db, 'multiPartRequests'),
      where('requestorUid', '==', userUid),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MultiPartRequest;
    });
  } catch (error) {
    console.error('사용자 세트 목록 조회 실패:', error);
    throw error;
  }
};

// 세트에 속한 부품들 조회
export const getMultiPartItems = async (setId: string): Promise<PurchaseRequest[]> => {
  try {
    const q = query(
      collection(db, 'purchaseRequests'),
      where('setId', '==', setId),
      orderBy('partOrderInSet', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        // 다른 Date 필드들도 변환
        ecountRegisteredAt: data.ecountRegisteredAt?.toDate(),
        poCompletedAt: data.poCompletedAt?.toDate(),
        expectedDeliveryDate: data.expectedDeliveryDate?.toDate(),
        warehouseReceiptAt: data.warehouseReceiptAt?.toDate(),
        branchDispatchCompletedAt: data.branchDispatchCompletedAt?.toDate(),
        branchReceiptConfirmedAt: data.branchReceiptConfirmedAt?.toDate(),
        statusHistory: data.statusHistory?.map((history: any) => ({
          ...history,
          updatedAt: history.updatedAt?.toDate() || new Date(),
        })) || [],
      } as PurchaseRequest;
    });
  } catch (error) {
    console.error('세트 부품 목록 조회 실패:', error);
    throw error;
  }
}; 