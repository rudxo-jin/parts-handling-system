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
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { doc, updateDoc, arrayUnion, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseRequest } from '../types';

interface BulkProcessDialogProps {
  open: boolean;
  onClose: () => void;
  requests: PurchaseRequest[];
  onUpdate: () => void;
}

interface BulkProcessData {
  requestId: string;
  partName: string;
  partNumber: string;
  totalQuantity: number;
  expectedDeliveryDate: Date | null;
  expectedQuantity: number;
  actualReceiptDate: Date | null;
  actualQuantity: number;
  branchDispatchQuantities?: Array<{
    branchId: string;
    branchName: string;
    requiredQuantity: number;
    dispatchedQuantity: number;
    isDispatched: boolean;
  }>;
}

const BulkProcessDialog: React.FC<BulkProcessDialogProps> = ({
  open,
  onClose,
  requests,
  onUpdate,
}) => {
  const { userProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [bulkData, setBulkData] = useState<BulkProcessData[]>([]);

  // 요청 상태 확인
  const currentStatus = requests.length > 0 ? requests[0].currentStatus : '';
  
  // 상태별 처리 타입 결정
  const getProcessType = () => {
    switch (currentStatus) {
      case 'operations_submitted':
        return { type: 'ecount_po', title: '이카운트 등록 및 구매처 발주', fields: ['expectedDeliveryDate', 'expectedQuantity'] };
      case 'po_completed':
        return { type: 'warehouse', title: '물류창고 입고', fields: ['actualReceiptDate', 'actualQuantity'] };
      case 'warehouse_received':
      case 'partial_dispatched':
        return { type: 'dispatch', title: '지점 출고', fields: ['branchDispatch'] };
      default:
        return { type: 'unknown', title: '알 수 없는 처리', fields: [] };
    }
  };

  const processType = getProcessType();

  // 컴포넌트 초기화
  useEffect(() => {
    if (open && requests.length > 0) {
      const initialData: BulkProcessData[] = requests.map(request => {
        // 지점별 출고 수량 초기화
        const branchDispatchQuantities = request.branchRequirements?.map(req => {
          const existingDispatch = request.branchDispatchQuantities?.find(
            dispatch => dispatch.branchId === req.branchId
          );
          
          return {
            branchId: req.branchId,
            branchName: req.branchName,
            requiredQuantity: Number(req.requestedQuantity),
            dispatchedQuantity: existingDispatch?.dispatchedQuantity || Number(req.requestedQuantity),
            isDispatched: existingDispatch?.isDispatched || false,
          };
        }) || [];

        return {
          requestId: request.requestId,
          partName: request.requestedPartName,
          partNumber: request.requestedPartNumber,
          totalQuantity: request.totalRequestedQuantity,
          expectedDeliveryDate: null,
          expectedQuantity: request.totalRequestedQuantity,
          actualReceiptDate: new Date(),
          actualQuantity: request.expectedDeliveryQuantity || request.totalRequestedQuantity,
          branchDispatchQuantities,
        };
      });
      setBulkData(initialData);
      setError('');
    }
  }, [open, requests]);

  // 개별 항목 업데이트
  const updateBulkItem = (index: number, field: keyof BulkProcessData, value: any) => {
    const updated = [...bulkData];
    updated[index] = { ...updated[index], [field]: value };
    setBulkData(updated);
  };

  // 🆕 지점별 출고 수량 업데이트
  const updateBranchDispatch = (itemIndex: number, branchIndex: number, field: 'dispatchedQuantity' | 'isDispatched', value: any) => {
    const updated = [...bulkData];
    if (updated[itemIndex].branchDispatchQuantities) {
      updated[itemIndex].branchDispatchQuantities![branchIndex] = {
        ...updated[itemIndex].branchDispatchQuantities![branchIndex],
        [field]: value
      };
      setBulkData(updated);
    }
  };

  // 일괄 적용 함수들
  const applyBulkDate = (date: Date | null, field: 'expectedDeliveryDate' | 'actualReceiptDate') => {
    if (!date) return;
    const updated = bulkData.map(item => ({ ...item, [field]: date }));
    setBulkData(updated);
  };

  // 🆕 지점별 출고 일괄 적용
  const applyBulkDispatch = (branchName: string, isDispatched: boolean) => {
    const updated = bulkData.map(item => {
      if (item.branchDispatchQuantities) {
        const updatedBranches = item.branchDispatchQuantities.map(branch => 
          branch.branchName === branchName 
            ? { ...branch, isDispatched }
            : branch
        );
        return { ...item, branchDispatchQuantities: updatedBranches };
      }
      return item;
    });
    setBulkData(updated);
  };

  // 🆕 지점별 출고 상태 확인 (모든 부품에서 해당 지점이 출고 완료인지)
  const isBranchFullyDispatched = (branchName: string): boolean => {
    return bulkData.every(item => 
      item.branchDispatchQuantities?.find(branch => branch.branchName === branchName)?.isDispatched || false
    );
  };

  // 폼 검증
  const validateForm = (): boolean => {
    for (let i = 0; i < bulkData.length; i++) {
      const item = bulkData[i];
      
      if (processType.type === 'ecount_po') {
        if (!item.expectedDeliveryDate || item.expectedQuantity <= 0) {
          setError(`${item.partName}: 입고 예정일과 예정 수량을 모두 입력해주세요.`);
          return false;
        }
      } else if (processType.type === 'warehouse') {
        if (!item.actualReceiptDate || item.actualQuantity <= 0) {
          setError(`${item.partName}: 실제 입고일과 입고 수량을 모두 입력해주세요.`);
          return false;
        }
      } else if (processType.type === 'dispatch') {
        // 🆕 지점 출고 검증
        const dispatchedBranches = item.branchDispatchQuantities?.filter(branch => branch.isDispatched) || [];
        if (dispatchedBranches.length === 0) {
          setError(`${item.partName}: 최소 1개 지점은 출고 완료 처리해야 합니다.`);
          return false;
        }
        
        const totalDispatchedQuantity = dispatchedBranches.reduce((sum, branch) => sum + branch.dispatchedQuantity, 0);
        const request = requests[i];
        const availableQuantity = request.actualReceivedQuantity || 0;
        
        if (totalDispatchedQuantity > availableQuantity) {
          setError(`${item.partName}: 창고 보유 수량(${availableQuantity}개)을 초과하여 출고할 수 없습니다. (현재 출고 계획: ${totalDispatchedQuantity}개)`);
          return false;
        }
      }
    }
    return true;
  };

  // 일괄 처리 실행
  const handleBulkProcess = async () => {
    if (!validateForm()) return;

    try {
      setProcessing(true);
      setError('');

      const batch = writeBatch(db);
      const now = Timestamp.now();

      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        const data = bulkData[i];
        const requestRef = doc(db, 'purchaseRequests', request.id);

        let updateData: any = {
          updatedAt: now,
        };

        let newHistoryEntry: any = {
          updatedAt: now,
          updatedByUid: userProfile?.id || '',
          updatedByName: userProfile?.name || '',
        };

        if (processType.type === 'ecount_po') {
          // 이카운트 등록 및 구매처 발주
          updateData = {
            ...updateData,
            currentStatus: 'po_completed',
            currentResponsibleTeam: 'logistics',
            ecountRegisteredAt: now,
            ecountRegistrarUid: userProfile?.id || '',
            poCompletedAt: now,
            poCompleterUid: userProfile?.id || '',
            expectedDeliveryDate: Timestamp.fromDate(data.expectedDeliveryDate!),
            expectedDeliveryQuantity: data.expectedQuantity,
          };

          newHistoryEntry = {
            ...newHistoryEntry,
            status: 'po_completed',
            comments: '일괄 처리: 이카운트 등록 및 구매처 발주 완료',
          };

        } else if (processType.type === 'warehouse') {
          // 물류창고 입고
          updateData = {
            ...updateData,
            currentStatus: 'warehouse_received',
            currentResponsibleTeam: 'logistics',
            warehouseReceiptAt: Timestamp.fromDate(data.actualReceiptDate!),
            warehouseReceiptUid: userProfile?.id || '',
            actualReceivedQuantity: data.actualQuantity,
          };

          newHistoryEntry = {
            ...newHistoryEntry,
            status: 'warehouse_received',
            comments: '일괄 처리: 물류창고 입고 완료',
          };
        } else if (processType.type === 'dispatch') {
          // 🆕 지점 출고 처리
          const dispatchedBranches = data.branchDispatchQuantities?.filter(branch => branch.isDispatched) || [];
          const totalDispatchedQuantity = dispatchedBranches.reduce((sum, branch) => sum + branch.dispatchedQuantity, 0);
          const remainingQuantity = (request.actualReceivedQuantity || 0) - totalDispatchedQuantity;
          
          // 모든 지점에 출고 완료되었는지 확인
          const allBranchesDispatched = data.branchDispatchQuantities?.every(branch => branch.isDispatched) || false;
          
          updateData = {
            ...updateData,
            currentStatus: allBranchesDispatched ? 'completed' : 'partial_dispatched',
            currentResponsibleTeam: allBranchesDispatched ? 'completed' : 'logistics',
            branchDispatchQuantities: data.branchDispatchQuantities,
            remainingQuantity: remainingQuantity,
            lastDispatchedAt: now,
            lastDispatcherUid: userProfile?.id || '',
          };

          const dispatchSummary = dispatchedBranches.map(branch => 
            `${branch.branchName}: ${branch.dispatchedQuantity}개`
          ).join(', ');

          newHistoryEntry = {
            ...newHistoryEntry,
            status: allBranchesDispatched ? 'completed' : 'partial_dispatched',
            comments: `일괄 처리: 지점 출고 (${dispatchSummary})`,
          };
        }

        updateData.statusHistory = arrayUnion(newHistoryEntry);
        batch.update(requestRef, updateData);
      }

      await batch.commit();

      onUpdate();
      onClose();

    } catch (error) {
      console.error('일괄 처리 실패:', error);
      setError('일괄 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              📋 일괄 처리: {processType.title} ({requests.length}건)
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* 지점 출고가 아닌 경우에만 좌우 분할 */}
          {processType.type !== 'dispatch' ? (
            <Box sx={{ display: 'flex', gap: 3 }}>
              {/* 🆕 빠른작업 - 왼쪽으로 이동 */}
              <Card sx={{ minWidth: 350, maxWidth: 400 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ⚡ 빠른작업
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {processType.fields.includes('expectedDeliveryDate') && (
                      <>
                        <DatePicker
                          label="입고 예정일 일괄 적용"
                          value={null}
                          onChange={(date) => applyBulkDate(date, 'expectedDeliveryDate')}
                          format="yyyy/MM/dd"
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </>
                    )}
                    
                    {processType.fields.includes('actualReceiptDate') && (
                      <>
                        <DatePicker
                          label="실제 입고일 일괄 적용"
                          value={null}
                          onChange={(date) => applyBulkDate(date, 'actualReceiptDate')}
                          format="yyyy/MM/dd"
                          slotProps={{ textField: { size: 'small', fullWidth: true } }}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* 🆕 상세 - 오른쪽 */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  📋 상세 ({requests.length}건)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {bulkData.map((item, index) => {
                    const request = requests[index]; // 원본 요청 데이터 참조
                    
                    return (
                      <Accordion key={item.requestId} defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                            {/* 🆕 한 줄 형식으로 변경 */}
                            <Typography variant="subtitle1" fontWeight="medium" sx={{ flex: 1 }}>
                              {item.partNumber} | {item.partName} | {request?.price && request.price > 0 ? `${request.price.toLocaleString()}원` : '가격 미입력'} | 품목그룹: {request?.itemGroup1 || '미입력'} {'>'} {request?.itemGroup2 || '미입력'} {'>'} {request?.itemGroup3 || '미입력'} | 총 요청수량: {item.totalQuantity.toLocaleString()}개
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        
                        <AccordionDetails>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {/* 입력 필드들 */}
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                              {processType.fields.includes('expectedDeliveryDate') && (
                                <>
                                  <DatePicker
                                    label="입고 예정일 *"
                                    value={item.expectedDeliveryDate}
                                    onChange={(date) => updateBulkItem(index, 'expectedDeliveryDate', date)}
                                    format="yyyy/MM/dd"
                                    slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                                  />
                                  <TextField
                                    label="입고 예정 수량 *"
                                    type="number"
                                    value={item.expectedQuantity}
                                    onChange={(e) => updateBulkItem(index, 'expectedQuantity', Number(e.target.value))}
                                    InputProps={{ endAdornment: '개' }}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                  />
                                </>
                              )}

                              {processType.fields.includes('actualReceiptDate') && (
                                <>
                                  <DatePicker
                                    label="실제 입고일 *"
                                    value={item.actualReceiptDate}
                                    onChange={(date) => updateBulkItem(index, 'actualReceiptDate', date)}
                                    format="yyyy/MM/dd"
                                    slotProps={{ textField: { size: 'small', sx: { minWidth: 150 } } }}
                                  />
                                  <TextField
                                    label="실제 입고 수량 *"
                                    type="number"
                                    value={item.actualQuantity}
                                    onChange={(e) => updateBulkItem(index, 'actualQuantity', Number(e.target.value))}
                                    InputProps={{ endAdornment: '개' }}
                                    size="small"
                                    sx={{ minWidth: 120 }}
                                  />
                                </>
                              )}
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>
              </Box>
            </Box>
          ) : (
            /* 지점 출고 처리 시 전체 폭 사용 */
            <Box>
              {/* 지점별 일괄 적용 도구 - 상단에 배치 */}
              {bulkData.length > 0 && bulkData[0].branchDispatchQuantities && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ⚡ 지점별 일괄 출고 설정
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {Array.from(new Set(bulkData.flatMap(item => 
                        item.branchDispatchQuantities?.map(branch => branch.branchName) || []
                      ))).map(branchName => {
                        const isFullyDispatched = isBranchFullyDispatched(branchName);
                        return (
                          <Button
                            key={branchName}
                            size="small"
                            variant={isFullyDispatched ? "contained" : "outlined"}
                            color={isFullyDispatched ? "success" : "primary"}
                            onClick={() => applyBulkDispatch(branchName, !isFullyDispatched)}
                            sx={{ 
                              fontSize: '0.875rem', 
                              minWidth: 'auto', 
                              px: 2,
                              py: 1,
                              fontWeight: isFullyDispatched ? 'bold' : 'normal',
                              boxShadow: isFullyDispatched ? 2 : 0,
                              '&:hover': {
                                boxShadow: isFullyDispatched ? 3 : 1,
                              }
                            }}
                          >
                            {isFullyDispatched ? `✓ ${branchName}` : branchName}
                          </Button>
                        );
                      })}
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* 상세 목록 - 전체 폭 사용 */}
              <Typography variant="h6" gutterBottom>
                📋 지점 출고 상세 ({requests.length}건)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {bulkData.map((item, index) => {
                  const request = requests[index];
                  
                  return (
                    <Accordion key={item.requestId} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                          <Typography variant="subtitle1" fontWeight="medium" sx={{ flex: 1 }}>
                            {item.partNumber} | {item.partName} | {request?.price && request.price > 0 ? `${request.price.toLocaleString()}원` : '가격 미입력'} | 품목그룹: {request?.itemGroup1 || '미입력'} {'>'} {request?.itemGroup2 || '미입력'} {'>'} {request?.itemGroup3 || '미입력'} | 총 요청수량: {item.totalQuantity.toLocaleString()}개 | 창고 보유: {request?.actualReceivedQuantity || 0}개
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      
                      <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* 지점별 출고 처리 UI - 전체 폭 활용 */}
                          {item.branchDispatchQuantities && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                                📦 지점별 출고 처리
                              </Typography>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 1.5, mb: 2 }}>
                                {item.branchDispatchQuantities.map((branch, branchIndex) => (
                                  <Box 
                                    key={branch.branchId} 
                                    sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: 1, 
                                      px: 1.5, 
                                      py: 0.8, 
                                      border: 1, 
                                      borderColor: branch.isDispatched ? 'success.main' : 'grey.300',
                                      borderRadius: 1,
                                      bgcolor: branch.isDispatched ? 'success.50' : 'grey.50',
                                      height: '42px',
                                    }}
                                  >
                                    <Checkbox
                                      checked={branch.isDispatched}
                                      onChange={(e) => updateBranchDispatch(index, branchIndex, 'isDispatched', e.target.checked)}
                                      color="primary"
                                      size="small"
                                      sx={{ p: 0, mr: 0.5 }}
                                    />
                                    <Typography variant="body2" fontWeight="600" sx={{ minWidth: 50, fontSize: '0.875rem', color: 'text.primary' }}>
                                      {branch.branchName}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                        요청:
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: '500' }}>
                                        {branch.requiredQuantity}개
                                      </Typography>
                                    </Box>
                                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                                        출고:
                                      </Typography>
                                      <TextField
                                        type="number"
                                        value={branch.dispatchedQuantity}
                                        onChange={(e) => updateBranchDispatch(index, branchIndex, 'dispatchedQuantity', Number(e.target.value))}
                                        placeholder="0"
                                        InputProps={{ 
                                          endAdornment: <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', ml: 0.5 }}>개</Typography>,
                                          sx: { 
                                            fontSize: '0.875rem',
                                            '& .MuiInputBase-input': {
                                              textAlign: 'center',
                                              fontWeight: '500'
                                            }
                                          }
                                        }}
                                        size="small"
                                        disabled={!branch.isDispatched}
                                        sx={{ 
                                          width: 110,
                                          '& .MuiOutlinedInput-root': {
                                            height: '28px',
                                            '& fieldset': {
                                              borderColor: branch.isDispatched ? 'primary.main' : 'grey.300',
                                            },
                                            '&:hover fieldset': {
                                              borderColor: branch.isDispatched ? 'primary.dark' : 'grey.400',
                                            },
                                            '&.Mui-focused fieldset': {
                                              borderColor: 'primary.main',
                                              borderWidth: 1,
                                            }
                                          },
                                          '& .MuiInputBase-input': {
                                            padding: '4px 8px',
                                            fontSize: '0.875rem',
                                            fontWeight: '500'
                                          }
                                        }}
                                      />
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                              
                              {/* 출고 요약 정보 */}
                              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                                <Typography variant="body2" color="info.main">
                                  💡 출고 요약: 총 {item.branchDispatchQuantities.filter(b => b.isDispatched).reduce((sum, b) => sum + b.dispatchedQuantity, 0)}개 출고 예정 
                                  (잔여: {(request?.actualReceivedQuantity || 0) - item.branchDispatchQuantities.filter(b => b.isDispatched).reduce((sum, b) => sum + b.dispatchedQuantity, 0)}개)
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="secondary">
            취소
          </Button>
          <Button
            onClick={handleBulkProcess}
            variant="contained"
            color="primary"
            disabled={processing}
            startIcon={processing ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {processing ? '처리 중...' : `${requests.length}건 일괄 처리`}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default BulkProcessDialog; 