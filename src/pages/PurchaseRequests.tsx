import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
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
  IconButton,
  Alert,
  CircularProgress,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Pagination,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  Edit as EditIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
} from '@mui/icons-material';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  doc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PurchaseRequest } from '../types';
import PurchaseRequestDetail from '../components/PurchaseRequestDetail';
import MultiPartRequestDetail from '../components/MultiPartRequestDetail';
import BulkProcessDialog from '../components/BulkProcessDialog';

// 요청 번호 생성 함수 (날짜별로 순서 부여)
const generateRequestNumber = (requests: PurchaseRequest[], currentRequest: PurchaseRequest): string => {
  const requestDate = currentRequest.requestDate;
  const year = requestDate.getFullYear();
  const month = String(requestDate.getMonth() + 1).padStart(2, '0');
  const day = String(requestDate.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // 같은 날짜의 요청들을 찾아서 순서 결정
  const sameDate = requests
    .filter(req => {
      const reqDate = req.requestDate;
      return reqDate.getFullYear() === year && 
             reqDate.getMonth() === requestDate.getMonth() && 
             reqDate.getDate() === requestDate.getDate();
    })
    .sort((a, b) => a.requestDate.getTime() - b.requestDate.getTime());
  
  const index = sameDate.findIndex(req => req.id === currentRequest.id) + 1;
  return `${dateString}-${index}`;
};

// 다음 액션 정의
const getNextAction = (status: string) => {
  switch (status) {
    case 'operations_submitted':
      return { label: 'E-COUNT 등록', action: 'ecount_register' };
    case 'ecount_registered':
      return { label: '발주 완료', action: 'po_complete' };
    case 'po_completed':
      return { label: '입고 완료', action: 'warehouse_receive' };
    case 'warehouse_received':
      return { label: '출고 처리', action: 'dispatch' };
    case 'partial_dispatched':
      return { label: '추가 출고', action: 'dispatch' };
    case 'branch_dispatched':
      return { label: '입고 확인', action: 'confirm_receipt' };
    default:
      return null;
  }
};

const PurchaseRequests: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  // 확장된 행 상태
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 정렬 상태
  const [sortField, setSortField] = useState<'requestDate' | 'partName' | 'status' | 'team' | 'quantity'>('requestDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 상세 보기 Dialog 상태
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  
  // 편집 모드 상태
  const [editMode, setEditMode] = useState(false);
  const [editSection, setEditSection] = useState('');

  // 세트 상세 보기 상태
  const [multiPartDetailOpen, setMultiPartDetailOpen] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [selectedSetName, setSelectedSetName] = useState<string | null>(null);

  // 빠른 입력 Dialog 상태
  const [quickInputOpen, setQuickInputOpen] = useState(false);
  const [quickInputRequest, setQuickInputRequest] = useState<PurchaseRequest | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [actualReceiptDate, setActualReceiptDate] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');
  const [branchDispatchQuantities, setBranchDispatchQuantities] = useState<any[]>([]);
  const [quickInputLoading, setQuickInputLoading] = useState(false);

  // 🆕 체크박스 선택 및 일괄 처리 상태
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());
  const [bulkProcessOpen, setBulkProcessOpen] = useState(false);

  // 안전한 날짜 변환 함수
  const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    
    // Firebase Timestamp 객체 처리
    if (typeof timestamp.toDate === 'function') {
      try {
        return timestamp.toDate();
      } catch (error) {
        console.warn('Firebase Timestamp 변환 실패:', timestamp, error);
        return new Date();
      }
    }
    
    // 문자열 처리
    if (typeof timestamp === 'string') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    // 숫자 처리 (Unix timestamp)
    if (typeof timestamp === 'number') {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    // 객체 형태의 Timestamp 처리 (seconds, nanoseconds)
    if (typeof timestamp === 'object' && timestamp.seconds !== undefined) {
      try {
        return new Date(timestamp.seconds * 1000);
      } catch (error) {
        console.warn('객체 형태 Timestamp 변환 실패:', timestamp, error);
        return new Date();
      }
    }
    
    // 그 외의 경우는 로그 없이 현재 날짜 반환
    return new Date();
  };

  // 구매 요청 목록 가져오기
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('PurchaseRequests - 사용자 프로필:', userProfile);

      let baseQuery = collection(db, 'purchaseRequests');
      let constraints: any[] = [];

      // 역할 기반 필터링
      if (userProfile?.role === 'operations') {
        // 운영부서: 자신이 생성한 요청만 조회
        constraints.push(where('requestorUid', '==', userProfile.id));
        console.log('PurchaseRequests - 운영부서 필터링:', userProfile.id);
      } else if (userProfile?.role === 'logistics') {
        // 물류부서: 물류팀이 담당하는 요청들 + 출고 완료된 요청들도 조회
        // (물류팀은 자신이 처리한 모든 건들을 추적 관리해야 함)
        constraints.push(
          where('currentResponsibleTeam', 'in', ['logistics', 'operations', 'completed'])
        );
        console.log('PurchaseRequests - 물류부서 필터링 (진행중 + 완료건 포함)');
      } else {
        // 관리자: 날짜순 정렬만 적용
        constraints.push(orderBy('requestDate', 'desc'));
      }

      const requestsQuery = query(baseQuery, ...constraints);
      const querySnapshot = await getDocs(requestsQuery);
      
      console.log('PurchaseRequests - 쿼리 결과 수:', querySnapshot.docs.length);
      
      const requestsData: PurchaseRequest[] = querySnapshot.docs
        .map(doc => {
          try {
            const data = doc.data();
            
            // 안전한 배열 변환
            const safeArray = (value: any): any[] => {
              if (Array.isArray(value)) return value;
              if (!value) return [];
              console.warn('배열이 아닌 값:', value);
              return [];
            };
            
            return {
              id: doc.id,
              ...data,
              requestDate: safeToDate(data.requestDate),
              createdAt: safeToDate(data.createdAt),
              updatedAt: safeToDate(data.updatedAt),
              
              // 가격 정보 처리 개선 - undefined는 그대로 유지
              price: data.price !== undefined ? data.price : undefined,
              currency: data.currency || 'KRW',
              
              // Phase 2: 새로운 Timestamp 필드들 변환
              ecountRegisteredAt: data.ecountRegisteredAt ? safeToDate(data.ecountRegisteredAt) : undefined,
              poCompletedAt: data.poCompletedAt ? safeToDate(data.poCompletedAt) : undefined,
              expectedDeliveryDate: data.expectedDeliveryDate ? safeToDate(data.expectedDeliveryDate) : undefined,
              warehouseReceiptAt: data.warehouseReceiptAt ? safeToDate(data.warehouseReceiptAt) : undefined,
              branchDispatchCompletedAt: data.branchDispatchCompletedAt ? safeToDate(data.branchDispatchCompletedAt) : undefined,
              branchReceiptConfirmedAt: data.branchReceiptConfirmedAt ? safeToDate(data.branchReceiptConfirmedAt) : undefined,
              
              // 안전한 배열 필드들 처리
              statusHistory: safeArray(data.statusHistory).map((history: any) => ({
                ...history,
                updatedAt: safeToDate(history.updatedAt),
              })),
              branchRequirements: safeArray(data.branchRequirements),
              branchDispatchQuantities: safeArray(data.branchDispatchQuantities),
              attachments: safeArray(data.attachments),
            } as PurchaseRequest;
          } catch (docError) {
            console.error('문서 처리 중 에러:', doc.id, docError);
            return null;
          }
        })
        .filter(request => request !== null) as PurchaseRequest[];
      
      console.log('PurchaseRequests - 변환된 데이터:', requestsData);
      
      setRequests(requestsData);
    } catch (error) {
      console.error('구매 요청 목록을 가져오는데 실패했습니다:', error);
      setError('구매 요청 목록을 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 필터링된 요청 목록
  const filteredRequests = requests.filter(request => {
    try {
      const matchesSearch = 
        (request.requestedPartName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.requestId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.requestorName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || request.currentStatus === filterStatus;

      return matchesSearch && matchesStatus;
    } catch (filterError) {
      console.error('필터링 중 에러:', request.id, filterError);
      return false;
    }
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'requestDate':
        comparison = a.requestDate.getTime() - b.requestDate.getTime();
        break;
      case 'partName':
        comparison = (a.requestedPartName || '').localeCompare(b.requestedPartName || '');
        break;
      case 'status':
        comparison = (a.currentStatus || '').localeCompare(b.currentStatus || '');
        break;
      case 'team':
        comparison = (a.currentResponsibleTeam || '').localeCompare(b.currentResponsibleTeam || '');
        break;
      case 'quantity':
        comparison = (a.totalRequestedQuantity || 0) - (b.totalRequestedQuantity || 0);
        break;
      default:
        comparison = a.requestDate.getTime() - b.requestDate.getTime();
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // 페이지네이션 적용
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * requestsPerPage,
    currentPage * requestsPerPage
  );

  // 상세 보기 열기
  const handleViewDetail = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setEditMode(false);
    setEditSection('');
    setDetailOpen(true);
  };

  // 상세 보기 닫기
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
    setEditMode(false);
    setEditSection('');
  };

  // 상세 보기에서 업데이트 후 목록 새로고침
  const handleDetailUpdate = () => {
    fetchRequests();
  };

  // 세트 상세 보기 열기
  const handleViewSetDetail = (setId: string, setName: string) => {
    setSelectedSetId(setId);
    setSelectedSetName(setName);
    setMultiPartDetailOpen(true);
  };

  // 세트 상세 보기 닫기
  const handleCloseSetDetail = () => {
    setMultiPartDetailOpen(false);
    setSelectedSetId(null);
    setSelectedSetName(null);
  };

  // 정렬 함수
  const handleSort = (field: 'requestDate' | 'partName' | 'status' | 'team' | 'quantity') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // 상태 라벨 매핑
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operations_submitted': return '운영부 요청 완료';
      case 'po_completed': return '구매처 발주 완료';
      case 'warehouse_received': return '물류창고 입고 완료';
      case 'partial_dispatched': return '부분 출고 완료';
      case 'branch_dispatched': return '전체 지점 출고 완료';
      case 'branch_received_confirmed': return '지점 입고 확인 (완료)';
      case 'logistics_issue_reported': return '물류 이슈 보고';
      case 'alternative_sourcing': return '대체 조달 진행 중';
      case 'process_terminated': return '프로세스 종료';
      default: return status;
    }
  };

  // 상태 색상 매핑
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operations_submitted': return 'info';
      case 'po_completed': return 'secondary';
      case 'warehouse_received': return 'warning';
      case 'partial_dispatched': return 'warning';
      case 'branch_dispatched': return 'default';
      case 'branch_received_confirmed': return 'success';
      case 'logistics_issue_reported': return 'error';
      case 'alternative_sourcing': return 'warning';
      case 'process_terminated': return 'default';
      default: return 'default';
    }
  };

  // 행 확장/축소 토글 (운영부 요청 완료, 구매처 발주 완료, 물류창고 입고 완료, 부분출고완료 건은 빠른 입력 Dialog 열기)
  const toggleRowExpansion = (request: PurchaseRequest) => {
    if (request.currentStatus === 'operations_submitted' || 
        request.currentStatus === 'po_completed' || 
        request.currentStatus === 'warehouse_received' ||
        request.currentStatus === 'partial_dispatched') {
      // 빠른 입력 Dialog 열기
      handleQuickInput(request);
    } else {
      // 다른 상태는 기존 확장/축소 기능
      const newExpandedRows = new Set(expandedRows);
      if (newExpandedRows.has(request.id)) {
        newExpandedRows.delete(request.id);
      } else {
        newExpandedRows.add(request.id);
      }
      setExpandedRows(newExpandedRows);
    }
  };

  // 빠른 입력 Dialog 열기
  const handleQuickInput = (request: PurchaseRequest) => {
    setQuickInputRequest(request);
    
    if (request.currentStatus === 'operations_submitted') {
      // 운영부 요청 완료: 입고 예정 정보 입력
      setExpectedDeliveryDate('');
      setExpectedQuantity(request.totalRequestedQuantity?.toString() || '');
      setActualReceiptDate('');
      setActualQuantity('');
      setBranchDispatchQuantities([]);
    } else if (request.currentStatus === 'po_completed') {
      // 구매처 발주 완료: 실제 입고 정보 입력
      setExpectedDeliveryDate('');
      setExpectedQuantity('');
      setActualReceiptDate(new Date().toISOString().split('T')[0]); // 오늘 날짜로 기본 설정
      setActualQuantity(request.expectedDeliveryQuantity?.toString() || request.totalRequestedQuantity?.toString() || '');
      setBranchDispatchQuantities([]);
    } else if (request.currentStatus === 'warehouse_received' || request.currentStatus === 'partial_dispatched') {
      // 물류창고 입고 완료 또는 부분출고완료: 지점별 출고 수량 입력
      setExpectedDeliveryDate('');
      setExpectedQuantity('');
      setActualReceiptDate('');
      setActualQuantity('');
      
      // 지점별 출고 수량 초기화
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
    }
    
    setQuickInputOpen(true);
  };

  // 빠른 입력 Dialog 닫기
  const handleQuickInputClose = () => {
    setQuickInputOpen(false);
    setQuickInputRequest(null);
    setExpectedDeliveryDate('');
    setExpectedQuantity('');
    setActualReceiptDate('');
    setActualQuantity('');
    setBranchDispatchQuantities([]);
  };

  // 빠른 입력 저장
  const handleQuickInputSave = async () => {
    if (!quickInputRequest) {
      setError('요청 정보가 없습니다.');
      return;
    }

    // 상태별 유효성 검사
    if (quickInputRequest.currentStatus === 'operations_submitted') {
      if (!expectedDeliveryDate || !expectedQuantity) {
        setError('입고예정일과 예정수량을 모두 입력해주세요.');
        return;
      }
    } else if (quickInputRequest.currentStatus === 'po_completed') {
      if (!actualReceiptDate || !actualQuantity) {
        setError('실제입고일과 실제입고수량을 모두 입력해주세요.');
        return;
      }
    } else if (quickInputRequest.currentStatus === 'warehouse_received' || quickInputRequest.currentStatus === 'partial_dispatched') {
      const dispatchedBranches = branchDispatchQuantities.filter(item => item.isDispatched);
      const totalDispatchedQuantity = dispatchedBranches.reduce((sum, item) => sum + item.dispatchedQuantity, 0);
      const availableQuantity = quickInputRequest.actualReceivedQuantity || 0;
      
      if (dispatchedBranches.length === 0) {
        setError('최소 1개 지점은 출고 완료 처리해야 합니다.');
        return;
      }
      
      if (totalDispatchedQuantity > availableQuantity) {
        setError(`창고 보유 수량(${availableQuantity}개)을 초과하여 출고할 수 없습니다. (현재 출고 계획: ${totalDispatchedQuantity}개)`);
        return;
      }
    }

    try {
      setQuickInputLoading(true);
      
      const requestRef = doc(db, 'purchaseRequests', quickInputRequest.id);
      
      if (quickInputRequest.currentStatus === 'operations_submitted') {
        // 운영부 요청 완료 → 구매처 발주 완료
        const newHistoryEntry = {
          status: 'po_completed',
          updatedAt: Timestamp.now(),
          updatedByUid: userProfile?.id || '',
          updatedByName: userProfile?.name || '',
          comments: '빠른 입력으로 구매처 발주 완료',
        };

        await updateDoc(requestRef, {
          // 이카운트 등록 정보 (기존 운영부 입력 값 유지)
          ecountRegisteredAt: Timestamp.now(),
          ecountRegistrarUid: userProfile?.id || '',
          
          // 구매처 발주 정보
          poCompletedAt: Timestamp.now(),
          poCompleterUid: userProfile?.id || '',
          expectedDeliveryDate: Timestamp.fromDate(new Date(expectedDeliveryDate)),
          expectedDeliveryQuantity: parseInt(expectedQuantity),
          
          // 상태 업데이트 - 이카운트 등록을 건너뛰고 바로 구매처 발주 완료로
          currentStatus: 'po_completed',
          currentResponsibleTeam: 'logistics',
          statusHistory: arrayUnion(newHistoryEntry),
          updatedAt: Timestamp.now(),
        });

        console.log('빠른 입력 저장 완료 (구매처 발주):', quickInputRequest.id);
        
      } else if (quickInputRequest.currentStatus === 'po_completed') {
        // 구매처 발주 완료 → 물류창고 입고 완료
        const newHistoryEntry = {
          status: 'warehouse_received',
          updatedAt: Timestamp.now(),
          updatedByUid: userProfile?.id || '',
          updatedByName: userProfile?.name || '',
          comments: '빠른 입력으로 물류창고 입고 완료',
        };

        await updateDoc(requestRef, {
          currentStatus: 'warehouse_received',
          currentResponsibleTeam: 'logistics',
          warehouseReceiptAt: Timestamp.fromDate(new Date(actualReceiptDate)),
          warehouseReceiptUid: userProfile?.id || '',
          actualReceivedQuantity: parseInt(actualQuantity),
          statusHistory: arrayUnion(newHistoryEntry),
          updatedAt: Timestamp.now(),
        });

        console.log('빠른 입력 저장 완료 (물류창고 입고):', quickInputRequest.id);
        
      } else if (quickInputRequest.currentStatus === 'warehouse_received' || quickInputRequest.currentStatus === 'partial_dispatched') {
        // 물류창고 입고 완료 또는 부분출고완료 → 지점 출고 완료 (부분 또는 전체)
        const dispatchedBranches = branchDispatchQuantities.filter(item => item.isDispatched);
        const allDispatched = dispatchedBranches.length === branchDispatchQuantities.length;
        const totalDispatchedQuantity = dispatchedBranches.reduce((sum, item) => sum + item.dispatchedQuantity, 0);
        
        const newStatus = allDispatched ? 'branch_dispatched' : 'partial_dispatched';
        const newHistoryEntry = {
          status: newStatus,
          updatedAt: Timestamp.now(),
          updatedByUid: userProfile?.id || '',
          updatedByName: userProfile?.name || '',
          comments: `빠른 입력으로 ${allDispatched ? '전체' : '부분'} 지점 출고 완료 (${dispatchedBranches.length}개 지점, 총 ${totalDispatchedQuantity}개)`,
        };

        // undefined 값 제거하는 도우미 함수
        const removeUndefinedValues = (obj: any): any => {
          const cleaned: any = {};
          Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
              cleaned[key] = obj[key];
            }
          });
          return cleaned;
        };

        const updateData = removeUndefinedValues({
          currentStatus: newStatus,
          currentResponsibleTeam: allDispatched ? 'operations' : 'logistics',
          branchDispatchCompletedAt: allDispatched ? Timestamp.now() : undefined,
          branchDispatchCompleterUid: userProfile?.id || '',
          branchDispatchQuantities: branchDispatchQuantities.map(branch => removeUndefinedValues(branch)),
          statusHistory: arrayUnion(newHistoryEntry),
          updatedAt: Timestamp.now(),
        });

        await updateDoc(requestRef, updateData);

        console.log(`빠른 입력 저장 완료 (${allDispatched ? '전체' : '부분'} 지점 출고):`, quickInputRequest.id);
      }
      
      // 목록 새로고침
      await fetchRequests();
      
      // Dialog 닫기
      handleQuickInputClose();
      
      // 성공 메시지 (선택사항)
      setError('');
      
    } catch (error) {
      console.error('빠른 입력 저장 실패:', error);
      setError('빠른 입력 저장에 실패했습니다.');
    } finally {
      setQuickInputLoading(false);
    }
  };

  // 🆕 체크박스 선택 핸들러들
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredRequests.map(req => req.id));
      setSelectedRequestIds(allIds);
    } else {
      setSelectedRequestIds(new Set());
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    const newSelected = new Set(selectedRequestIds);
    if (checked) {
      newSelected.add(requestId);
    } else {
      newSelected.delete(requestId);
    }
    setSelectedRequestIds(newSelected);
  };

  const isAllSelected = filteredRequests.length > 0 && selectedRequestIds.size === filteredRequests.length;
  const isIndeterminate = selectedRequestIds.size > 0 && selectedRequestIds.size < filteredRequests.length;

  // 🆕 일괄 처리 가능 여부 확인
  const canBulkProcess = () => {
    if (selectedRequestIds.size === 0) return false;
    
    const selectedRequests = filteredRequests.filter(req => selectedRequestIds.has(req.id));
    if (selectedRequests.length === 0) return false;
    
    // 선택된 모든 요청이 같은 상태여야 함
    const firstStatus = selectedRequests[0].currentStatus;
    return selectedRequests.every(req => req.currentStatus === firstStatus);
  };

  // 🆕 일괄 처리 시작
  const handleBulkProcess = () => {
    if (!canBulkProcess()) {
      setError('선택된 항목들이 모두 같은 상태여야 일괄 처리가 가능합니다.');
      return;
    }
    setBulkProcessOpen(true);
  };

  // 🆕 일괄 처리 닫기
  const handleBulkProcessClose = () => {
    setBulkProcessOpen(false);
    setSelectedRequestIds(new Set());
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          구매 요청 목록
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {userProfile?.role === 'operations' && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/multi-part-request')}
              sx={{ backgroundColor: 'primary.main' }}
            >
              다중 부품 등록
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchRequests}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 검색 및 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              placeholder="요청 ID, 부품명, 요청자로 검색..."
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
              <InputLabel>진행 상태</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="진행 상태"
              >
                <MenuItem value="all">전체</MenuItem>
                <MenuItem value="operations_submitted">운영부 요청 완료</MenuItem>
                <MenuItem value="po_completed">구매처 발주 완료</MenuItem>
                <MenuItem value="warehouse_received">물류창고 입고 완료</MenuItem>
                <MenuItem value="partial_dispatched">부분 출고 완료</MenuItem>
                <MenuItem value="branch_dispatched">전체 지점 출고 완료</MenuItem>
                <MenuItem value="branch_received_confirmed">지점 입고 확인 (완료)</MenuItem>
              </Select>
            </FormControl>
            
            {/* 🆕 일괄 처리 버튼 */}
            {selectedRequestIds.size > 0 && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PlaylistAddCheckIcon />}
                onClick={handleBulkProcess}
                disabled={!canBulkProcess()}
                sx={{ ml: 'auto' }}
              >
                선택 항목 일괄 처리 ({selectedRequestIds.size}건)
              </Button>
            )}
          </Box>
          
          {/* 🆕 선택 상태 표시 */}
          {selectedRequestIds.size > 0 && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
              <Typography variant="body2" color="info.main">
                📋 {selectedRequestIds.size}개 항목이 선택되었습니다. 
                {canBulkProcess() ? ' 일괄 처리가 가능합니다.' : ' 같은 상태의 항목만 일괄 처리할 수 있습니다.'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 구매 요청 목록 테이블 */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {userProfile?.role === 'operations' && '내 구매 요청 '}
            {userProfile?.role === 'logistics' && '처리 대상 구매 요청 '}
            {userProfile?.role === 'admin' && '전체 구매 요청 '}
            ({filteredRequests.length}건)
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      {/* 🆕 전체 선택 체크박스 */}
                      <TableCell sx={{ width: 50 }}>
                        <Checkbox
                          checked={isAllSelected}
                          indeterminate={isIndeterminate}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ width: 50 }}></TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          width: 120,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('requestDate')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          요청 NO
                          {sortField === 'requestDate' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownwardIcon fontSize="small" /> : 
                              <ArrowUpwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          minWidth: 200,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('partName')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          부품명 (부품번호)
                          {sortField === 'partName' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownwardIcon fontSize="small" /> : 
                              <ArrowUpwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          width: 100,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('quantity')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          총 수량
                          {sortField === 'quantity' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownwardIcon fontSize="small" /> : 
                              <ArrowUpwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          width: 150,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('status')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          진행 상태
                          {sortField === 'status' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownwardIcon fontSize="small" /> : 
                              <ArrowUpwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          fontWeight: 'bold', 
                          width: 100,
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                          userSelect: 'none'
                        }}
                        onClick={() => handleSort('team')}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          담당부서
                          {sortField === 'team' && (
                            sortOrder === 'desc' ? 
                              <ArrowDownwardIcon fontSize="small" /> : 
                              <ArrowUpwardIcon fontSize="small" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          {searchTerm || filterStatus !== 'all' 
                            ? '검색 결과가 없습니다.' 
                            : '등록된 구매 요청이 없습니다.'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRequests.map((request, index) => {
                        const requestNumber = generateRequestNumber(filteredRequests, request);
                        const isExpanded = expandedRows.has(request.id);
                        const nextAction = getNextAction(request.currentStatus);
                        const isSelected = selectedRequestIds.has(request.id);
                        
                        return (
                          <React.Fragment key={request.id}>
                            {/* 메인 행 */}
                            <TableRow 
                              hover
                              sx={{
                                cursor: 'pointer',
                                backgroundColor: 
                                  request.currentStatus === 'branch_dispatched' ? 'success.50' :
                                  request.currentStatus === 'branch_received_confirmed' ? 'success.100' :
                                  request.currentStatus === 'partial_dispatched' ? 'warning.50' :
                                  request.currentStatus === 'operations_submitted' ? 'info.50' :
                                  'inherit',
                                opacity: 
                                  request.currentStatus === 'branch_received_confirmed' ? 0.8 :
                                  1,
                              }}
                              onClick={() => toggleRowExpansion(request)}
                            >
                              {/* 🆕 개별 선택 체크박스 */}
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                                  size="small"
                                />
                              </TableCell>
                              
                              {/* 확장 아이콘 */}
                              <TableCell>
                                <IconButton size="small">
                                  {(request.currentStatus === 'operations_submitted' || 
                                    request.currentStatus === 'po_completed' || 
                                    request.currentStatus === 'warehouse_received' ||
                                    request.currentStatus === 'partial_dispatched') ? 
                                    <EditIcon /> : 
                                    (isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />)
                                  }
                                </IconButton>
                              </TableCell>
                              
                              {/* 요청 NO */}
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {requestNumber}
                                </Typography>
                                {request.isPartOfSet && (
                                  <Typography 
                                    variant="caption" 
                                    color="primary" 
                                    sx={{ display: 'block' }}
                                  >
                                    📦 세트
                                  </Typography>
                                )}
                              </TableCell>
                              
                              {/* 부품명 (부품번호) */}
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {request.requestedPartName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  ({request.requestedPartNumber})
                                </Typography>
                              </TableCell>
                              
                              {/* 총 수량 */}
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {request.totalRequestedQuantity?.toLocaleString() || 0}개
                                </Typography>
                              </TableCell>
                              
                              {/* 진행 상태 */}
                              <TableCell>
                                <Chip
                                  label={getStatusLabel(request.currentStatus)}
                                  color={getStatusColor(request.currentStatus) as any}
                                  size="small"
                                />
                              </TableCell>
                              
                              {/* 담당부서 */}
                              <TableCell>
                                <Chip
                                  label={
                                    request.currentResponsibleTeam === 'operations' ? '운영' :
                                    request.currentResponsibleTeam === 'logistics' ? '물류' : 
                                    request.currentResponsibleTeam === 'completed' ? '완료' : '운영'
                                  }
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                            
                            {/* 확장된 상세 정보 행 (빠른 입력 대상 상태 제외) */}
                            {request.currentStatus !== 'operations_submitted' && 
                             request.currentStatus !== 'po_completed' && 
                             request.currentStatus !== 'warehouse_received' && 
                             request.currentStatus !== 'partial_dispatched' &&
                             request.currentStatus !== 'branch_dispatched' &&
                             request.currentStatus !== 'process_terminated' &&
                             request.currentStatus !== 'branch_received_confirmed' && (
                              <TableRow>
                                <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                    <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
                                      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                        {/* 기본 정보 */}
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">요청일</Typography>
                                          <Typography variant="body2">{request.requestDate.toLocaleDateString('ko-KR')}</Typography>
                                        </Box>
                                        
                                        <Box>
                                          <Typography variant="caption" color="text.secondary">요청자</Typography>
                                          <Typography variant="body2">{request.requestorName}</Typography>
                                        </Box>
                                        
                                        {/* 세트 정보 */}
                                        {request.isPartOfSet && (
                                          <Box>
                                            <Typography variant="caption" color="text.secondary">세트명</Typography>
                                            <Typography 
                                              variant="body2" 
                                              color="primary" 
                                              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                              onClick={() => handleViewSetDetail(request.setId!, request.setName!)}
                                            >
                                              📦 {request.setName}
                                            </Typography>
                                          </Box>
                                        )}
                                        
                                        {/* 빠른 액션 버튼 */}
                                        {nextAction && (
                                          <Box sx={{ ml: 'auto' }}>
                                            <Button
                                              variant="contained"
                                              size="small"
                                              startIcon={<PlayArrowIcon />}
                                              onClick={() => handleViewDetail(request)}
                                              color="primary"
                                            >
                                              {nextAction.label}
                                            </Button>
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 페이지네이션 */}
              {filteredRequests.length > requestsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination
                    count={Math.ceil(filteredRequests.length / requestsPerPage)}
                    page={currentPage}
                    onChange={(event, value) => setCurrentPage(value)}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 도움말 정보 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💡 사용 안내
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {userProfile?.role === 'operations' && (
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                귀하가 생성한 구매 요청들만 표시됩니다.
              </Typography>
            )}
            {userProfile?.role === 'logistics' && (
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                물류팀에서 처리해야 할 구매 요청들과 완료된 출고 건들이 표시됩니다. (초록색: 완료, 주황색: 부분출고, 파란색: 운영부 요청 완료)
              </Typography>
            )}
            {userProfile?.role === 'admin' && (
              <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                시스템의 모든 구매 요청을 확인할 수 있습니다.
              </Typography>
            )}
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>테이블 헤더를 클릭</strong>하면 해당 필드로 정렬할 수 있습니다. (요청 NO, 부품명, 총 수량, 진행 상태, 담당부서)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>운영부 요청 완료 건을 클릭</strong>하면 입고예정일과 예정수량을 빠르게 입력할 수 있습니다. (✏️ 아이콘)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>구매처 발주 완료 건을 클릭</strong>하면 실제입고일과 실제입고수량을 빠르게 입력할 수 있습니다. (✏️ 아이콘)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>물류창고 입고 완료 및 부분출고완료 건을 클릭</strong>하면 지점별 출고수량을 빠르게 입력할 수 있습니다. (✏️ 아이콘)
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              <strong>전체 지점 출고 완료 이후 상태의 행을 클릭</strong>하면 상세 정보가 확장되고, 빠른 액션 버튼으로 다음 단계를 처리할 수 있습니다.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              [👁️] 버튼을 클릭하면 요청의 상세 정보를 확인할 수 있습니다.
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              검색 기능과 필터를 사용하여 원하는 요청을 빠르게 찾을 수 있습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 빠른 입력 Dialog */}
      <Dialog open={quickInputOpen} onClose={handleQuickInputClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {quickInputRequest?.currentStatus === 'operations_submitted' ? '📦 입고 예정 정보 입력' : 
           quickInputRequest?.currentStatus === 'po_completed' ? '📦 실제 입고 정보 입력' : 
           '🚚 지점 출고 정보 입력'}
        </DialogTitle>
        <DialogContent>
          {quickInputRequest && (
            <>
              {/* 부품 정보 요약 - 2줄로 압축 */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  📋 {quickInputRequest.requestedPartNumber} | {quickInputRequest.requestedPartName} | 
                  {quickInputRequest.price && quickInputRequest.price > 0 ? ` ${quickInputRequest.price.toLocaleString()}원` : ' 가격 미입력'} | 
                  품목그룹: {quickInputRequest.itemGroup1 || '미입력'} {' > '} {quickInputRequest.itemGroup2 || '미입력'} {' > '} {quickInputRequest.itemGroup3 || '미입력'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  📊 총 요청: {quickInputRequest.totalRequestedQuantity?.toLocaleString() || 0}개 | 
                  지점 요청: {quickInputRequest.branchRequirements?.reduce((sum, req) => sum + Number(req.requestedQuantity), 0).toLocaleString() || 0}개 | 
                  물류 적정재고: {quickInputRequest.logisticsStockQuantity?.toLocaleString() || 0}개
                  {quickInputRequest.currentStatus === 'po_completed' && quickInputRequest.expectedDeliveryQuantity && (
                    ` | 예정 입고: ${quickInputRequest.expectedDeliveryQuantity.toLocaleString()}개`
                  )}
                  {quickInputRequest.currentStatus === 'warehouse_received' && quickInputRequest.actualReceivedQuantity && (
                    ` | 창고 보유: ${quickInputRequest.actualReceivedQuantity.toLocaleString()}개`
                  )}
                </Typography>
              </Box>

              {/* 입력 필드 - 상태에 따라 다르게 표시 */}
              {quickInputRequest.currentStatus === 'operations_submitted' ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="입고 예정일"
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="예정 수량"
                    type="number"
                    value={expectedQuantity}
                    onChange={(e) => setExpectedQuantity(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">개</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                    required
                  />
                </Box>
              ) : quickInputRequest.currentStatus === 'po_completed' ? (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="실제 입고일"
                    type="date"
                    value={actualReceiptDate}
                    onChange={(e) => setActualReceiptDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="실제 입고 수량"
                    type="number"
                    value={actualQuantity}
                    onChange={(e) => setActualQuantity(e.target.value)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">개</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                    required
                  />
                </Box>
              ) : (
                <Box>
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
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
                      📊 재고 현황
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">창고 입고 수량</Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {quickInputRequest.actualReceivedQuantity?.toLocaleString() || 0}개
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
                          {((quickInputRequest.actualReceivedQuantity || 0) - branchDispatchQuantities.filter(item => item.isDispatched).reduce((sum, item) => sum + item.dispatchedQuantity, 0)).toLocaleString()}개
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
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleQuickInputClose} disabled={quickInputLoading}>
            취소
          </Button>
          <Button 
            onClick={handleQuickInputSave} 
            variant="contained" 
            disabled={
              quickInputLoading || 
              (quickInputRequest?.currentStatus === 'operations_submitted' && (!expectedDeliveryDate || !expectedQuantity)) ||
              (quickInputRequest?.currentStatus === 'po_completed' && (!actualReceiptDate || !actualQuantity)) ||
              ((quickInputRequest?.currentStatus === 'warehouse_received' || quickInputRequest?.currentStatus === 'partial_dispatched') && branchDispatchQuantities.filter(item => item.isDispatched).length === 0)
            }
          >
            {quickInputLoading ? <CircularProgress size={20} /> : '저장하고 다음 단계로'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 상세 보기 Dialog */}
      <PurchaseRequestDetail
        open={detailOpen}
        onClose={handleCloseDetail}
        request={selectedRequest}
        onUpdate={handleDetailUpdate}
        editMode={editMode}
        editSection={editSection}
      />

      {/* 세트 상세 보기 Dialog */}
      <MultiPartRequestDetail
        open={multiPartDetailOpen}
        onClose={handleCloseSetDetail}
        setId={selectedSetId}
        setName={selectedSetName}
      />

      {/* 🆕 일괄 처리 다이얼로그 */}
      <BulkProcessDialog
        open={bulkProcessOpen}
        onClose={handleBulkProcessClose}
        requests={filteredRequests.filter(req => selectedRequestIds.has(req.id))}
        onUpdate={handleDetailUpdate}
      />
    </Box>
  );
};

export default PurchaseRequests; 