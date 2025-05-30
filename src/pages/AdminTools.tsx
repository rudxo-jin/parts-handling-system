import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Build as BuildIcon,
  Storage as StorageIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { runPriceMigration } from '../utils/dataMigration';

/**
 * 현재 데이터베이스의 price 필드 상태를 분석하는 함수
 */
const analyzePriceFields = async () => {
  try {
    console.log('🔍 Price 필드 분석 시작...');
    
    const purchaseRequestsRef = collection(db, 'purchaseRequests');
    const snapshot = await getDocs(purchaseRequestsRef);
    
    const analysis = {
      total: 0,
      undefined: 0,
      null: 0,
      zero: 0,
      positive: 0,
      details: [] as any[]
    };
    
    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const price = data.price;
      
      analysis.total++;
      
      if (price === undefined) {
        analysis.undefined++;
      } else if (price === null) {
        analysis.null++;
      } else if (price === 0) {
        analysis.zero++;
      } else if (price > 0) {
        analysis.positive++;
      }
      
      analysis.details.push({
        requestId: data.requestId,
        price: price,
        type: typeof price,
        requestorName: data.requestorName,
        requestDate: data.requestDate?.toDate?.()?.toLocaleDateString() || 'N/A'
      });
    });
    
    console.log('📊 Price 필드 분석 결과:', analysis);
    return analysis;
  } catch (error) {
    console.error('❌ 분석 실패:', error);
    return null;
  }
};

const AdminTools: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          이 페이지는 관리자만 접근할 수 있습니다.
        </Alert>
      </Box>
    );
  }

  const handlePriceMigration = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);
      
      const migrationResult = await runPriceMigration();
      setResult(migrationResult);
      setConfirmDialog(false);
    } catch (error: any) {
      console.error('마이그레이션 실패:', error);
      setError(error.message || '마이그레이션 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzePriceFields = async () => {
    try {
      setAnalysisLoading(true);
      const result = await analyzePriceFields();
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('분석 실패:', error);
      setError(error.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        관리자 도구
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body1" fontWeight="medium">
          ⚠️ 주의사항
        </Typography>
        <Typography variant="body2">
          이 도구들은 데이터베이스를 직접 수정합니다. 실행 전에 반드시 백업을 확인하고 신중하게 사용하세요.
        </Typography>
      </Alert>

      {/* Price 필드 분석 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StorageIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">
              Price 필드 분석
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            현재 데이터베이스에 있는 구매 요청들의 price 필드 상태를 분석합니다.
          </Typography>

          <Button
            variant="outlined"
            onClick={handleAnalyzePriceFields}
            disabled={analysisLoading}
            startIcon={analysisLoading ? <CircularProgress size={20} /> : <StorageIcon />}
            sx={{ mb: 2 }}
          >
            {analysisLoading ? '분석 중...' : 'Price 필드 분석 실행'}
          </Button>

          {analysisResult && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                📊 분석 결과
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary.main">{analysisResult.total}</Typography>
                  <Typography variant="body2">전체</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="warning.main">{analysisResult.undefined}</Typography>
                  <Typography variant="body2">undefined</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="warning.main">{analysisResult.null}</Typography>
                  <Typography variant="body2">null</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="error.main">{analysisResult.zero}</Typography>
                  <Typography variant="body2">0</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.main">{analysisResult.positive}</Typography>
                  <Typography variant="body2">양수</Typography>
                </Box>
              </Box>

              {analysisResult.zero > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    {analysisResult.zero}개의 구매 요청에서 price가 0으로 저장되어 있습니다. 
                    이 중 일부는 실제로 판매가가 입력되었지만 0으로 저장된 것일 수 있습니다.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Price 필드 마이그레이션 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">
              Price 필드 마이그레이션
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            기존 데이터에서 price가 0으로 저장된 경우를 '미입력' 상태로 변경합니다.
            이렇게 하면 이카운트 등록 화면에서 판매가가 올바르게 표시됩니다.
          </Typography>

          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="구매 요청의 price 필드 수정"
                secondary="price가 0인 구매 요청을 '미입력' 상태로 변경"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText 
                primary="부품의 price 필드 수정"
                secondary="price가 0인 부품을 '미입력' 상태로 변경"
              />
            </ListItem>
          </List>

          <Button
            variant="contained"
            onClick={() => setConfirmDialog(true)}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <BuildIcon />}
            sx={{ mt: 2 }}
          >
            {loading ? '마이그레이션 실행 중...' : 'Price 마이그레이션 실행'}
          </Button>
        </CardContent>
      </Card>

      {/* 결과 표시 */}
      {result && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
              ✅ 마이그레이션 완료
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">구매 요청</Typography>
                <Typography variant="h6" color="primary.main">
                  {result.purchaseRequests?.updatedCount || 0}개 업데이트
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">부품</Typography>
                <Typography variant="h6" color="primary.main">
                  {result.parts?.updatedCount || 0}개 업데이트
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ mt: 2 }}>
              마이그레이션이 완료되었습니다. 이제 기존 데이터에서도 판매가가 올바르게 표시됩니다.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* 에러 표시 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            마이그레이션 실행 확인
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Price 필드 마이그레이션을 실행하시겠습니까?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            이 작업은 다음을 수행합니다:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="• 구매 요청에서 price가 0인 항목을 '미입력' 상태로 변경"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="• 부품에서 price가 0인 항목을 '미입력' 상태로 변경"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            취소
          </Button>
          <Button 
            onClick={handlePriceMigration}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            실행
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminTools; 