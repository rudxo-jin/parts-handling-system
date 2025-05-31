import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Part } from '../types';
import { useNumberInput } from '../hooks/useNumberInput';
import { useNavigate } from 'react-router-dom';
import ItemGroupAutocomplete from '../components/ItemGroupAutocomplete';
import { recordMultipleItemGroupUsage } from '../services/itemGroupService';

const PartsManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newPart, setNewPart] = useState({
    partNumber: '',
    name: '',
    description: '',
    itemGroup1: '',
    itemGroup2: '',
    itemGroup3: '',
    price: 0,
    currency: 'KRW',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 가격 입력을 위한 커스텀 훅
  const priceInput = useNumberInput({ 
    initialValue: 0, 
    defaultValue: 0 
  });

  // 부품 목록 가져오기
  const fetchParts = async () => {
    try {
      setLoading(true);
      const partsQuery = query(collection(db, 'parts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(partsQuery);
      
      const partsData: Part[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Part));
      
      setParts(partsData);
    } catch (error) {
      console.error('부품 목록을 가져오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  // 새 부품 등록 (관리자만)
  const handleSubmit = async () => {
    if (!newPart.partNumber || !newPart.name) {
      alert('부품번호와 부품명은 필수 입력 항목입니다.');
      return;
    }

    try {
      setSubmitLoading(true);
      const partData = {
        ...newPart,
        price: priceInput.getNumberValue(),
        currency: 'KRW',
        images: [],
        status: 'active' as const,
        createdBy: userProfile?.id || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'parts'), partData);
      
      // 품목그룹 사용 기록 저장
      await recordMultipleItemGroupUsage(
        newPart.itemGroup1,
        newPart.itemGroup2,
        newPart.itemGroup3
      );

      setError('');
      alert('부품이 성공적으로 등록되었습니다.');
      setOpenDialog(false);
      setNewPart({
        partNumber: '',
        name: '',
        description: '',
        itemGroup1: '',
        itemGroup2: '',
        itemGroup3: '',
        price: 0,
        currency: 'KRW',
      });
      priceInput.setValue(0);
      
      fetchParts();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('부품 등록에 실패했습니다:', error);
      alert('부품 등록에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 재주문 요청
  const handleReorder = (part: Part) => {
    // 기존 부품 정보를 가지고 신규 구매요청 페이지로 이동
    const partData = {
      partNumber: part.partNumber,
      name: part.name,
      itemGroup1: part.itemGroup1 || '',
      itemGroup2: part.itemGroup2 || '',
      itemGroup3: part.itemGroup3 || '',
      price: part.price,
      description: part.description || ''
    };
    
    // URL 파라미터로 부품 정보 전달
    const params = new URLSearchParams();
    Object.entries(partData).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    
    navigate(`/new-part-request?${params.toString()}`);
  };

  // 검색 및 필터링
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      (part.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.partNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.itemGroup1 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.itemGroup2 || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (part.itemGroup3 || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || part.itemGroup1 === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // 카테고리 목록 생성
  const categories = Array.from(new Set(parts.map(part => part.itemGroup1).filter(Boolean)));

  // 가격 포맷팅
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency === 'KRW' ? 'KRW' : 'USD',
    }).format(price);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            {userProfile?.role === 'operations' ? '부품 검색 및 재주문' : '부품 관리'}
          </Typography>
          {userProfile?.role === 'operations' && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              기존 부품을 검색하고 재주문 요청을 할 수 있습니다.
            </Typography>
          )}
        </Box>
        {userProfile?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ minWidth: 120 }}
          >
            신규 부품 등록
          </Button>
        )}
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          부품이 성공적으로 등록되었습니다!
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="품명, 품번, 품목그룹으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="카테고리"
              >
                <MenuItem value="all">전체</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 부품 목록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {userProfile?.role === 'operations' ? '등록된 부품 목록' : '등록된 부품 목록'} ({filteredParts.length}개)
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>품번</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>품명</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>품목그룹</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>가격</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>상태</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredParts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        {searchTerm || categoryFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 부품이 없습니다.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParts.map((part) => (
                      <TableRow key={part.id} hover>
                        <TableCell>{part.partNumber}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {part.name}
                            </Typography>
                            {part.description && (
                              <Typography variant="caption" color="text.secondary">
                                {part.description.substring(0, 50)}{part.description.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {part.itemGroup1 && (
                              <Typography variant="body2" fontWeight="medium">
                                {part.itemGroup1}
                              </Typography>
                            )}
                            {part.itemGroup2 && (
                              <Typography variant="caption" color="text.secondary">
                                {part.itemGroup2} {part.itemGroup3 ? `> ${part.itemGroup3}` : ''}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{formatPrice(part.price, part.currency)}</TableCell>
                        <TableCell>
                          <Chip
                            label={part.status === 'active' ? '활성' : '비활성'}
                            color={part.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="primary">
                            <VisibilityIcon />
                          </IconButton>
                          {userProfile?.role === 'admin' && (
                            <IconButton size="small" color="secondary">
                              <EditIcon />
                            </IconButton>
                          )}
                          {userProfile?.role === 'operations' && (
                            <IconButton 
                              size="small" 
                              color="success"
                              onClick={() => handleReorder(part)}
                              title="재주문 요청"
                            >
                              <ShoppingCartIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 신규 부품 등록 다이얼로그 (관리자만) */}
      {userProfile?.role === 'admin' && (
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>신규 부품 등록</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="품번 *"
                  value={newPart.partNumber}
                  onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="품명 *"
                  value={newPart.name}
                  onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                />
              </Box>
              <TextField
                fullWidth
                label="상품 관련 메모"
                multiline
                rows={3}
                value={newPart.description}
                onChange={(e) => setNewPart({ ...newPart, description: e.target.value })}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <ItemGroupAutocomplete
                  groupLevel={1}
                  value={newPart.itemGroup1}
                  onChange={(value) => setNewPart({ ...newPart, itemGroup1: value })}
                />
                <ItemGroupAutocomplete
                  groupLevel={2}
                  value={newPart.itemGroup2}
                  onChange={(value) => setNewPart({ ...newPart, itemGroup2: value })}
                />
                <ItemGroupAutocomplete
                  groupLevel={3}
                  value={newPart.itemGroup3}
                  onChange={(value) => setNewPart({ ...newPart, itemGroup3: value })}
                />
              </Box>
              <TextField
                fullWidth
                label="가격"
                type="number"
                value={priceInput.value}
                onChange={(e) => priceInput.handleChange(e.target.value)}
                onFocus={priceInput.handleFocus}
                onBlur={priceInput.handleBlur}
                InputProps={{
                  endAdornment: '원'
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>취소</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={submitLoading}
            >
              {submitLoading ? <CircularProgress size={20} /> : '등록'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default PartsManagement; 