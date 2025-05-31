import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { createMultiPartRequest, createIndividualPartsRequest } from '../services/multiPartService';
import { Branch, BranchRequirement } from '../types';
import ItemGroupAutocomplete from '../components/ItemGroupAutocomplete';
import { recordMultipleItemGroupUsage, clearAllItemGroupData } from '../services/itemGroupService';

interface PartFormData {
  partNumber: string;
  partName: string;
  itemGroup1: string;
  itemGroup2: string;
  itemGroup3: string;
  price: number | '';
  currency: string;
  branchRequirements: BranchRequirement[];
  logisticsStockQuantity: number;
}

const MultiPartRequest: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [registrationMode, setRegistrationMode] = useState<'set' | 'individual'>('individual');
  const [setName, setSetName] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');
  const [parts, setParts] = useState<PartFormData[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState<number>(0);

  useEffect(() => {
    loadBranches();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBranches = async () => {
    try {
      const branchesQuery = collection(db, 'branches');
      const querySnapshot = await getDocs(branchesQuery);
      
      const branchesData: Branch[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastModifiedAt: doc.data().lastModifiedAt?.toDate() || new Date(),
      } as Branch)).filter((branch: Branch) => branch.isActive);
      
      branchesData.sort((a, b) => a.branchName.localeCompare(b.branchName));
      setBranches(branchesData);
      
      // 지점 로드 완료 후 첫 번째 부품 추가
      if (parts.length === 0) {
        const firstPart = createEmptyPartWithBranches(branchesData);
        setParts([firstPart]);
      } else {
        // 기존 부품들에 새로운 지점 추가
        setParts(prevParts => 
          prevParts.map(part => ({
            ...part,
            branchRequirements: branchesData.map(branch => ({
              branchId: branch.id,
              branchName: branch.branchName,
              requestedQuantity: 0
            }))
          }))
        );
      }
    } catch (error) {
      console.error('지점 목록 로드 실패:', error);
      setError('지점 목록을 불러오는데 실패했습니다.');
    }
  };

  function createEmptyPart(): PartFormData {
    return {
      partNumber: '',
      partName: '',
      itemGroup1: '',
      itemGroup2: '',
      itemGroup3: '',
      price: '',
      currency: 'KRW',
      branchRequirements: branches.map(branch => ({
        branchId: branch.id,
        branchName: branch.branchName,
        requestedQuantity: 0
      })),
      logisticsStockQuantity: 0
    };
  }

  function createEmptyPartWithBranches(branchList: Branch[]): PartFormData {
    return {
      partNumber: '',
      partName: '',
      itemGroup1: '',
      itemGroup2: '',
      itemGroup3: '',
      price: '',
      currency: 'KRW',
      branchRequirements: branchList.map(branch => ({
        branchId: branch.id,
        branchName: branch.branchName,
        requestedQuantity: 0
      })),
      logisticsStockQuantity: 0
    };
  }

  const addPart = () => {
    setParts([...parts, createEmptyPart()]);
  };

  const copyPart = (index: number) => {
    const originalPart = parts[index];
    const copiedPart = {
      ...originalPart,
      partNumber: '', // 부품번호는 유니크하므로 비움
      branchRequirements: originalPart.branchRequirements.map(req => ({ ...req }))
    };
    const newParts = [...parts];
    newParts.splice(index + 1, 0, copiedPart);
    setParts(newParts);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    }
  };

  const updatePart = (index: number, field: keyof PartFormData, value: any) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setParts(updatedParts);
  };

  const updateBranchRequirement = (partIndex: number, branchId: string, quantity: number) => {
    const updatedParts = [...parts];
    const branchReqIndex = updatedParts[partIndex].branchRequirements.findIndex(
      req => req.branchId === branchId
    );
    
    if (branchReqIndex !== -1) {
      updatedParts[partIndex].branchRequirements[branchReqIndex].requestedQuantity = quantity;
      setParts(updatedParts);
    }
  };

  // 지점 일괄 입력 기능
  const applyBulkQuantity = (partIndex: number) => {
    if (bulkQuantity <= 0) return;
    
    const updatedParts = [...parts];
    updatedParts[partIndex].branchRequirements = updatedParts[partIndex].branchRequirements.map(req => ({
      ...req,
      requestedQuantity: bulkQuantity
    }));
    setParts(updatedParts);
    setBulkQuantity(0);
  };

  const validateForm = (): boolean => {
    // 세트 모드에서는 세트명 필수
    if (registrationMode === 'set' && !setName.trim()) {
      setError('세트명을 입력해주세요.');
      return false;
    }

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part.partNumber.trim()) {
        setError(`${i + 1}번째 부품의 부품번호를 입력해주세요.`);
        return false;
      }
      if (!part.partName.trim()) {
        setError(`${i + 1}번째 부품의 부품명을 입력해주세요.`);
        return false;
      }

      const totalBranchQuantity = part.branchRequirements.reduce(
        (sum, req) => sum + Number(req.requestedQuantity), 0
      );
      
      if (totalBranchQuantity === 0 && part.logisticsStockQuantity === 0) {
        setError(`${i + 1}번째 부품의 요청 수량을 입력해주세요.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (registrationMode === 'set') {
        // 세트 모드: 기존 로직
        const setData = {
          setName,
          setDescription,
          requestorUid: currentUser.uid,
          requestorName: currentUser.displayName || currentUser.email || '',
          importance: 'medium' as const,
          notes
        };

        const partsData = parts.map(part => ({
          partNumber: part.partNumber,
          partName: part.partName,
          itemGroup1: part.itemGroup1,
          itemGroup2: part.itemGroup2,
          itemGroup3: part.itemGroup3,
          price: typeof part.price === 'number' ? part.price : undefined,
          currency: part.currency,
          branchRequirements: part.branchRequirements.filter(req => Number(req.requestedQuantity) > 0),
          logisticsStockQuantity: part.logisticsStockQuantity
        }));

        const result = await createMultiPartRequest(setData, partsData);
        
        // 품목그룹 사용 기록 저장
        for (const part of parts) {
          await recordMultipleItemGroupUsage(
            part.itemGroup1,
            part.itemGroup2,
            part.itemGroup3
          );
        }
        
        setError('');
        alert(`세트 요청이 성공적으로 등록되었습니다. (세트 ID: ${result.setId})`);
        navigate('/purchase-requests');
      } else {
        // 개별 모드: 새로운 로직
        const partsData = parts.map(part => ({
          partNumber: part.partNumber,
          partName: part.partName,
          itemGroup1: part.itemGroup1,
          itemGroup2: part.itemGroup2,
          itemGroup3: part.itemGroup3,
          price: typeof part.price === 'number' ? part.price : undefined,
          currency: part.currency,
          branchRequirements: part.branchRequirements.filter(req => Number(req.requestedQuantity) > 0),
          logisticsStockQuantity: part.logisticsStockQuantity,
          importance: 'medium' as const,
          notes: notes || ''
        }));

        await createIndividualPartsRequest(
          partsData,
          currentUser.uid,
          currentUser.displayName || currentUser.email || ''
        );
        
        // 품목그룹 사용 기록 저장
        for (const part of parts) {
          await recordMultipleItemGroupUsage(
            part.itemGroup1,
            part.itemGroup2,
            part.itemGroup3
          );
        }
        
        setError('');
        alert(`${parts.length}개의 부품 요청이 성공적으로 등록되었습니다.`);
        navigate('/purchase-requests');
      }
    } catch (error) {
      console.error('부품 요청 등록 실패:', error);
      
      // 더 자세한 오류 정보 표시
      let errorMessage = '부품 요청 등록에 실패했습니다.';
      if (error instanceof Error) {
        errorMessage += ` (${error.message})`;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          다중 부품 요청 등록
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={async () => {
              if (window.confirm('모든 품목그룹 데이터를 삭제하시겠습니까?')) {
                await clearAllItemGroupData();
                alert('품목그룹 데이터가 삭제되었습니다. 페이지를 새로고침하세요.');
              }
            }}
          >
            품목그룹 데이터 삭제
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/purchase-requests')}
          >
            목록으로
          </Button>
        </Box>
      </Box>

      {/* 등록 모드 선택 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            등록 방식 선택
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant={registrationMode === 'individual' ? 'contained' : 'outlined'}
              onClick={() => setRegistrationMode('individual')}
              sx={{ minWidth: 150 }}
            >
              🔧 개별 등록
            </Button>
            <Button
              variant={registrationMode === 'set' ? 'contained' : 'outlined'}
              onClick={() => setRegistrationMode('set')}
              sx={{ minWidth: 150 }}
            >
              📦 세트로 등록
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {registrationMode === 'individual' 
              ? '각 부품을 독립적으로 등록합니다. 부품별로 개별 처리됩니다.'
              : '관련된 부품들을 하나의 세트로 묶어서 등록합니다. 세트 단위로 진행 상황을 추적할 수 있습니다.'
            }
          </Typography>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        {/* 세트 기본 정보 (세트 모드에서만 표시) */}
        {registrationMode === 'set' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📦 세트 기본 정보
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="세트명"
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="예: 에어컨 수리 세트"
                  required
                  fullWidth
                />
                <TextField
                  fullWidth
                  label="세트 설명"
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                  multiline
                  rows={3}
                  placeholder="이 세트에 포함된 부품들의 용도나 특징을 설명해주세요. 이 정보는 세트 상세보기와 히스토리에서 확인할 수 있습니다."
                  helperText="세트의 목적과 구성 부품들의 관계를 설명하면 물류팀에서 처리할 때 도움이 됩니다."
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 부품 목록 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {registrationMode === 'set' ? '📦 세트 부품 목록' : '🔧 개별 부품 목록'} ({parts.length}개)
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={addPart}
                size="small"
              >
                부품 추가
              </Button>
            </Box>

            {parts.map((part, partIndex) => (
              <Accordion key={partIndex} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      부품 #{partIndex + 1} {part.partName && `- ${part.partName}`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPart(partIndex);
                        }}
                        title="복제"
                      >
                        <CopyIcon />
                      </IconButton>
                      {parts.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            removePart(partIndex);
                          }}
                          title="삭제"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* 부품 기본 정보 - 첫 번째 행 (3열 균등 분할) */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="품번"
                        value={part.partNumber}
                        onChange={(e) => updatePart(partIndex, 'partNumber', e.target.value)}
                        required
                        size="small"
                        placeholder="예: BP-2024-001"
                      />
                      <TextField
                        fullWidth
                        label="품명"
                        value={part.partName}
                        onChange={(e) => updatePart(partIndex, 'partName', e.target.value)}
                        required
                        size="small"
                        placeholder="예: 브레이크 패드"
                      />
                      <TextField
                        fullWidth
                        label="판매가"
                        type="number"
                        value={part.price}
                        onChange={(e) => updatePart(partIndex, 'price', e.target.value ? Number(e.target.value) : '')}
                        size="small"
                        InputProps={{ 
                          inputProps: { min: 0 },
                          endAdornment: '원'
                        }}
                        placeholder="0"
                      />
                    </Box>

                    {/* 품목그룹 - 두 번째 행 (3열 균등 분할) */}
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <ItemGroupAutocomplete
                        groupLevel={1}
                        value={part.itemGroup1}
                        onChange={(value) => updatePart(partIndex, 'itemGroup1', value)}
                        textFieldProps={{
                          fullWidth: true,
                          size: 'small'
                        }}
                      />
                      <ItemGroupAutocomplete
                        groupLevel={2}
                        value={part.itemGroup2}
                        onChange={(value) => updatePart(partIndex, 'itemGroup2', value)}
                        textFieldProps={{
                          fullWidth: true,
                          size: 'small'
                        }}
                      />
                      <ItemGroupAutocomplete
                        groupLevel={3}
                        value={part.itemGroup3}
                        onChange={(value) => updatePart(partIndex, 'itemGroup3', value)}
                        textFieldProps={{
                          fullWidth: true,
                          size: 'small'
                        }}
                      />
                    </Box>

                    {/* 지점 일괄 입력 */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <TextField
                        label="일괄수량"
                        type="number"
                        value={bulkQuantity}
                        onChange={(e) => setBulkQuantity(Number(e.target.value))}
                        size="small"
                        InputProps={{ inputProps: { min: 0 } }}
                        sx={{ width: 100 }}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => applyBulkQuantity(partIndex)}
                        disabled={bulkQuantity <= 0}
                        sx={{ minWidth: 80 }}
                      >
                        일괄적용
                      </Button>
                      <Typography variant="caption" color="text.secondary">
                        모든 지점에 동일 수량 적용
                      </Typography>
                    </Box>

                    {/* 수량 설정 - 물류재고와 지점재고를 같은 행에 배치 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        {/* 물류재고 */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200', width: 'fit-content' }}>
                          <Typography variant="caption" color="primary.main" fontWeight="medium">
                            물류재고:
                          </Typography>
                          <TextField
                            type="number"
                            value={part.logisticsStockQuantity}
                            onChange={(e) => updatePart(partIndex, 'logisticsStockQuantity', Number(e.target.value))}
                            size="small"
                            InputProps={{ inputProps: { min: 0 } }}
                            sx={{ width: 80 }}
                            variant="outlined"
                          />
                        </Box>
                        
                        {/* 지점별 수량 - 2행 그리드 */}
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                          gap: 1,
                          flex: 1,
                          maxWidth: 'calc(100% - 180px)'
                        }}>
                          {branches.map((branch) => (
                            <TextField
                              key={branch.id}
                              label={branch.branchName}
                              type="number"
                              value={part.branchRequirements.find(req => req.branchId === branch.id)?.requestedQuantity || 0}
                              onChange={(e) => updateBranchRequirement(partIndex, branch.id, Number(e.target.value))}
                              size="small"
                              InputProps={{ inputProps: { min: 0 } }}
                              sx={{ width: '100%', minWidth: 130 }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>

        {/* 추가 메모 (세트 모드에서만 표시) */}
        {registrationMode === 'set' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                label="세트 추가 메모"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                placeholder="세트 요청에 대한 추가 메모를 입력하세요"
              />
            </CardContent>
          </Card>
        )}

        {/* 제출 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/purchase-requests')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : undefined}
          >
            {isSubmitting 
              ? '등록 중...' 
              : registrationMode === 'set' 
                ? '세트 요청 등록' 
                : '개별 부품 등록'
            }
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MultiPartRequest; 