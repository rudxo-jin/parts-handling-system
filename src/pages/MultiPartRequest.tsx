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
          importance,
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
          notes: undefined
        }));

        await createIndividualPartsRequest(
          partsData,
          currentUser.uid,
          currentUser.displayName || currentUser.email || ''
        );
        
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
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/purchase-requests')}
        >
          목록으로
        </Button>
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
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="세트명"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    placeholder="예: 에어컨 수리 세트"
                    required
                    sx={{ flex: 1, minWidth: 250 }}
                  />
                  <FormControl sx={{ flex: 1, minWidth: 200 }}>
                    <InputLabel>중요도</InputLabel>
                    <Select
                      value={importance}
                      onChange={(e) => setImportance(e.target.value as any)}
                      label="중요도"
                    >
                      <MenuItem value="low">낮음</MenuItem>
                      <MenuItem value="medium">보통</MenuItem>
                      <MenuItem value="high">높음</MenuItem>
                      <MenuItem value="urgent">긴급</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <TextField
                  fullWidth
                  label="세트 설명"
                  value={setDescription}
                  onChange={(e) => setSetDescription(e.target.value)}
                  multiline
                  rows={2}
                  placeholder="세트에 대한 설명을 입력하세요"
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
                    {/* 부품 정보 - 한 줄로 표기 */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <TextField
                        label="부품번호"
                        value={part.partNumber}
                        onChange={(e) => updatePart(partIndex, 'partNumber', e.target.value)}
                        required
                        size="small"
                        sx={{ width: 140 }}
                      />
                      <TextField
                        label="부품명"
                        value={part.partName}
                        onChange={(e) => updatePart(partIndex, 'partName', e.target.value)}
                        required
                        size="small"
                        sx={{ width: 250 }}
                      />
                      <TextField
                        label="판매가"
                        type="number"
                        value={part.price}
                        onChange={(e) => updatePart(partIndex, 'price', e.target.value ? Number(e.target.value) : '')}
                        size="small"
                        InputProps={{ inputProps: { min: 0 } }}
                        sx={{ width: 120 }}
                      />
                      <TextField
                        label="품목그룹1"
                        value={part.itemGroup1}
                        onChange={(e) => updatePart(partIndex, 'itemGroup1', e.target.value)}
                        size="small"
                        sx={{ width: 140 }}
                      />
                      <TextField
                        label="품목그룹2"
                        value={part.itemGroup2}
                        onChange={(e) => updatePart(partIndex, 'itemGroup2', e.target.value)}
                        size="small"
                        sx={{ width: 140 }}
                      />
                      <TextField
                        label="품목그룹3"
                        value={part.itemGroup3}
                        onChange={(e) => updatePart(partIndex, 'itemGroup3', e.target.value)}
                        size="small"
                        sx={{ width: 140 }}
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

                    {/* 수량 설정 - 한 줄로 표기 */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, p: 1, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
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
                      
                      {branches.map((branch) => (
                        <TextField
                          key={branch.id}
                          label={branch.branchName}
                          type="number"
                          value={part.branchRequirements.find(req => req.branchId === branch.id)?.requestedQuantity || 0}
                          onChange={(e) => updateBranchRequirement(partIndex, branch.id, Number(e.target.value))}
                          size="small"
                          InputProps={{ inputProps: { min: 0 } }}
                          sx={{ width: 100 }}
                        />
                      ))}
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