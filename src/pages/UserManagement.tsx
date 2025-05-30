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
  where 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';

const UserManagement: React.FC = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operations' as 'admin' | 'operations' | 'logistics',
    department: '',
    phone: '',
  });

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(usersQuery);
      
      const usersData: UserProfile[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as UserProfile));
      
      setUsers(usersData);
    } catch (error) {
      console.error('사용자 목록을 가져오는데 실패했습니다:', error);
      setError('사용자 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 신규 사용자 등록
  const handleSubmit = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError('이름, 이메일, 비밀번호는 필수 입력 항목입니다.');
      return;
    }

    // 이메일 중복 체크
    const existingUser = users.find(u => u.email === newUser.email && u.isActive);
    if (existingUser) {
      setError('이미 사용 중인 이메일 주소입니다.');
      return;
    }

    try {
      setSubmitLoading(true);
      setError('');

      // Firebase Authentication에 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const { user } = userCredential;

      // 사용자 프로필 업데이트
      await updateProfile(user, {
        displayName: newUser.name
      });

      // Firestore에 사용자 정보 저장
      const userData = {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        department: newUser.department,
        phone: newUser.phone,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'users'), {
        ...userData,
        id: user.uid,
      });

      setSuccess(true);
      setOpenDialog(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'operations',
        department: '',
        phone: '',
      });

      // 사용자 목록 새로고침
      fetchUsers();

      // 성공 메시지 3초 후 숨김
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('사용자 등록에 실패했습니다:', error);
      setError(error.message || '사용자 등록에 실패했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 사용자 정보 수정
  const handleEdit = async () => {
    if (!editingUser) return;

    try {
      setSubmitLoading(true);
      setError('');

      const userDocQuery = query(
        collection(db, 'users'), 
        where('id', '==', editingUser.id)
      );
      const userDocs = await getDocs(userDocQuery);
      
      if (!userDocs.empty) {
        const userDoc = userDocs.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          name: editingUser.name,
          role: editingUser.role,
          department: editingUser.department,
          phone: editingUser.phone || '',
          updatedAt: Timestamp.now(),
        });

        setSuccess(true);
        setEditingUser(null);
        fetchUsers();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('사용자 정보 수정에 실패했습니다:', error);
      setError('사용자 정보 수정에 실패했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // 사용자 활성/비활성 토글
  const toggleUserStatus = async (user: UserProfile) => {
    const action = user.isActive ? '비활성화' : '활성화';
    if (!window.confirm(`정말로 이 사용자를 ${action}하시겠습니까?`)) return;

    try {
      const userDocQuery = query(
        collection(db, 'users'), 
        where('id', '==', user.id)
      );
      const userDocs = await getDocs(userDocQuery);
      
      if (!userDocs.empty) {
        const userDoc = userDocs.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          isActive: !user.isActive,
          updatedAt: Timestamp.now(),
        });

        setSuccess(true);
        fetchUsers();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('사용자 상태 변경에 실패했습니다:', error);
      setError('사용자 상태 변경에 실패했습니다.');
    }
  };

  // 필터링된 사용자 목록
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
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
          사용자 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          sx={{ minWidth: 150 }}
        >
          신규 사용자 추가
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
              placeholder="이름, 이메일, 부서로 검색..."
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
              <InputLabel>역할</InputLabel>
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                label="역할"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="admin">관리자</MenuItem>
                <MenuItem value="operations">운영사업본부</MenuItem>
                <MenuItem value="logistics">유통사업본부</MenuItem>
              </Select>
            </FormControl>
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

      {/* 사용자 목록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            등록된 사용자 ({filteredUsers.length}명)
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
                    <TableCell sx={{ fontWeight: 'bold' }}>이름</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>이메일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>부서</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>역할</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>계정 상태</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>등록일</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>작업</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                          ? '검색 결과가 없습니다.' 
                          : '등록된 사용자가 없습니다.'
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.department}</TableCell>
                        <TableCell>
                          <Chip
                            label={
                              user.role === 'admin' ? '관리자' :
                              user.role === 'operations' ? '운영사업본부' : '유통사업본부'
                            }
                            color={
                              user.role === 'admin' ? 'error' :
                              user.role === 'operations' ? 'primary' : 'secondary'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? '활성' : '비활성'}
                            color={user.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.createdAt.toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => setEditingUser(user)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color={user.isActive ? 'error' : 'success'}
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.isActive ? <BlockIcon /> : <ActivateIcon />}
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

      {/* 신규 사용자 등록 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>신규 사용자 등록</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="이름 *"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="이메일 주소 *"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="초기 비밀번호 *"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>역할 *</InputLabel>
              <Select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                label="역할 *"
              >
                <MenuItem value="admin">관리자</MenuItem>
                <MenuItem value="operations">운영사업본부</MenuItem>
                <MenuItem value="logistics">유통사업본부</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="부서"
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            />
            <TextField
              fullWidth
              label="연락처"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
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

      {/* 사용자 정보 수정 다이얼로그 */}
      {editingUser && (
        <Dialog open={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="sm" fullWidth>
          <DialogTitle>사용자 정보 수정</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                label="이름 *"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              />
              <TextField
                fullWidth
                label="이메일 주소"
                value={editingUser.email}
                disabled
                helperText="이메일 주소는 수정할 수 없습니다."
              />
              <FormControl fullWidth>
                <InputLabel>역할 *</InputLabel>
                <Select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  label="역할 *"
                >
                  <MenuItem value="admin">관리자</MenuItem>
                  <MenuItem value="operations">운영사업본부</MenuItem>
                  <MenuItem value="logistics">유통사업본부</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="부서"
                value={editingUser.department}
                onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
              />
              <TextField
                fullWidth
                label="연락처"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingUser(null)}>취소</Button>
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

export default UserManagement; 