import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseRequest, BranchDispatchInfo } from '../types';

interface PurchaseRequestDetailProps {
  open: boolean;
  onClose: () => void;
  request: PurchaseRequest | null;
  onUpdate: () => void;
  editMode?: boolean;
  editSection?: string;
}

const PurchaseRequestDetail: React.FC<PurchaseRequestDetailProps> = ({
  open,
  onClose,
  request,
  onUpdate,
  editMode,
  editSection,
}) => {
  const { userProfile } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Phase 2: 구매처 발주 관련 상태
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | null>(null);
  const [expectedDeliveryQuantity, setExpectedDeliveryQuantity] = useState<number>(0);
  const [actualSupplier, setActualSupplier] = useState('');

  // Phase 2: 물류창고 입고 관련 상태
  const [actualReceiptDate, setActualReceiptDate] = useState<Date | null>(new Date());
  const [actualReceivedQuantity, setActualReceivedQuantity] = useState<number>(0);

  // Phase 2: 지점 출고 관련 상태
  const [branchDispatchQuantities, setBranchDispatchQuantities] = useState<BranchDispatchInfo[]>([]);

  // Phase 2: 지점 입고 확인 관련 상태
  const [branchReceiptQuantities, setBranchReceiptQuantities] = useState<BranchDispatchInfo[]>([]);

  // 이카운트 등록 관련 상태
  const [itemGroup1, setItemGroup1] = useState('');
  const [itemGroup2, setItemGroup2] = useState('');
  const [itemGroup3, setItemGroup3] = useState('');

  // 출고 메모 상태
  const [dispatchMemo, setDispatchMemo] = useState('');

  // 아코디언 확장 상태
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    ecount: false,
    po: false,
    warehouse: false,
    dispatch: false,
    receipt: false,
    history: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    if (request) {
      // 기존 데이터로 상태 초기화
      setExpectedDeliveryDate(request.expectedDeliveryDate || null);
      setExpectedDeliveryQuantity(request.expectedDeliveryQuantity || 0);
      setActualSupplier(request.actualSupplier || '');
      setActualReceiptDate(request.warehouseReceiptAt || new Date());
      setActualReceivedQuantity(request.actualReceivedQuantity || 0);
      setItemGroup1(request.itemGroup1 || '');
      setItemGroup2(request.itemGroup2 || '');
      setItemGroup3(request.itemGroup3 || '');
      setDispatchMemo(request.dispatchMemo || '');

      // 지점 출고 수량 초기화
      if (request.branchDispatchQuantities && request.branchDispatchQuantities.length > 0) {
        setBranchDispatchQuantities(request.branchDispatchQuantities);
        setBranchReceiptQuantities(request.branchDispatchQuantities);
      } else {
        // 기본 지점 정보로 초기화
        const defaultBranches: BranchDispatchInfo[] = [
          { branchId: 'gangnam', branchName: '강남점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'gangbuk', branchName: '강북점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'gangseo', branchName: '강서점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'gangdong', branchName: '강동점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'seocho', branchName: '서초점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'songpa', branchName: '송파점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'yeongdeungpo', branchName: '영등포점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'mapo', branchName: '마포점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'yongsan', branchName: '용산점', requiredQuantity: 0, dispatchedQuantity: 0 },
          { branchId: 'seongdong', branchName: '성동점', requiredQuantity: 0, dispatchedQuantity: 0 },
        ];
        setBranchDispatchQuantities(defaultBranches);
        setBranchReceiptQuantities(defaultBranches);
      }

      // 편집 모드에 따른 섹션 확장
      if (editMode && editSection) {
        setExpandedSections(prev => ({
          ...prev,
          [editSection]: true
        }));
      }
    }
  }, [request, editMode, editSection]);

  // 이카운트 등록 처리
  const handleEcountRegistration = async () => {
    if (!request || !itemGroup1 || !itemGroup2 || !itemGroup3) {
      setError('품목그룹 1, 2, 3을 모두 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const newHistoryEntry = {
        status: 'ecount_registered',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '이카운트 등록 완료',
      };

      await updateDoc(requestRef, {
        currentStatus: 'ecount_registered',
        currentResponsibleTeam: 'purchasing',
        ecountRegisteredAt: Timestamp.now(),
        ecountRegistererUid: userProfile?.id || '',
        itemGroup1: itemGroup1,
        itemGroup2: itemGroup2,
        itemGroup3: itemGroup3,
        statusHistory: arrayUnion(newHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      setItemGroup1('');
      setItemGroup2('');
      setItemGroup3('');
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('이카운트 등록 실패:', error);
      setError('이카운트 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 이카운트 등록 정보 수정
  const handleEcountUpdate = async () => {
    if (!request || !itemGroup1 || !itemGroup2 || !itemGroup3) {
      setError('품목그룹 1, 2, 3을 모두 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const updateHistoryEntry = {
        status: 'ecount_updated',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '이카운트 등록 정보 수정',
      };

      await updateDoc(requestRef, {
        itemGroup1: itemGroup1,
        itemGroup2: itemGroup2,
        itemGroup3: itemGroup3,
        statusHistory: arrayUnion(updateHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      setItemGroup1('');
      setItemGroup2('');
      setItemGroup3('');
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('이카운트 등록 정보 수정 실패:', error);
      setError('이카운트 등록 정보 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 구매처 발주 완료 처리
  const handlePOCompletion = async () => {
    if (!request) {
      setError('요청 정보가 없습니다.');
      return;
    }
    
    const finalActualSupplier = actualSupplier.trim() || request.actualSupplier || request.initialSupplier;
    
    if (!expectedDeliveryDate || expectedDeliveryQuantity <= 0 || !finalActualSupplier) {
      setError('입고 예정일, 입고 예정 수량, 실제 발주처를 모두 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const newHistoryEntry = {
        status: 'po_completed',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '구매처 발주 완료',
      };

      await updateDoc(requestRef, {
        currentStatus: 'po_completed',
        currentResponsibleTeam: 'logistics',
        poCompletedAt: Timestamp.now(),
        poCompleterUid: userProfile?.id || '',
        expectedDeliveryDate: Timestamp.fromDate(expectedDeliveryDate),
        expectedDeliveryQuantity: expectedDeliveryQuantity,
        actualSupplier: finalActualSupplier,
        statusHistory: arrayUnion(newHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      setActualSupplier('');
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('발주 완료 처리 실패:', error);
      setError('발주 완료 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 물류창고 입고 완료 처리
  const handleWarehouseReceipt = async () => {
    if (!request || !actualReceiptDate || actualReceivedQuantity <= 0) {
      setError('실제 입고일, 실제 입고 수량을 모두 입력해주세요.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const newHistoryEntry = {
        status: 'warehouse_received',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '물류창고 입고 완료',
      };

      await updateDoc(requestRef, {
        currentStatus: 'warehouse_received',
        currentResponsibleTeam: 'logistics',
        warehouseReceiptAt: Timestamp.fromDate(actualReceiptDate),
        warehouseReceiptUid: userProfile?.id || '',
        actualReceivedQuantity: actualReceivedQuantity,
        statusHistory: arrayUnion(newHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('입고 완료 처리 실패:', error);
      setError('입고 완료 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 지점 출고 완료 처리
  const handleBranchDispatch = async () => {
    if (!request) {
      setError('요청 정보가 없습니다.');
      return;
    }

    // 총 출고 수량 검증
    const totalDispatchedQuantity = branchDispatchQuantities.reduce((sum, item) => sum + item.dispatchedQuantity, 0);
    const availableQuantity = request.actualReceivedQuantity || 0;

    if (totalDispatchedQuantity > availableQuantity) {
      setError(`창고 보유 수량(${availableQuantity}개)을 초과하여 출고할 수 없습니다. (현재 출고 계획: ${totalDispatchedQuantity}개)`);
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const newHistoryEntry = {
        status: 'branch_dispatched',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '지점 출고 완료',
      };

      const updateData = removeUndefinedValues({
        currentStatus: 'branch_dispatched',
        currentResponsibleTeam: 'operations',
        branchDispatchCompletedAt: Timestamp.now(),
        branchDispatchCompleterUid: userProfile?.id || '',
        branchDispatchQuantities: branchDispatchQuantities.map(branch => removeUndefinedValues(branch)),
        dispatchMemo: dispatchMemo,
        statusHistory: arrayUnion(newHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      await updateDoc(requestRef, updateData);

      setDispatchMemo('');
      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('지점 출고 처리 실패:', error);
      setError('지점 출고 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 지점 입고 확인 완료 처리
  const handleBranchReceiptConfirmation = async () => {
    if (!request) {
      setError('요청 정보가 없습니다.');
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const requestRef = doc(db, 'purchaseRequests', request.id);
      
      const newHistoryEntry = {
        status: 'branch_received_confirmed',
        updatedAt: Timestamp.now(),
        updatedByUid: userProfile?.id || '',
        updatedByName: userProfile?.name || '',
        comments: '지점 입고 확인 완료',
      };

      await updateDoc(requestRef, {
        currentStatus: 'branch_received_confirmed',
        currentResponsibleTeam: 'completed',
        branchReceiptConfirmedAt: Timestamp.now(),
        branchReceiptConfirmerUid: userProfile?.id || '',
        branchDispatchQuantities: branchReceiptQuantities,
        statusHistory: arrayUnion(newHistoryEntry),
        updatedAt: Timestamp.now(),
      });

      onUpdate();
      onClose();
      
    } catch (error) {
      console.error('지점 입고 확인 처리 실패:', error);
      setError('지점 입고 확인 처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setProcessing(false);
    }
  };

  // 지점별 출고 수량 변경 핸들러
  const handleBranchDispatchQuantityChange = (index: number, quantity: number) => {
    const updated = [...branchDispatchQuantities];
    updated[index] = { ...updated[index], dispatchedQuantity: quantity };
    setBranchDispatchQuantities(updated);
  };

  // 지점별 수령 수량 변경 핸들러
  const handleBranchReceiptQuantityChange = (index: number, quantity: number) => {
    const updated = [...branchReceiptQuantities];
    updated[index] = { ...updated[index], confirmedQuantity: quantity };
    setBranchReceiptQuantities(updated);
  };

  // 지점별 수령 메모 변경 핸들러
  const handleBranchReceiptMemoChange = (index: number, memo: string) => {
    const updated = [...branchReceiptQuantities];
    updated[index] = { ...updated[index], branchReceiptMemo: memo };
    setBranchReceiptQuantities(updated);
  };

  // 상태 라벨 매핑
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operations_submitted': return '운영부 요청 완료';
      case 'ecount_registered': return '이카운트 등록 완료';
      case 'po_completed': return '구매처 발주 완료';
      case 'warehouse_received': return '물류창고 입고 완료';
      case 'partial_dispatched': return '부분 출고 완료';
      case 'branch_dispatched': return '전체 지점 출고 완료';
      case 'branch_received_confirmed': return '지점 입고 확인 (완료)';
      default: return status;
    }
  };

  // 상태 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operations_submitted': return 'info';
      case 'ecount_registered': return 'primary';
      case 'po_completed': return 'warning';
      case 'warehouse_received': return 'secondary';
      case 'partial_dispatched': return 'warning';
      case 'branch_dispatched': return 'default';
      case 'branch_received_confirmed': return 'success';
      default: return 'default';
    }
  };

  // 중요도 라벨 매핑
  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return importance;
    }
  };

  // 중요도 색상 매핑
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // undefined 값 제거 헬퍼 함수
  const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(removeUndefinedValues);
    
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    });
    return cleaned;
  };

  if (!request) return null;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              부품 요청 상세 정보
            </Typography>
            <Box display="flex" gap={1}>
              <Chip 
                label={getStatusLabel(request.currentStatus)} 
                color={getStatusColor(request.currentStatus) as any}
                size="small"
              />
              <Chip 
                label={getImportanceLabel(request.importance)} 
                color={getImportanceColor(request.importance) as any}
                size="small"
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 기본 정보 섹션 */}
          <Accordion expanded={expandedSections.basic} onChange={() => toggleSection('basic')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">기본 정보</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">부품명</Typography>
                  <Typography variant="body1" fontWeight="bold">{request.requestedPartName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">부품번호</Typography>
                  <Typography variant="body1">{request.requestedPartNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">총 요청 수량</Typography>
                  <Typography variant="body1">{request.totalRequestedQuantity}개</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">초기 공급처</Typography>
                  <Typography variant="body1">{request.initialSupplier}</Typography>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="body2" color="textSecondary">요청 메모</Typography>
                  <Typography variant="body1">{request.notes || '없음'}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">요청자</Typography>
                  <Typography variant="body1">{request.requestorName}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">요청일</Typography>
                  <Typography variant="body1">
                    {request.requestDate?.toLocaleDateString('ko-KR')}
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 이카운트 등록 섹션 */}
          {(request.currentStatus === 'operations_submitted' || 
            request.currentStatus === 'ecount_registered' || 
            editMode) && (
            <Accordion expanded={expandedSections.ecount} onChange={() => toggleSection('ecount')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">이카운트 등록</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="품목그룹 1"
                      value={itemGroup1}
                      onChange={(e) => setItemGroup1(e.target.value)}
                      placeholder={request.itemGroup1 || '품목그룹 1을 입력하세요'}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="품목그룹 2"
                      value={itemGroup2}
                      onChange={(e) => setItemGroup2(e.target.value)}
                      placeholder={request.itemGroup2 || '품목그룹 2를 입력하세요'}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="품목그룹 3"
                      value={itemGroup3}
                      onChange={(e) => setItemGroup3(e.target.value)}
                      placeholder={request.itemGroup3 || '품목그룹 3을 입력하세요'}
                    />
                  </Box>
                  {request.currentStatus === 'operations_submitted' && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleEcountRegistration}
                        disabled={processing || !itemGroup1 || !itemGroup2 || !itemGroup3}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        이카운트 등록 완료
                      </Button>
                    </Box>
                  )}
                  {editMode && editSection === 'ecount' && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleEcountUpdate}
                        disabled={processing || !itemGroup1 || !itemGroup2 || !itemGroup3}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        이카운트 정보 수정
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 구매처 발주 섹션 */}
          {(request.currentStatus === 'ecount_registered' || 
            request.currentStatus === 'po_completed' || 
            editMode) && (
            <Accordion expanded={expandedSections.po} onChange={() => toggleSection('po')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">구매처 발주</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <DatePicker
                      label="입고 예정일"
                      value={expectedDeliveryDate}
                      onChange={(newValue) => setExpectedDeliveryDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: request.expectedDeliveryDate?.toLocaleDateString('ko-KR') || '입고 예정일을 선택하세요'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="입고 예정 수량"
                      type="number"
                      value={expectedDeliveryQuantity}
                      onChange={(e) => setExpectedDeliveryQuantity(Number(e.target.value))}
                      placeholder={request.expectedDeliveryQuantity?.toString() || '입고 예정 수량을 입력하세요'}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="실제 발주처"
                      value={actualSupplier}
                      onChange={(e) => setActualSupplier(e.target.value)}
                      placeholder={request.actualSupplier || request.initialSupplier || '실제 발주처를 입력하세요'}
                    />
                  </Box>
                  {request.currentStatus === 'ecount_registered' && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePOCompletion}
                        disabled={processing || !expectedDeliveryDate || expectedDeliveryQuantity <= 0}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        구매처 발주 완료
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 물류창고 입고 섹션 */}
          {(request.currentStatus === 'po_completed' || 
            request.currentStatus === 'warehouse_received' || 
            editMode) && (
            <Accordion expanded={expandedSections.warehouse} onChange={() => toggleSection('warehouse')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">물류창고 입고</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <DatePicker
                      label="실제 입고일"
                      value={actualReceiptDate}
                      onChange={(newValue) => setActualReceiptDate(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          placeholder: request.warehouseReceiptAt?.toLocaleDateString('ko-KR') || '실제 입고일을 선택하세요'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="실제 입고 수량"
                      type="number"
                      value={actualReceivedQuantity}
                      onChange={(e) => setActualReceivedQuantity(Number(e.target.value))}
                      placeholder={request.actualReceivedQuantity?.toString() || '실제 입고 수량을 입력하세요'}
                    />
                  </Box>
                  {request.currentStatus === 'po_completed' && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleWarehouseReceipt}
                        disabled={processing || !actualReceiptDate || actualReceivedQuantity <= 0}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        물류창고 입고 완료
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 지점 출고 섹션 */}
          {(request.currentStatus === 'warehouse_received' || 
            request.currentStatus === 'partial_dispatched' ||
            request.currentStatus === 'branch_dispatched' || 
            editMode) && (
            <Accordion expanded={expandedSections.dispatch} onChange={() => toggleSection('dispatch')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">지점 출고</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      창고 보유 수량: {request.actualReceivedQuantity || 0}개
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>지점명</TableCell>
                            <TableCell align="center">출고 수량</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {branchDispatchQuantities.map((branch, index) => (
                            <TableRow key={index}>
                              <TableCell>{branch.branchName}</TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={branch.dispatchedQuantity}
                                  onChange={(e) => handleBranchDispatchQuantityChange(index, Number(e.target.value))}
                                  inputProps={{ min: 0, max: request.actualReceivedQuantity || 0 }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                    <TextField
                      fullWidth
                      label="출고 메모"
                      multiline
                      rows={2}
                      value={dispatchMemo}
                      onChange={(e) => setDispatchMemo(e.target.value)}
                      placeholder="출고 관련 메모를 입력하세요 (선택사항)"
                    />
                  </Box>
                  {(request.currentStatus === 'warehouse_received' || request.currentStatus === 'partial_dispatched') && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBranchDispatch}
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        지점 출고 완료
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 지점 입고 확인 섹션 */}
          {(request.currentStatus === 'branch_dispatched' || 
            request.currentStatus === 'branch_received_confirmed' || 
            editMode) && (
            <Accordion expanded={expandedSections.receipt} onChange={() => toggleSection('receipt')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">지점 입고 확인</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>지점명</TableCell>
                            <TableCell align="center">출고 수량</TableCell>
                            <TableCell align="center">수령 확인 수량</TableCell>
                            <TableCell>수령 메모</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {branchReceiptQuantities.map((branch, index) => (
                            <TableRow key={index}>
                              <TableCell>{branch.branchName}</TableCell>
                              <TableCell align="center">{branch.dispatchedQuantity || 0}</TableCell>
                              <TableCell align="center">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={branch.confirmedQuantity || 0}
                                  onChange={(e) => handleBranchReceiptQuantityChange(index, Number(e.target.value))}
                                  inputProps={{ min: 0, max: branch.dispatchedQuantity || 0 }}
                                  sx={{ width: 80 }}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={branch.branchReceiptMemo || ''}
                                  onChange={(e) => handleBranchReceiptMemoChange(index, e.target.value)}
                                  placeholder="수령 메모"
                                  sx={{ width: 150 }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                  {request.currentStatus === 'branch_dispatched' && (
                    <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleBranchReceiptConfirmation}
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} /> : null}
                      >
                        지점 입고 확인 완료
                      </Button>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}

          {/* 처리 히스토리 섹션 */}
          <Accordion expanded={expandedSections.history} onChange={() => toggleSection('history')}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">처리 히스토리</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {request.statusHistory && request.statusHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>상태</TableCell>
                        <TableCell>처리자</TableCell>
                        <TableCell>처리일시</TableCell>
                        <TableCell>코멘트</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {request.statusHistory.map((history, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(history.status)} 
                              color={getStatusColor(history.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{history.updatedByName}</TableCell>
                          <TableCell>
                            {history.updatedAt?.toLocaleString('ko-KR')}
                          </TableCell>
                          <TableCell>{history.comments}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="textSecondary">처리 히스토리가 없습니다.</Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={processing}>
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default PurchaseRequestDetail; 