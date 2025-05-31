import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
} from '@mui/material';
import { PurchaseRequest } from '../types';
import { getMultiPartItems, getMultiPartProgress } from '../services/multiPartService';

interface MultiPartRequestDetailProps {
  open: boolean;
  onClose: () => void;
  setId: string | null;
  setName: string | null;
}

const MultiPartRequestDetail: React.FC<MultiPartRequestDetailProps> = ({
  open,
  onClose,
  setId,
  setName,
}) => {
  const [loading, setLoading] = useState(false);
  const [parts, setParts] = useState<PurchaseRequest[]>([]);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    if (open && setId) {
      const loadSetDetails = async () => {
        setLoading(true);
        try {
          const items = await getMultiPartItems(setId);
          setParts(items);
          
          const progressData = await getMultiPartProgress(setId);
          setProgress(progressData);
        } catch (error) {
          console.error('세트 정보 로딩 실패:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadSetDetails();
    }
  }, [open, setId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operations_submitted': return '운영부 요청 완료';
      case 'po_completed': return '구매처 발주 완료';
      case 'warehouse_received': return '물류창고 입고 완료';
      case 'partial_dispatched': return '부분 출고 완료';
      case 'branch_dispatched': return '전체 지점 출고 완료';
      case 'branch_received_confirmed': return '지점 입고 확인 (완료)';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operations_submitted': return 'info';
      case 'po_completed': return 'primary';
      case 'warehouse_received': return 'warning';
      case 'partial_dispatched': return 'warning';
      case 'branch_dispatched': return 'default';
      case 'branch_received_confirmed': return 'success';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">📦 세트 상세 정보</Typography>
          {setName && (
            <Chip label={setName} color="primary" variant="outlined" />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              세트 정보를 불러오는 중...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ space: 3 }}>
            {/* 세트 설명 표시 */}
            {parts.length > 0 && parts[0].setDescription && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📝 세트 설명
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {parts[0].setDescription}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* 진행 상황 요약 */}
            {progress && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 진행 상황
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="body2">
                      완료: {progress.completedParts} / {progress.totalParts} 부품
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({progress.progressPercentage}%)
                    </Typography>
                  </Box>
                  <CircularProgress 
                    variant="determinate" 
                    value={progress.progressPercentage} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>
            )}

            {/* 부품 목록 */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔧 포함된 부품 목록 ({parts.length}개)
                </Typography>
                
                {parts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    포함된 부품이 없습니다.
                  </Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: 'grey.50' }}>
                          <TableCell sx={{ fontWeight: 'bold' }}>순서</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>요청 ID</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>부품명</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>부품번호</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>총 수량</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>진행 상태</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parts.map((part, index) => (
                          <TableRow key={part.id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                #{part.partOrderInSet || index + 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {part.requestId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {part.requestedPartName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {part.requestedPartNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {part.totalRequestedQuantity.toLocaleString()}개
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(part.currentStatus)}
                                color={getStatusColor(part.currentStatus) as any}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MultiPartRequestDetail; 