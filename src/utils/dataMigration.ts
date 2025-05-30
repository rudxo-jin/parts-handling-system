import { collection, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 기존 구매 요청 데이터의 price 필드를 수정하는 마이그레이션 함수
 * price가 0이거나 undefined인 경우 null로 변경하여 '미입력' 상태로 표시
 */
export const migratePurchaseRequestPrices = async () => {
  try {
    console.log('🔄 구매 요청 price 필드 마이그레이션 시작...');
    
    const purchaseRequestsRef = collection(db, 'purchaseRequests');
    const snapshot = await getDocs(purchaseRequestsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const currentPrice = data.price;
      
      // price가 0이거나 undefined인 경우에만 수정
      if (currentPrice === 0 || currentPrice === undefined || currentPrice === null) {
        console.log(`📝 업데이트 대상: ${data.requestId} - 현재 price: ${currentPrice}`);
        
        // price를 undefined로 설정하여 '미입력' 상태로 만듦
        batch.update(doc(db, 'purchaseRequests', docSnapshot.id), {
          price: undefined,
          updatedAt: new Date()
        });
        
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount}개의 구매 요청 price 필드가 업데이트되었습니다.`);
    } else {
      console.log('ℹ️ 업데이트가 필요한 구매 요청이 없습니다.');
    }
    
    return { success: true, updatedCount: updateCount };
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    return { success: false, error };
  }
};

/**
 * 부품 데이터의 price 필드도 함께 마이그레이션
 */
export const migratePartPrices = async () => {
  try {
    console.log('🔄 부품 price 필드 마이그레이션 시작...');
    
    const partsRef = collection(db, 'parts');
    const snapshot = await getDocs(partsRef);
    
    const batch = writeBatch(db);
    let updateCount = 0;
    
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const currentPrice = data.price;
      
      // price가 0이거나 undefined인 경우에만 수정
      if (currentPrice === 0 || currentPrice === undefined || currentPrice === null) {
        console.log(`📝 부품 업데이트 대상: ${data.partNumber} - 현재 price: ${currentPrice}`);
        
        batch.update(doc(db, 'parts', docSnapshot.id), {
          price: undefined,
          updatedAt: new Date()
        });
        
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount}개의 부품 price 필드가 업데이트되었습니다.`);
    } else {
      console.log('ℹ️ 업데이트가 필요한 부품이 없습니다.');
    }
    
    return { success: true, updatedCount: updateCount };
  } catch (error) {
    console.error('❌ 부품 마이그레이션 실패:', error);
    return { success: false, error };
  }
};

/**
 * 전체 price 필드 마이그레이션 실행
 */
export const runPriceMigration = async () => {
  console.log('🚀 Price 필드 마이그레이션 시작...');
  
  const purchaseRequestResult = await migratePurchaseRequestPrices();
  const partResult = await migratePartPrices();
  
  console.log('📊 마이그레이션 결과:');
  console.log(`- 구매 요청: ${purchaseRequestResult.updatedCount || 0}개 업데이트`);
  console.log(`- 부품: ${partResult.updatedCount || 0}개 업데이트`);
  
  return {
    purchaseRequests: purchaseRequestResult,
    parts: partResult
  };
}; 