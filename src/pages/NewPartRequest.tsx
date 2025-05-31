import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Input,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Branch, BranchRequirement } from '../types';
import { useNumberInput } from '../hooks/useNumberInput';
import { notificationService } from '../services/notificationService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ItemGroupAutocomplete from '../components/ItemGroupAutocomplete';
import { recordMultipleItemGroupUsage } from '../services/itemGroupService';

const steps = ['부품 정보 입력', '첫 구매 요청 정보'];

const NewPartRequest: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);

  // 입력 필드 ref들
  const partNumberRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const itemGroup1Ref = useRef<HTMLInputElement>(null);
  const itemGroup2Ref = useRef<HTMLInputElement>(null);
  const itemGroup3Ref = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const importanceRef = useRef<HTMLSelectElement>(null);
  const supplierRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);

  // 부품 정보
  const [partInfo, setPartInfo] = useState({
    partNumber: '',
    name: '',
    itemGroup1: '',
    itemGroup2: '',
    itemGroup3: '',
    description: '',
    images: [] as File[],
  });

  // 구매 요청 정보
  const [purchaseRequestInfo, setPurchaseRequestInfo] = useState({
    supplier: '',
    branchRequirements: [] as BranchRequirement[],
    notes: '',
  });

  // 다중 지점 선택 Dialog 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  
  // 메모 입력 Dialog 상태
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);

  // 숫자 입력 필드들을 위한 커스텀 훅들
  const priceInput = useNumberInput({ initialValue: 0, defaultValue: 0 });
  const logisticsStockInput = useNumberInput({ initialValue: 0, defaultValue: 0 });
  const commonQuantityInput = useNumberInput({ initialValue: 1, defaultValue: 1 });

  // URL 파라미터에서 부품 정보 로드
  useEffect(() => {
    const partNumber = searchParams.get('partNumber');
    const name = searchParams.get('name');
    const itemGroup1 = searchParams.get('itemGroup1');
    const itemGroup2 = searchParams.get('itemGroup2');
    const itemGroup3 = searchParams.get('itemGroup3');
    const price = searchParams.get('price');
    const description = searchParams.get('description');

    if (partNumber || name) {
      setPartInfo({
        partNumber: partNumber || '',
        name: name || '',
        itemGroup1: itemGroup1 || '',
        itemGroup2: itemGroup2 || '',
        itemGroup3: itemGroup3 || '',
        description: description || '',
        images: [],
      });

      if (price) {
        priceInput.setValue(Number(price));
      }

      // URL 파라미터 정리
      navigate('/new-part-request', { replace: true });
    }
  }, [searchParams, navigate, priceInput]);

  // 지점 목록 가져오기
  const fetchBranches = async () => {
    try {
      const branchesQuery = collection(db, 'branches');
      const querySnapshot = await getDocs(branchesQuery);
      
      const branchesData: Branch[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastModifiedAt: doc.data().lastModifiedAt?.toDate() || new Date(),
      } as Branch)).filter(branch => branch.isActive);
      
      branchesData.sort((a, b) => a.branchName.localeCompare(b.branchName));
      setBranches(branchesData);
    } catch (error) {
      console.error('지점 목록을 가져오는데 실패했습니다:', error);
      setError('지점 목록을 가져오는데 실패했습니다: ' + error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // 엔터키 핸들러
  const handleKeyDown = (event: React.KeyboardEvent, nextRef?: React.RefObject<HTMLElement | null>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  // 이미지 파일 선택 처리
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setPartInfo(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray]
      }));
    }
  };

  // 이미지 파일 삭제
  const removeImage = (index: number) => {
    setPartInfo(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 지점별 수량 추가
  const addBranchRequirement = () => {
    if (branches.length === 0) {
      setError('등록된 활성 지점이 없습니다. 관리자에게 문의하세요.');
      return;
    }

    const availableBranches = branches.filter(branch => 
      !purchaseRequestInfo.branchRequirements.some(req => req.branchId === branch.id)
    );

    if (availableBranches.length === 0) {
      setError('모든 지점이 이미 추가되었습니다.');
      return;
    }

    setDialogOpen(true);
  };

  // 지점 선택/해제
  const handleBranchSelection = (branchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBranchIds(prev => [...prev, branchId]);
    } else {
      setSelectedBranchIds(prev => prev.filter(id => id !== branchId));
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const availableBranchIds = branches
        .filter(branch => !purchaseRequestInfo.branchRequirements.some(req => req.branchId === branch.id))
        .map(branch => branch.id);
      setSelectedBranchIds(availableBranchIds);
    } else {
      setSelectedBranchIds([]);
    }
  };

  // 선택된 지점들 추가
  const handleAddSelectedBranches = () => {
    const finalQuantity = commonQuantityInput.getNumberValue();

    const newRequirements: BranchRequirement[] = selectedBranchIds.map(branchId => {
      const branch = branches.find(b => b.id === branchId)!;
      return {
        branchId: branch.id,
        branchName: branch.branchName,
        requestedQuantity: finalQuantity,
      };
    });

    setPurchaseRequestInfo(prev => ({
      ...prev,
      branchRequirements: [...prev.branchRequirements, ...newRequirements],
    }));

    setDialogOpen(false);
    setSelectedBranchIds([]);
    commonQuantityInput.reset();
  };

  // 지점별 수량 삭제
  const removeBranchRequirement = (index: number) => {
    setPurchaseRequestInfo(prev => ({
      ...prev,
      branchRequirements: prev.branchRequirements.filter((_, i) => i !== index),
    }));
  };

  // 지점별 수량 업데이트
  const updateBranchRequirement = (index: number, field: keyof BranchRequirement, value: any) => {
    setPurchaseRequestInfo(prev => ({
      ...prev,
      branchRequirements: prev.branchRequirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      ),
    }));

    // 지점 변경 시 지점명도 업데이트
    if (field === 'branchId') {
      const selectedBranch = branches.find(b => b.id === value);
      if (selectedBranch) {
        setPurchaseRequestInfo(prev => ({
          ...prev,
          branchRequirements: prev.branchRequirements.map((req, i) => 
            i === index ? { ...req, branchName: selectedBranch.branchName } : req
          ),
        }));
      }
    }
  };

  // 지점별 수량을 위한 개선된 핸들러
  const handleBranchQuantityFocus = (index: number) => {
    const currentQuantity = purchaseRequestInfo.branchRequirements[index].requestedQuantity;
    // 0이거나 빈 문자열이면 빈 값으로 설정 (useNumberInput과 동일한 동작)
    if (currentQuantity === 0 || currentQuantity === '') {
      updateBranchRequirement(index, 'requestedQuantity', '');
    }
  };

  const handleBranchQuantityBlur = (index: number, value: string | number) => {
    // 빈 값이거나 유효하지 않은 숫자면 0으로 복원 (useNumberInput과 동일한 동작)
    if (value === '' || value === null || value === undefined || isNaN(Number(value))) {
      updateBranchRequirement(index, 'requestedQuantity', 0);
    } else {
      // 유효한 숫자면 숫자로 변환하여 저장
      updateBranchRequirement(index, 'requestedQuantity', Number(value));
    }
  };

  const handleBranchQuantityChange = (index: number, value: string) => {
    // 빈 문자열이면 그대로 두고, 아니면 숫자로 변환 (useNumberInput과 동일한 동작)
    if (value === '') {
      updateBranchRequirement(index, 'requestedQuantity', '');
    } else {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        updateBranchRequirement(index, 'requestedQuantity', numValue);
      }
    }
  };

  // 총 요청 수량 계산
  const calculateTotalQuantity = () => {
    const branchTotal = purchaseRequestInfo.branchRequirements.reduce(
      (sum, req) => {
        const quantity = typeof req.requestedQuantity === 'string'
          ? (req.requestedQuantity === '' ? 0 : Number(req.requestedQuantity))
          : req.requestedQuantity;
        return sum + quantity;
      }, 0
    );
    const logisticsQuantity = logisticsStockInput.getNumberValue();
    return branchTotal + logisticsQuantity;
  };

  // 다음 단계
  const handleNext = () => {
    setError('');

    if (activeStep === 0) {
      if (!partInfo.partNumber || !partInfo.name) {
        setError('품번과 품명은 필수 입력 항목입니다.');
        return;
      }
    } else if (activeStep === 1) {
      const totalQuantity = calculateTotalQuantity();
      if (totalQuantity <= 0) {
        setError('총 요청 수량이 0보다 커야 합니다.');
        return;
      }
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // 이전 단계
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // 요청 ID 생성
  const generateRequestId = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const requestsQuery = query(
      collection(db, 'purchaseRequests'),
      where('requestId', '>=', `REQ-${dateStr}-001`),
      where('requestId', '<=', `REQ-${dateStr}-999`)
    );
    const querySnapshot = await getDocs(requestsQuery);
    const nextNumber = querySnapshot.size + 1;
    
    return `REQ-${dateStr}-${nextNumber.toString().padStart(3, '0')}`;
  };

  // 저장 및 요청 완료
  const handleSubmit = async () => {
    if (!partInfo.partNumber || !partInfo.name) {
      setError('품번과 품명은 필수 입력 항목입니다.');
      return;
    }

    if (purchaseRequestInfo.branchRequirements.length === 0) {
      setError('최소 하나 이상의 지점 요청이 필요합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. 부품 등록
      const partData = {
        partNumber: partInfo.partNumber,
        partName: partInfo.name,
        itemGroup1: partInfo.itemGroup1,
        itemGroup2: partInfo.itemGroup2,
        itemGroup3: partInfo.itemGroup3,
        description: partInfo.description,
        price: priceInput.getNumberValue(),
        currency: 'KRW',
        status: 'active',
        creatorUid: userProfile?.id || '',
        creatorName: userProfile?.name || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const partDocRef = await addDoc(collection(db, 'parts'), partData);

      // 품목그룹 사용 기록 저장
      await recordMultipleItemGroupUsage(
        partInfo.itemGroup1,
        partInfo.itemGroup2,
        partInfo.itemGroup3
      );

      // 2. 구매 요청 등록
      const requestId = await generateRequestId();
      const totalQuantity = calculateTotalQuantity();

      // undefined 값 제거 함수
      const removeUndefinedValues = (obj: any): any => {
        const cleaned: any = {};
        Object.keys(obj).forEach(key => {
          if (obj[key] !== undefined && obj[key] !== null) {
            if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
              const nestedCleaned = removeUndefinedValues(obj[key]);
              if (Object.keys(nestedCleaned).length > 0) {
                cleaned[key] = nestedCleaned;
              }
            } else {
              cleaned[key] = obj[key];
            }
          }
        });
        return cleaned;
      };

      const requestData = removeUndefinedValues({
        requestId,
        partId: partDocRef.id,
        requestedPartName: partInfo.name,
        requestedPartNumber: partInfo.partNumber,
        requestorUid: userProfile?.id || '',
        requestorName: userProfile?.name || '',
        requestDate: Timestamp.now(),
        importance: 'medium',
        
        // 부품 상세 정보
        partDescription: partInfo.description,
        // partImages는 향후 이미지 업로드 기능 구현 시 추가
        
        branchRequirements: purchaseRequestInfo.branchRequirements.map(req => ({
          ...req,
          requestedQuantity: typeof req.requestedQuantity === 'string' 
            ? (req.requestedQuantity === '' ? 0 : Number(req.requestedQuantity))
            : req.requestedQuantity
        })),
        logisticsStockQuantity: logisticsStockInput.getNumberValue(),
        totalRequestedQuantity: totalQuantity,
        initialSupplier: purchaseRequestInfo.supplier || '',
        price: priceInput.getNumberValue(),
        currency: 'KRW',
        itemGroup1: partInfo.itemGroup1 || '',
        itemGroup2: partInfo.itemGroup2 || '',
        itemGroup3: partInfo.itemGroup3 || '',
        currentStatus: 'operations_submitted' as const,
        currentResponsibleTeam: 'logistics' as const,
        statusHistory: [{
          status: 'operations_submitted',
          updatedAt: Timestamp.now(),
          updatedByUid: userProfile?.id || '',
          updatedByName: userProfile?.name || '',
          comments: purchaseRequestInfo.notes || '신규 부품 등록 및 첫 구매 요청 생성'
        }],
        notes: purchaseRequestInfo.notes || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      const requestDocRef = await addDoc(collection(db, 'purchaseRequests'), requestData);

      // 3. 카카오톡 알림 발송
      try {
        const logisticsUsers = await notificationService.getUsersByRole('logistics');
        
        if (logisticsUsers.length > 0) {
          await notificationService.notifyPurchaseRequestCreated(
            requestDocRef.id,
            userProfile?.name || '알 수 없는 사용자',
            partInfo.name,
            'medium',
            userProfile?.id
          );
          
          console.log('✅ 카카오톡 알림 발송 완료:', {
            requestId: requestDocRef.id,
            partName: partInfo.name,
            recipients: logisticsUsers.length
          });
        }
      } catch (notificationError) {
        console.error('알림 발송 실패 (업무 처리는 정상 완료):', notificationError);
        // 알림 실패는 전체 프로세스를 중단시키지 않음
      }

      setSuccess(true);
      
      // 즉시 초기화 (딜레이 제거)
      setActiveStep(0);
      setPartInfo({
        partNumber: '',
        name: '',
        itemGroup1: '',
        itemGroup2: '',
        itemGroup3: '',
        description: '',
        images: [],
      });
      setPurchaseRequestInfo({
        supplier: '',
        branchRequirements: [],
        notes: '',
      });
      priceInput.setValue(0);
      logisticsStockInput.setValue(0);
      commonQuantityInput.setValue(1);
      
      // 성공 메시지는 5초 후 자동으로 사라짐 (폼 초기화와 별개)
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (error: any) {
      console.error('저장에 실패했습니다:', error);
      setError(error.message || '저장에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 권한 체크
  if (userProfile?.role !== 'operations' && userProfile?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          이 페이지는 운영사업본부 담당자만 접근할 수 있습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          신규 부품 등록 및 첫 구매 요청
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ViewListIcon />}
          onClick={() => navigate('/multi-part-request')}
          sx={{ minWidth: 160 }}
        >
          다중 부품 등록
        </Button>
      </Box>

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccess(false)}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1" fontWeight="medium">
              ✅ 부품 등록 및 첫 구매 요청이 성공적으로 완료되었습니다!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📋 물류팀에서 검토 후 처리되며, 구매요청 목록에서 진행상황을 확인할 수 있습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              💡 폼이 자동으로 초기화되어 새로운 부품을 바로 등록할 수 있습니다.
            </Typography>
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* 부품 정보 입력 */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              부품 정보 입력
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 품번, 품명, 판매가 - 3열 배치 */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="품번 *"
                  value={partInfo.partNumber}
                  onChange={(e) => setPartInfo({ ...partInfo, partNumber: e.target.value })}
                  placeholder="예: BP-2024-001"
                  inputRef={partNumberRef}
                  onKeyDown={(e) => handleKeyDown(e, nameRef)}
                />
                <TextField
                  fullWidth
                  label="품명 *"
                  value={partInfo.name}
                  onChange={(e) => setPartInfo({ ...partInfo, name: e.target.value })}
                  placeholder="예: 브레이크 패드"
                  inputRef={nameRef}
                  onKeyDown={(e) => handleKeyDown(e, priceRef)}
                />
                <TextField
                  fullWidth
                  label="판매가"
                  type="number"
                  value={priceInput.value}
                  onChange={(e) => priceInput.handleChange(e.target.value)}
                  InputProps={{
                    endAdornment: '원'
                  }}
                  inputRef={priceRef}
                  onFocus={priceInput.handleFocus}
                  onBlur={priceInput.handleBlur}
                  onKeyDown={(e) => handleKeyDown(e, itemGroup1Ref)}
                />
              </Box>

              {/* 품목그룹 - 3열 배치 */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <ItemGroupAutocomplete
                  groupLevel={1}
                  value={partInfo.itemGroup1}
                  onChange={(value) => setPartInfo({ ...partInfo, itemGroup1: value })}
                  textFieldProps={{
                    fullWidth: true,
                    inputRef: itemGroup1Ref,
                    onKeyDown: (e) => handleKeyDown(e, itemGroup2Ref),
                  }}
                />
                <ItemGroupAutocomplete
                  groupLevel={2}
                  value={partInfo.itemGroup2}
                  onChange={(value) => setPartInfo({ ...partInfo, itemGroup2: value })}
                  textFieldProps={{
                    fullWidth: true,
                    inputRef: itemGroup2Ref,
                    onKeyDown: (e) => handleKeyDown(e, itemGroup3Ref),
                  }}
                />
                <ItemGroupAutocomplete
                  groupLevel={3}
                  value={partInfo.itemGroup3}
                  onChange={(value) => setPartInfo({ ...partInfo, itemGroup3: value })}
                  textFieldProps={{
                    fullWidth: true,
                    inputRef: itemGroup3Ref,
                    onKeyDown: (e) => handleKeyDown(e, descriptionRef),
                  }}
                />
              </Box>

              {/* 상품 관련 메모 - 높이 축소 */}
              <TextField
                fullWidth
                label="상품 관련 메모"
                multiline
                rows={2}
                value={partInfo.description}
                onChange={(e) => setPartInfo({ ...partInfo, description: e.target.value })}
                placeholder="부품에 대한 상세한 설명이나 특이사항을 입력하세요"
                inputRef={descriptionRef}
                onKeyDown={(e) => handleKeyDown(e, importanceRef)}
              />

              {/* 이미지 파일 첨부 */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  이미지 파일 첨부
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  이미지 파일 선택
                  <Input
                    type="file"
                    inputProps={{ 
                      multiple: true, 
                      accept: 'image/*' 
                    }}
                    onChange={handleImageChange}
                    sx={{ display: 'none' }}
                  />
                </Button>
                
                {partInfo.images.length > 0 && (
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      선택된 파일 ({partInfo.images.length}개):
                    </Typography>
                    {partInfo.images.map((file, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2">{file.name}</Typography>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => removeImage(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 첫 구매 요청 정보 */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              첫 구매 요청 정보
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* 지점별 필요수량 */}
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  각 지점별 필요수량 목록
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addBranchRequirement}
                  sx={{ mb: 2 }}
                >
                  지점 추가 (다중 선택)
                </Button>
                
                {purchaseRequestInfo.branchRequirements.length > 0 && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    {purchaseRequestInfo.branchRequirements.map((req, index) => (
                      <Box key={index} sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'grey.300', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        <FormControl sx={{ minWidth: 120 }} size="small">
                          <Select
                            value={req.branchId}
                            onChange={(e) => updateBranchRequirement(index, 'branchId', e.target.value)}
                            displayEmpty
                          >
                            {branches
                              .filter(branch => 
                                !purchaseRequestInfo.branchRequirements.some((r, i) => 
                                  i !== index && r.branchId === branch.id
                                )
                              )
                              .map(branch => (
                                <MenuItem key={branch.id} value={branch.id}>
                                  {branch.branchName}
                                </MenuItem>
                              ))
                            }
                          </Select>
                        </FormControl>
                        
                        <TextField
                          type="number"
                          size="small"
                          label="수량"
                          value={req.requestedQuantity}
                          onChange={(e) => handleBranchQuantityChange(index, e.target.value)}
                          onFocus={() => handleBranchQuantityFocus(index)}
                          onBlur={(e) => handleBranchQuantityBlur(index, e.target.value)}
                          sx={{ width: 80 }}
                        />
                        
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => removeBranchRequirement(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth
                label="물류 적정재고 요청수량"
                type="number"
                value={logisticsStockInput.value}
                onChange={(e) => logisticsStockInput.handleChange(e.target.value)}
                helperText="물류창고에 비축할 수량"
                onFocus={logisticsStockInput.handleFocus}
                onBlur={logisticsStockInput.handleBlur}
              />

              {/* 총 요청수량 표시 */}
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  총 요청수량: {calculateTotalQuantity().toLocaleString()}개
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  지점별 수량: {purchaseRequestInfo.branchRequirements.reduce((sum, req) => {
                    const quantity = typeof req.requestedQuantity === 'string'
                      ? (req.requestedQuantity === '' ? 0 : Number(req.requestedQuantity))
                      : req.requestedQuantity;
                    return sum + quantity;
                  }, 0)}개 + 
                  물류재고: {logisticsStockInput.getNumberValue()}개
                </Typography>
              </Box>

              {/* 구매처와 요청 관련 메모 - 1:1 비율 배치 */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  sx={{ flex: 1 }}
                  label="추천 구매처"
                  value={purchaseRequestInfo.supplier}
                  onChange={(e) => setPurchaseRequestInfo({ ...purchaseRequestInfo, supplier: e.target.value })}
                  placeholder="추천하는 구매처를 입력하세요 (선택사항)"
                  helperText="물류팀에서 참고할 추천 구매처가 있다면 입력해주세요"
                  inputRef={supplierRef}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                  <Button
                    variant={purchaseRequestInfo.notes ? "contained" : "outlined"}
                    color={purchaseRequestInfo.notes ? "primary" : "inherit"}
                    onClick={() => setMemoDialogOpen(true)}
                    sx={{ 
                      height: 56, 
                      justifyContent: 'flex-start',
                      textAlign: 'left',
                      px: 2
                    }}
                  >
                    {purchaseRequestInfo.notes 
                      ? `메모: ${purchaseRequestInfo.notes.substring(0, 30)}${purchaseRequestInfo.notes.length > 30 ? '...' : ''}`
                      : '+ 요청 관련 메모 추가'
                    }
                  </Button>
                  {purchaseRequestInfo.notes && (
                    <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
                      메모가 입력되었습니다. 클릭하여 수정할 수 있습니다.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 하단 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button 
          disabled={activeStep === 0} 
          onClick={handleBack}
        >
          이전
        </Button>
        
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : undefined}
          >
            {loading ? '저장 중...' : '저장 및 요청 완료'}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleNext}>
            다음
          </Button>
        )}
      </Box>

      {/* 다중 지점 선택 Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          추가할 지점 선택
        </DialogTitle>
        <DialogContent>
          {(() => {
            const availableBranches = branches.filter(branch => 
              !purchaseRequestInfo.branchRequirements.some(req => req.branchId === branch.id)
            );
            
            if (availableBranches.length === 0) {
              return (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  추가할 수 있는 지점이 없습니다.
                </Typography>
              );
            }

            return (
              <>
                {/* 공통 수량 입력 */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    모든 선택 지점에 적용할 수량
                  </Typography>
                  <TextField
                    type="number"
                    value={commonQuantityInput.value}
                    onChange={(e) => commonQuantityInput.handleChange(e.target.value)}
                    onFocus={commonQuantityInput.handleFocus}
                    onBlur={commonQuantityInput.handleBlur}
                    size="small"
                    sx={{ width: 150 }}
                    InputProps={{
                      endAdornment: '개'
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    선택한 모든 지점에 동일한 수량이 적용됩니다.
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedBranchIds.length === availableBranches.length && availableBranches.length > 0}
                      indeterminate={selectedBranchIds.length > 0 && selectedBranchIds.length < availableBranches.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  }
                  label="전체 선택"
                  sx={{ mb: 1 }}
                />
                <List dense>
                  {availableBranches.map(branch => (
                    <ListItem key={branch.id} dense>
                      <ListItemIcon>
                        <Checkbox
                          checked={selectedBranchIds.includes(branch.id)}
                          onChange={(e) => handleBranchSelection(branch.id, e.target.checked)}
                        />
                      </ListItemIcon>
                      <ListItemText primary={branch.branchName} />
                    </ListItem>
                  ))}
                </List>
              </>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={handleAddSelectedBranches}
            variant="contained"
            disabled={selectedBranchIds.length === 0}
          >
            선택한 지점 추가 ({selectedBranchIds.length}개, 각 {commonQuantityInput.getNumberValue()}개씩)
          </Button>
        </DialogActions>
      </Dialog>

      {/* 메모 입력 Dialog */}
      <Dialog open={memoDialogOpen} onClose={() => setMemoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          요청 관련 메모
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="요청 관련 메모"
            multiline
            rows={4}
            value={purchaseRequestInfo.notes}
            onChange={(e) => setPurchaseRequestInfo({ ...purchaseRequestInfo, notes: e.target.value })}
            placeholder="특별한 요구사항이나 메모를 입력하세요"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemoDialogOpen(false)}>
            취소
          </Button>
          <Button 
            onClick={() => setMemoDialogOpen(false)}
            variant="contained"
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewPartRequest; 