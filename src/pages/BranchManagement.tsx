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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
} from '@mui/icons-material';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Branch } from '../types';

const BranchManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [newBranch, setNewBranch] = useState({
    branchName: '',
  });

  // 지점 목록 가져오기
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const branchesQuery = query(collection(db, 'branches'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(branchesQuery);
      
      const branchesData: Branch[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastModifiedAt: doc.data().lastModifiedAt?.toDate() || new Date(),
      } as Branch));
      
      setBranches(branchesData);
    } catch (error) {
      console.error('지점 목록을 가져오는데 실패했습니다:', error);
      setError('지점 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // 지점 코드 생성 함수
  const generateBranchCode = async () => {
    const existingBranches = await getDocs(collection(db, 'branches'));
    const existingCodes = existingBranches.docs.map(doc => doc.data().branchCode);
    
    let newCodeNumber = 1;
    let newCode = '';
    
    do {
      newCode = `BR${newCodeNumber.toString().padStart(3, '0')}`;
      newCodeNumber++;
    } while (existingCodes.includes(newCode));
    
    return newCode;
  };

  // 신규 지점 등록
  const handleSubmit = async () => {
    if (!newBranch.branchName) {
      setError('지점명은 필수 입력 항목입니다.');
      return;
    }

    // 지점명 중복 체크 (활성 지점 중에서)
    const existingBranch = branches.find(b => 
      b.branchName === newBranch.branchName && b.isActive
    );
    if (existingBranch) {
      setError('이미 사용 중인 지점명입니다.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');

      // 지점 코드 생성
      const branchCode = await generateBranchCode();

      // Firestore에 지점 정보 저장
      const branchData = {
        branchCode,
        branchName: newBranch.branchName,
        isActive: true,
        creatorUid: userProfile?.id || '',
        createdAt: Timestamp.now(),
        lastModifierUid: userProfile?.id || '',
        lastModifiedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'branches'), branchData);

      setSuccess(true);
      setOpenDialog(false);
      setNewBranch({ branchName: '' });

      // 지점 목록 새로고침
      fetchBranches();

      // 성공 메시지 3초 후 숨김
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('지점 등록에 실패했습니다:', error);
      setError('지점 등록에 실패했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 지점 정보 수정
  const handleEdit = async () => {
    if (!editingBranch) return;

    if (!editingBranch.branchName) {
      setError('지점명은 필수 입력 항목입니다.');
      return;
    }

    // 지점명 중복 체크 (다른 활성 지점 중에서)
    const existingBranch = branches.find(b => 
      b.branchName === editingBranch.branchName && 
      b.isActive && 
      b.id !== editingBranch.id
    );
    if (existingBranch) {
      setError('이미 사용 중인 지점명입니다.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');

      await updateDoc(doc(db, 'branches', editingBranch.id), {
        branchName: editingBranch.branchName,
        lastModifierUid: userProfile?.id || '',
        lastModifiedAt: Timestamp.now(),
      });

      setSuccess(true);
      setEditingBranch(null);
      fetchBranches();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('지점 정보 수정에 실패했습니다:', error);
      setError('지점 정보 수정에 실패했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 지점 활성/비활성 토글
  const toggleBranchStatus = async (branch: Branch) => {
    const message = branch.isActive 
      ? '정말로 이 지점을 비활성화하시겠습니까? 비활성화된 지점은 신규 구매 요청 시 선택 목록에 나타나지 않습니다.'
      : '정말로 이 지점을 활성화하시겠습니까?';
    
    if (!window.confirm(message)) return;

    try {
      await updateDoc(doc(db, 'branches', branch.id), {
        isActive: !branch.isActive,
        lastModifierUid: userProfile?.id || '',
        lastModifiedAt: Timestamp.now(),
      });

      setSuccess(true);
      fetchBranches();
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('지점 상태 변경에 실패했습니다:', error);
      setError('지점 상태 변경에 실패했습니다.');
    }
  };

  // 필터링된 지점 목록
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      (branch.branchName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.branchCode || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && branch.isActive) ||
      (filterStatus === 'inactive' && !branch.isActive);

    return matchesSearch && matchesStatus;
  });

  // 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          이 페이지에 접근할 권한이 없습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          지점 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ minWidth: 120 }}
        >
          신규 지점 추가
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          작업이 성공적으로 완료되었습니다!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              variant="outlined"
              placeholder="지점명, 지점 코드로 검색..."
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
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="상태"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="active">활성</MenuItem>
                <MenuItem value="inactive">비활성</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 지점 목록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            등록된 지점 ({filteredBranches.length}개)
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
                    <TableCell sx={{ fontWeight: 'bold' }}>지점 코드</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>지점명</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>상태</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>등록일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>최종 수정일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBranches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        {searchTerm || filterStatus !== 'all' 
                          ? '검색 결과가 없습니다.' 
                          : '등록된 지점이 없습니다.'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBranches.map((branch) => (
                      <TableRow key={branch.id} hover>
                        <TableCell>{branch.branchCode}</TableCell>
                        <TableCell>{branch.branchName}</TableCell>
                        <TableCell>
                          <Chip
                            label={branch.isActive ? '활성' : '비활성'}
                            color={branch.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {branch.createdAt.toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          {branch.lastModifiedAt.toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => setEditingBranch(branch)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color={branch.isActive ? 'error' : 'success'}
                            onClick={() => toggleBranchStatus(branch)}
                          >
                            {branch.isActive ? <BlockIcon /> : <ActivateIcon />}
                          </IconButton>
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

      {/* 신규 지점 등록 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>신규 지점 등록</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="지점명 *"
              value={newBranch.branchName}
              onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
              placeholder="예: 서울강남점, 부산해운대점"
            />
            <Alert severity="info">
              지점 코드는 시스템에서 자동으로 생성됩니다. (예: BR001, BR002, ...)
            </Alert>
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

      {/* 지점 정보 수정 다이얼로그 */}
      {editingBranch && (
        <Dialog open={!!editingBranch} onClose={() => setEditingBranch(null)} maxWidth="sm" fullWidth>
          <DialogTitle>지점 정보 수정</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="지점 코드"
                value={editingBranch.branchCode}
                disabled
                helperText="지점 코드는 수정할 수 없습니다."
              />
              <TextField
                fullWidth
                label="지점명 *"
                value={editingBranch.branchName}
                onChange={(e) => setEditingBranch({ ...editingBranch, branchName: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingBranch(null)}>취소</Button>
            <Button 
              onClick={handleEdit} 
              variant="contained"
              disabled={submitLoading}
            >
              {submitLoading ? <CircularProgress size={20} /> : '저장'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default BranchManagement; 