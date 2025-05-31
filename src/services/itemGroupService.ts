import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  orderBy,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ItemGroupSuggestion {
  id: string;
  value: string;
  usageCount: number;
  lastUsed: Date;
  createdAt: Date;
}

// 품목그룹 제안 목록 가져오기
export const getItemGroupSuggestions = async (groupLevel: 1 | 2 | 3): Promise<string[]> => {
  try {
    const collectionName = `itemGroup${groupLevel}Suggestions`;
    const q = query(
      collection(db, collectionName),
      orderBy('usageCount', 'desc'),
      orderBy('lastUsed', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const suggestions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return data.value;
    });
    
    return suggestions;
  } catch (error) {
    console.error(`품목그룹 ${groupLevel} 제안 목록 조회 실패:`, error);
    
    // orderBy 에러인 경우 단순 조회로 재시도
    try {
      const collectionName = `itemGroup${groupLevel}Suggestions`;
      const querySnapshot = await getDocs(collection(db, collectionName));
      
      const suggestions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return data.value;
      }).sort(); // 알파벳 순으로 정렬
      
      return suggestions;
    } catch (retryError) {
      console.error(`품목그룹 ${groupLevel} 재시도도 실패:`, retryError);
      return [];
    }
  }
};

// 품목그룹 사용 기록 저장/업데이트
export const recordItemGroupUsage = async (
  groupLevel: 1 | 2 | 3, 
  value: string
): Promise<void> => {
  if (!value || !value.trim()) return;
  
  try {
    const collectionName = `itemGroup${groupLevel}Suggestions`;
    const docId = value.toLowerCase().replace(/\s+/g, '_');
    const docRef = doc(db, collectionName, docId);
    
    // 기존 데이터 확인
    const existingDoc = await getDocs(query(collection(db, collectionName)));
    const existingData = existingDoc.docs.find(doc => doc.id === docId)?.data();
    
    const now = new Date();
    const updateData: any = {
      value: value.trim(),
      usageCount: (existingData?.usageCount || 0) + 1,
      lastUsed: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    };
    
    if (!existingData) {
      updateData.createdAt = Timestamp.fromDate(now);
    }
    
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    console.error(`품목그룹 ${groupLevel} 사용 기록 저장 실패:`, error);
  }
};

// 여러 품목그룹을 한번에 기록
export const recordMultipleItemGroupUsage = async (
  itemGroup1?: string,
  itemGroup2?: string,
  itemGroup3?: string
): Promise<void> => {
  const promises = [];
  
  if (itemGroup1) {
    promises.push(recordItemGroupUsage(1, itemGroup1));
  }
  if (itemGroup2) {
    promises.push(recordItemGroupUsage(2, itemGroup2));
  }
  if (itemGroup3) {
    promises.push(recordItemGroupUsage(3, itemGroup3));
  }
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('품목그룹 일괄 기록 실패:', error);
  }
};

// 품목그룹 테스트 데이터 삭제 함수
export const clearAllItemGroupData = async (): Promise<void> => {
  try {
    const collections = ['itemGroup1Suggestions', 'itemGroup2Suggestions', 'itemGroup3Suggestions'];
    
    for (const collectionName of collections) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`${collectionName} 컬렉션의 모든 데이터가 삭제되었습니다.`);
    }
    
    console.log('모든 품목그룹 데이터가 삭제되었습니다.');
  } catch (error) {
    console.error('품목그룹 데이터 삭제 실패:', error);
  }
}; 