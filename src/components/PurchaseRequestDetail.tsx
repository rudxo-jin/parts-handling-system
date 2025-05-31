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
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
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
    history: true,
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
      
      // 물류창고 입고 관련 초기화 - po_completed 상태일 때 빠른입력과 동일하게 설정
      if (request.currentStatus === 'po_completed') {
        setActualReceiptDate(new Date()); // 오늘 날짜로 설정
        setActualReceivedQuantity(request.expectedDeliveryQuantity || request.totalRequestedQuantity || 0); // 예정수량으로 설정
      } else {
        setActualReceiptDate(request.warehouseReceiptAt || new Date());
        setActualReceivedQuantity(request.actualReceivedQuantity || 0);
      }
      
      setItemGroup1(request.itemGroup1 || '');
      setItemGroup2(request.itemGroup2 || '');
      setItemGroup3(request.itemGroup3 || '');
      setDispatchMemo(request.dispatchMemo || '');

      // 지점 출고 수량 초기화
      if (request.branchDispatchQuantities && request.branchDispatchQuantities.length > 0) {
        setBranchDispatchQuantities(request.branchDispatchQuantities);
        setBranchReceiptQuantities(request.branchDispatchQuantities);
      } else if (request.currentStatus === 'warehouse_received' || request.currentStatus === 'partial_dispatched') {
        // warehouse_received나 partial_dispatched 상태일 때 빠른입력과 동일하게 초기화
        const initialDispatchQuantities = request.branchRequirements?.map(req => {
          // 기존 출고 정보가 있으면 사용, 없으면 초기값 설정
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
        setBranchDispatchQuantities(initialDispatchQuantities);
        setBranchReceiptQuantities(initialDispatchQuantities);
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

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      const updatedHistory = [...currentHistory, newHistoryEntry];

      await updateDoc(requestRef, {
        currentStatus: 'ecount_registered',
        currentResponsibleTeam: 'purchasing',
        ecountRegisteredAt: Timestamp.now(),
        ecountRegistererUid: userProfile?.id || '',
        itemGroup1: itemGroup1,
        itemGroup2: itemGroup2,
        itemGroup3: itemGroup3,
        statusHistory: updatedHistory,
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

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      const updatedHistory = [...currentHistory, updateHistoryEntry];

      await updateDoc(requestRef, {
        itemGroup1: itemGroup1,
        itemGroup2: itemGroup2,
        itemGroup3: itemGroup3,
        statusHistory: updatedHistory,
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

      // 현재 statusHistory가 배열인지 확인하고 안전하게 처리
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      console.log('현재 히스토리:', currentHistory);
      console.log('추가할 히스토리:', newHistoryEntry);

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const updatedHistory = [...currentHistory, newHistoryEntry];

      await updateDoc(requestRef, {
        currentStatus: 'po_completed',
        currentResponsibleTeam: 'logistics',
        poCompletedAt: Timestamp.now(),
        poCompleterUid: userProfile?.id || '',
        expectedDeliveryDate: Timestamp.fromDate(expectedDeliveryDate),
        expectedDeliveryQuantity: expectedDeliveryQuantity,
        actualSupplier: finalActualSupplier,
        statusHistory: updatedHistory,
        updatedAt: Timestamp.now(),
      });

      console.log('구매처 발주 완료 처리 성공:', request.id);
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

      console.log('물류창고 입고 - 현재 히스토리:', request.statusHistory);
      console.log('물류창고 입고 - 추가할 히스토리:', newHistoryEntry);

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      const updatedHistory = [...currentHistory, newHistoryEntry];

      await updateDoc(requestRef, {
        currentStatus: 'warehouse_received',
        currentResponsibleTeam: 'logistics',
        warehouseReceiptAt: Timestamp.fromDate(actualReceiptDate),
        warehouseReceiptUid: userProfile?.id || '',
        actualReceivedQuantity: actualReceivedQuantity,
        statusHistory: updatedHistory,
        updatedAt: Timestamp.now(),
      });

      console.log('물류창고 입고 완료 처리 성공:', request.id);
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

      console.log('지점 출고 - 현재 히스토리:', request.statusHistory);
      console.log('지점 출고 - 추가할 히스토리:', newHistoryEntry);

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      const updatedHistory = [...currentHistory, newHistoryEntry];

      const updateData = removeUndefinedValues({
        currentStatus: 'branch_dispatched',
        currentResponsibleTeam: 'operations',
        branchDispatchCompletedAt: Timestamp.now(),
        branchDispatchCompleterUid: userProfile?.id || '',
        branchDispatchQuantities: branchDispatchQuantities.map(branch => removeUndefinedValues(branch)),
        dispatchMemo: dispatchMemo,
        statusHistory: updatedHistory,
        updatedAt: Timestamp.now(),
      });

      await updateDoc(requestRef, updateData);

      console.log('지점 출고 완료 처리 성공:', request.id);
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

      // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
      const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
      const updatedHistory = [...currentHistory, newHistoryEntry];

      await updateDoc(requestRef, {
        currentStatus: 'branch_received_confirmed',
        currentResponsibleTeam: 'completed',
        branchReceiptConfirmedAt: Timestamp.now(),
        branchReceiptConfirmerUid: userProfile?.id || '',
        branchDispatchQuantities: branchReceiptQuantities,
        statusHistory: updatedHistory,
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
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">요청일</Typography>
                  <Typography variant="body2">{request.requestDate.toLocaleDateString('ko-KR')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">부품번호</Typography>
                  <Typography variant="body2">{request.requestedPartNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">부품명</Typography>
                  <Typography variant="body2">{request.requestedPartName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">판매가</Typography>
                  <Typography variant="body2">
                    {request.price && request.price > 0 
                      ? `${request.price.toLocaleString()}원` 
                      : '미입력'
                    }
                  </Typography>
                </Box>
                
                {/* 품목그룹 정보 */}
                <Box>
                  <Typography variant="caption" color="text.secondary">품목그룹 1</Typography>
                  <Typography variant="body2">{request.itemGroup1 || '미입력'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">품목그룹 2</Typography>
                  <Typography variant="body2">{request.itemGroup2 || '미입력'}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">품목그룹 3</Typography>
                  <Typography variant="body2">{request.itemGroup3 || '미입력'}</Typography>
                </Box>
                
                {/* 요청 수량 명세 */}
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">요청 수량 명세</Typography>
                  <Box sx={{ mt: 1, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">총 요청수량</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {request.totalRequestedQuantity?.toLocaleString() || 0}개
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">지점별 요청</Typography>
                        <Typography variant="body2">
                          {request.branchRequirements?.reduce((sum, req) => sum + Number(req.requestedQuantity), 0).toLocaleString() || 0}개
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">물류창고 적정재고</Typography>
                        <Typography variant="body2">
                          {request.logisticsStockQuantity?.toLocaleString() || 0}개
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* 지점별 상세 수량 */}
                    {request.branchRequirements && request.branchRequirements.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          지점별 상세 요청수량
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 1 }}>
                          {request.branchRequirements.map((req, index) => (
                            <Box key={index} sx={{ 
                              p: 1, 
                              bgcolor: 'white', 
                              borderRadius: 0.5, 
                              border: '1px solid', 
                              borderColor: 'grey.300',
                              textAlign: 'center'
                            }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {req.branchName}
                              </Typography>
                              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.85rem' }}>
                                {Number(req.requestedQuantity).toLocaleString()}개
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                {/* 부품 설명 표시 */}
                {request.partDescription && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">부품 설명</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      {request.partDescription}
                    </Typography>
                  </Box>
                )}
                
                {/* 요청 관련 메모 표시 */}
                {request.notes && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">요청 관련 메모</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5, p: 1, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
                      📝 {request.notes}
                    </Typography>
                  </Box>
                )}
                
                {/* 첨부 이미지 표시 */}
                {request.partImages && request.partImages.length > 0 && (
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="caption" color="text.secondary">첨부 이미지 ({request.partImages.length}개)</Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {request.partImages.map((image, index) => (
                        <Box key={index} sx={{ 
                          width: 100, 
                          height: 100, 
                          border: '1px solid', 
                          borderColor: 'grey.300', 
                          borderRadius: 1,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.50'
                        }}>
                          {typeof image === 'string' ? (
                            <img 
                              src={image} 
                              alt={`부품 이미지 ${index + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover' 
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '🖼️<br/>이미지<br/>로드 실패';
                              }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                              🖼️<br/>이미지<br/>{index + 1}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 구매처 발주 섹션 */}
          {userProfile?.role !== 'operations' && (request.currentStatus === 'operations_submitted' || 
            request.currentStatus === 'po_completed' || 
            editMode) && (
            <Accordion expanded={expandedSections.po} onChange={() => toggleSection('po')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">구매처 발주</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {request.currentStatus === 'operations_submitted' ? (
                  // 운영부 요청 완료 상태: 입력 가능
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
                  </Box>
                ) : (
                  // 구매처 발주 완료 상태: 읽기 전용 표시
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">입고 예정일</Typography>
                      <Typography variant="body2">
                        {request.expectedDeliveryDate?.toLocaleDateString('ko-KR') || '미입력'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">입고 예정 수량</Typography>
                      <Typography variant="body2">
                        {request.expectedDeliveryQuantity?.toLocaleString() || 0}개
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">실제 발주처</Typography>
                      <Typography variant="body2">
                        {request.actualSupplier || request.initialSupplier || '미입력'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">발주 완료일</Typography>
                      <Typography variant="body2">
                        {request.poCompletedAt?.toLocaleDateString('ko-KR') || '미입력'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* 운영담당자를 위한 물류 진행 상황 안내 */}
          {userProfile?.role === 'operations' && (
            request.currentStatus === 'po_completed' || 
            request.currentStatus === 'warehouse_received' || 
            request.currentStatus === 'partial_dispatched' ||
            request.currentStatus === 'branch_dispatched' ||
            request.currentStatus === 'branch_received_confirmed'
          ) && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                🚚 물류 진행 상황
              </Typography>
              
              {request.currentStatus === 'po_completed' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>구매처 발주가 완료되었습니다.</strong><br/>
                    물류팀에서 창고 입고 처리를 진행 중입니다.
                  </Typography>
                </Alert>
              )}
              
              {request.currentStatus === 'warehouse_received' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>물류창고 입고가 완료되었습니다.</strong><br/>
                    물류팀에서 지점 출고 처리를 진행 중입니다.
                  </Typography>
                </Alert>
              )}
              
              {request.currentStatus === 'partial_dispatched' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>일부 지점 출고가 완료되었습니다.</strong><br/>
                    물류팀에서 나머지 지점 출고를 진행 중입니다.
                  </Typography>
                </Alert>
              )}
              
              {request.currentStatus === 'branch_dispatched' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>모든 지점 출고가 완료되었습니다.</strong><br/>
                    각 지점에서 입고 확인을 진행 중입니다.
                  </Typography>
                </Alert>
              )}
              
              {request.currentStatus === 'branch_received_confirmed' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>모든 지점 입고 확인이 완료되었습니다.</strong><br/>
                    부품 취급 업무가 성공적으로 완료되었습니다.
                  </Typography>
                </Alert>
              )}

              {/* 물류 진행 상황 요약 */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
                {request.warehouseReceiptAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">창고 입고일</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {request.warehouseReceiptAt.toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                )}
                
                {request.actualReceivedQuantity && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">입고 수량</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {request.actualReceivedQuantity.toLocaleString()}개
                    </Typography>
                  </Box>
                )}
                
                {request.branchDispatchQuantities && request.branchDispatchQuantities.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">출고 완료 지점</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {request.branchDispatchQuantities.filter(b => b.isDispatched).length} / {request.branchDispatchQuantities.length}개 지점
                    </Typography>
                  </Box>
                )}
                
                {request.branchDispatchCompletedAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">출고 완료일</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {request.branchDispatchCompletedAt.toLocaleDateString('ko-KR')}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                💡 물류 관련 세부 작업은 물류팀에서 처리하며, 진행 상황은 실시간으로 업데이트됩니다.
              </Typography>
            </Box>
          )}

          {/* 물류창고 입고 섹션 */}
          {userProfile?.role !== 'operations' && (request.currentStatus === 'po_completed' || 
            request.currentStatus === 'warehouse_received' || 
            editMode) && (
            <Accordion expanded={expandedSections.warehouse} onChange={() => toggleSection('warehouse')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">물류창고 입고</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {request.currentStatus === 'po_completed' ? (
                  // 구매처 발주 완료 상태: 입력 가능
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
                  </Box>
                ) : (
                  // 물류창고 입고 완료 상태: 읽기 전용 표시
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">실제 입고일</Typography>
                      <Typography variant="body2">
                        {request.warehouseReceiptAt?.toLocaleDateString('ko-KR') || '미입력'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">실제 입고 수량</Typography>
                      <Typography variant="body2">
                        {request.actualReceivedQuantity?.toLocaleString() || 0}개
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">입고 처리자</Typography>
                      <Typography variant="body2">
                        {request.warehouseReceiptUid || '미입력'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">입고 완료일</Typography>
                      <Typography variant="body2">
                        {request.warehouseReceiptAt?.toLocaleDateString('ko-KR') || '미입력'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* 지점 출고 섹션 */}
          {userProfile?.role !== 'operations' && (request.currentStatus === 'warehouse_received' || 
            request.currentStatus === 'partial_dispatched' ||
            request.currentStatus === 'branch_dispatched' || 
            editMode) && (
            <Accordion expanded={expandedSections.dispatch} onChange={() => toggleSection('dispatch')}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">지점 출고</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {(request.currentStatus === 'warehouse_received' || request.currentStatus === 'partial_dispatched') ? (
                  // 물류창고 입고 완료 또는 부분 출고 완료 상태: 입력 가능
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 지점별 출고 수량 설정 - 빠른입력과 동일한 디자인 */}
                    <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                      🚚 지점별 출고 수량 설정
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                      {branchDispatchQuantities.map((branch, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1, 
                            p: 1, 
                            bgcolor: branch.isDispatched ? 'success.50' : 'grey.50', 
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: branch.isDispatched ? 'success.200' : 'grey.300'
                          }}
                        >
                          <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 60, fontSize: '0.85rem' }}>
                            {branch.branchName}
                          </Typography>
                          <TextField
                            type="number"
                            size="small"
                            value={branch.dispatchedQuantity}
                            onChange={(e) => {
                              const updated = [...branchDispatchQuantities];
                              updated[index] = { ...updated[index], dispatchedQuantity: Number(e.target.value) };
                              setBranchDispatchQuantities(updated);
                            }}
                            InputProps={{ 
                              endAdornment: '개',
                              sx: { fontSize: '0.8rem' }
                            }}
                            sx={{ width: 80 }}
                            disabled={branch.isDispatched}
                          />
                          {branch.isDispatched ? (
                            <Button
                              size="small"
                              onClick={() => {
                                const updated = [...branchDispatchQuantities];
                                updated[index] = { ...updated[index], isDispatched: false };
                                setBranchDispatchQuantities(updated);
                              }}
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', minWidth: 50, px: 1 }}
                            >
                              취소
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              onClick={() => {
                                const updated = [...branchDispatchQuantities];
                                updated[index] = { ...updated[index], isDispatched: true };
                                setBranchDispatchQuantities(updated);
                              }}
                              color="primary"
                              variant="contained"
                              sx={{ fontSize: '0.7rem', minWidth: 50, px: 1 }}
                            >
                              출고
                            </Button>
                          )}
                          {branch.isDispatched && (
                            <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', ml: 0.5 }}>
                              ✅
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                    
                    {/* 재고 현황 - 빠른입력과 동일한 디자인 */}
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                        📊 재고 현황
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">창고 입고 수량</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {request.actualReceivedQuantity?.toLocaleString() || 0}개
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">지점 출고 수량 합계</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {branchDispatchQuantities.filter(item => item.isDispatched).reduce((sum, item) => sum + item.dispatchedQuantity, 0).toLocaleString()}개
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">창고 보유 수량 합계</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {((request.actualReceivedQuantity || 0) - branchDispatchQuantities.filter(item => item.isDispatched).reduce((sum, item) => sum + item.dispatchedQuantity, 0)).toLocaleString()}개
                          </Typography>
                        </Box>
                        <Box sx={{ ml: 'auto' }}>
                          <Typography variant="caption" color="text.secondary">출고 완료 지점</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {branchDispatchQuantities.filter(item => item.isDispatched).length} / {branchDispatchQuantities.length}개 지점
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* 출고 메모 */}
                    <Box sx={{ mt: 2 }}>
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
                    
                    {/* 출고 완료 버튼 */}
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          color="warning"
                          onClick={async () => {
                            // 부분 출고 처리
                            const dispatchedBranches = branchDispatchQuantities.filter(item => item.isDispatched);
                            const totalDispatchedQuantity = dispatchedBranches.reduce((sum, item) => sum + item.dispatchedQuantity, 0);
                            const availableQuantity = request.actualReceivedQuantity || 0;
                            
                            if (dispatchedBranches.length === 0) {
                              setError('최소 1개 지점은 출고 완료 처리해야 합니다.');
                              return;
                            }
                            
                            if (totalDispatchedQuantity > availableQuantity) {
                              setError(`창고 보유 수량(${availableQuantity}개)을 초과하여 출고할 수 없습니다. (현재 출고 계획: ${totalDispatchedQuantity}개)`);
                              return;
                            }

                            try {
                              setProcessing(true);
                              setError('');

                              const requestRef = doc(db, 'purchaseRequests', request.id);
                              
                              const newHistoryEntry = {
                                status: 'partial_dispatched',
                                updatedAt: Timestamp.now(),
                                updatedByUid: userProfile?.id || '',
                                updatedByName: userProfile?.name || '',
                                comments: `부분 지점 출고 완료 (${dispatchedBranches.length}개 지점, 총 ${totalDispatchedQuantity}개)`,
                              };

                              // statusHistory를 직접 배열로 업데이트 (arrayUnion 대신)
                              const currentHistory = Array.isArray(request.statusHistory) ? request.statusHistory : [];
                              const updatedHistory = [...currentHistory, newHistoryEntry];

                              const updateData = removeUndefinedValues({
                                currentStatus: 'partial_dispatched',
                                currentResponsibleTeam: 'logistics',
                                branchDispatchQuantities: branchDispatchQuantities.map(branch => removeUndefinedValues(branch)),
                                dispatchMemo: dispatchMemo,
                                statusHistory: updatedHistory,
                                updatedAt: Timestamp.now(),
                              });

                              await updateDoc(requestRef, updateData);
                              onUpdate();
                              onClose();
                              
                            } catch (error) {
                              console.error('부분 출고 처리 실패:', error);
                              setError('부분 출고 처리에 실패했습니다.');
                            } finally {
                              setProcessing(false);
                            }
                          }}
                          disabled={processing || branchDispatchQuantities.filter(item => item.isDispatched).length === 0}
                          startIcon={processing ? <CircularProgress size={20} /> : null}
                          sx={{ flex: 1 }}
                        >
                          부분 출고 완료
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleBranchDispatch}
                          disabled={processing || branchDispatchQuantities.filter(item => item.isDispatched).length !== branchDispatchQuantities.length}
                          startIcon={processing ? <CircularProgress size={20} /> : null}
                          sx={{ flex: 1 }}
                        >
                          전체 출고 완료
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  // 지점 출고 완료 상태: 읽기 전용 표시
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">창고 보유 수량</Typography>
                        <Typography variant="body2">
                          {request.actualReceivedQuantity?.toLocaleString() || 0}개
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">총 출고 수량</Typography>
                        <Typography variant="body2">
                          {request.branchDispatchQuantities?.reduce((sum, branch) => sum + (branch.dispatchedQuantity || 0), 0).toLocaleString() || 0}개
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">출고 완료일</Typography>
                        <Typography variant="body2">
                          {request.branchDispatchCompletedAt?.toLocaleDateString('ko-KR') || '미입력'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* 지점별 출고 수량 읽기 전용 테이블 */}
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        지점별 출고 수량
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>지점명</TableCell>
                              <TableCell align="center">출고 수량</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {request.branchDispatchQuantities?.map((branch, index) => (
                              <TableRow key={index}>
                                <TableCell>{branch.branchName}</TableCell>
                                <TableCell align="center">
                                  {branch.dispatchedQuantity?.toLocaleString() || 0}개
                                </TableCell>
                              </TableRow>
                            )) || (
                              <TableRow>
                                <TableCell colSpan={2} align="center">출고 정보가 없습니다.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                    
                    {/* 출고 메모 표시 */}
                    {request.dispatchMemo && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">출고 메모</Typography>
                        <Typography variant="body2" sx={{ mt: 0.5, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                          {request.dispatchMemo}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}

          {/* 지점 입고 확인 섹션 */}
          {userProfile?.role !== 'operations' && (request.currentStatus === 'branch_dispatched' || 
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
              <Typography variant="h6">
                처리 히스토리
                {request.expectedDeliveryDate && 
                 !request.warehouseReceiptAt && // 입고 완료되지 않은 요청만
                 request.expectedDeliveryDate < new Date() && 
                 request.currentStatus !== 'branch_received_confirmed' && 
                 request.currentStatus !== 'process_terminated' && (
                  <Chip 
                    label="⚠️ 입고 예정일 지연" 
                    color="error" 
                    size="small" 
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {/* 지연 정보 표시 */}
              {request.expectedDeliveryDate && 
               !request.warehouseReceiptAt && // 입고 완료되지 않은 요청만
               request.expectedDeliveryDate < new Date() && 
               request.currentStatus !== 'branch_received_confirmed' && 
               request.currentStatus !== 'process_terminated' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>입고 예정일 지연:</strong> {request.expectedDeliveryDate.toLocaleDateString('ko-KR')} 예정이었으나 
                    {Math.ceil((new Date().getTime() - request.expectedDeliveryDate.getTime()) / (1000 * 60 * 60 * 24))}일 지연됨
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>현재 상태:</strong> {getStatusLabel(request.currentStatus)}
                  </Typography>
                </Alert>
              )}

              {/* 주요 일정 정보 */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📅 주요 일정 정보
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">요청일</Typography>
                    <Typography variant="body2">{request.requestDate?.toLocaleDateString('ko-KR')}</Typography>
                  </Box>
                  {request.expectedDeliveryDate && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">입고 예정일</Typography>
                      <Typography variant="body2" color={request.expectedDeliveryDate < new Date() ? 'error.main' : 'text.primary'}>
                        {request.expectedDeliveryDate.toLocaleDateString('ko-KR')}
                        {request.expectedDeliveryDate < new Date() && ' (지연)'}
                      </Typography>
                    </Box>
                  )}
                  {request.warehouseReceiptAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">실제 입고일</Typography>
                      <Typography variant="body2">{request.warehouseReceiptAt.toLocaleDateString('ko-KR')}</Typography>
                    </Box>
                  )}
                  {request.branchDispatchCompletedAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">출고 완료일</Typography>
                      <Typography variant="body2">{request.branchDispatchCompletedAt.toLocaleDateString('ko-KR')}</Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* 히스토리 테이블 */}
              {request.statusHistory && request.statusHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>순서</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell>처리자</TableCell>
                        <TableCell>처리일시</TableCell>
                        <TableCell>코멘트</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {request.statusHistory
                        .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
                        .map((history, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(history.status)} 
                              color={getStatusColor(history.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{history.updatedByName}</TableCell>
                          <TableCell>
                            {history.updatedAt?.toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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