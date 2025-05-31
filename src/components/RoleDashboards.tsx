import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Divider,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  PlayArrow as PlayArrowIcon,
  LocalShipping as LocalShippingIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon,
  Business as BusinessIcon,
  Warehouse as WarehouseIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { PurchaseRequest } from '../types';
import { safeToDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

// 전체 프로세스 현황을 보여주는 공통 컴포넌트
interface ProcessOverviewProps {
  operationsWaiting?: number;
  poCompleted?: number;
  warehouseReceived?: number;
  branchDispatched?: number;
  completed?: number;
  userRole?: string;
}

export const ProcessOverview: React.FC<ProcessOverviewProps> = ({
  operationsWaiting = 0,
  poCompleted = 0,
  warehouseReceived = 0,
  branchDispatched = 0,
  completed = 0,
  userRole
}) => {
  const navigate = useNavigate();

  const steps = [
    {
      label: '운영부 요청 완료',
      description: '신규 부품 요청 작성 완료',
      count: operationsWaiting,
      status: 'operations_submitted',
      icon: <AssignmentIcon />,
      color: 'warning',
      action: () => navigate('/purchase-requests?status=operations_submitted')
    },
    {
      label: '구매처 발주 완료',
      description: '이카운트 등록 및 발주 처리',
      count: poCompleted,
      status: 'po_completed',
      icon: <BusinessIcon />,
      color: 'info',
      action: () => navigate('/purchase-requests?status=po_completed')
    },
    {
      label: '물류창고 입고',
      description: '구매처에서 물류창고 입고 완료',
      count: warehouseReceived,
      status: 'warehouse_received',
      icon: <WarehouseIcon />,
      color: 'secondary',
      action: () => navigate('/purchase-requests?status=warehouse_received')
    },
    {
      label: '지점 출고 완료',
      description: '각 지점으로 출고 처리 완료',
      count: branchDispatched,
      status: 'branch_dispatched',
      icon: <StoreIcon />,
      color: 'primary',
      action: () => navigate('/purchase-requests?status=branch_dispatched')
    },
    {
      label: '최종 완료',
      description: '지점 입고 확인 및 업무 완료',
      count: completed,
      status: 'branch_received_confirmed',
      icon: <CheckCircleIcon />,
      color: 'success',
      action: () => navigate('/purchase-requests?status=branch_received_confirmed')
    }
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 2, mb: 1 }}>
      <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold', color: 'primary.main' }}>
        🔄 전체 프로세스 현황
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
        {steps.map((step, index) => (
          <Box key={step.status} sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            {/* 단계 카드 */}
            <Box 
              sx={{ 
                minWidth: 200, 
                p: 2, 
                bgcolor: `${step.color}.50`, 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: `${step.color}.200`,
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }
              }}
              onClick={step.action}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ color: `${step.color}.main` }}>
                  {step.icon}
                </Box>
                <Typography variant="subtitle2" fontWeight="bold" noWrap>
                  {step.label}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold" color={`${step.color}.main`}>
                  {step.count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  건
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                {step.description}
              </Typography>
              
              {/* 역할별 액션 버튼 */}
              {((userRole === 'operations' && (step.status === 'operations_submitted' || step.status === 'branch_dispatched')) ||
                (userRole === 'logistics' && ['operations_submitted', 'po_completed', 'warehouse_received'].includes(step.status)) ||
                userRole === 'admin') && (
                <Button
                  size="small"
                  variant="contained"
                  color={step.color as any}
                  sx={{ mt: 1, fontSize: '0.75rem', py: 0.5 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    step.action();
                  }}
                >
                  {step.status === 'operations_submitted' && userRole === 'logistics' ? '처리하기' :
                   step.status === 'po_completed' && userRole === 'logistics' ? '확인하기' :
                   step.status === 'warehouse_received' && userRole === 'logistics' ? '출고하기' :
                   step.status === 'branch_dispatched' && userRole === 'operations' ? '확인하기' :
                   '보기'}
                </Button>
              )}
            </Box>
            
            {/* 화살표 (마지막 단계 제외) */}
            {index < steps.length - 1 && (
              <Box sx={{ mx: 1, color: 'text.secondary' }}>
                <ArrowForwardIcon />
              </Box>
            )}
          </Box>
        ))}
      </Box>
      
      {/* 프로세스 설명 */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4, textAlign: 'center' }}>
          💡 <strong>전체 프로세스</strong>: 운영부 요청 → 물류팀 발주 → 창고 입고 → 지점 출고 → 운영부 확인 → 완료
        </Typography>
      </Box>
    </Paper>
  );
};

interface OperationsDashboardProps {
  myRequests: number;
  urgentRequests: number;
  recentRequests: PurchaseRequest[];
  loading: boolean;
  userId?: string;
  monthlyRequests?: number;
  avgCompletionTime?: number;
  requestAccuracy?: number;
  awaitingConfirmation?: number;
  inProgress?: number;
  completed?: number;
  operationsWaiting?: number;
  operationsPoCompleted?: number;
  operationsWarehouseReceived?: number;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  myRequests,
  urgentRequests,
  recentRequests,
  loading,
  userId,
  monthlyRequests = 0,
  avgCompletionTime = 0,
  requestAccuracy = 0,
  awaitingConfirmation = 0,
  inProgress = 0,
  completed = 0,
  operationsWaiting = 0,
  operationsPoCompleted = 0,
  operationsWarehouseReceived = 0
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operations_submitted': return 'warning';
      case 'po_completed': return 'primary';
      case 'warehouse_received': return 'secondary';
      case 'branch_dispatched': return 'success';
      case 'branch_received_confirmed': return 'success';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operations_submitted': return '요청 완료';
      case 'po_completed': return '발주 완료';
      case 'warehouse_received': return '입고 완료';
      case 'branch_dispatched': return '출고 완료';
      case 'branch_received_confirmed': return '입고 확인';
      default: return status;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 🚨 지점 입고 확인 필요 알림 (최상단) */}
      {awaitingConfirmation > 0 && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                🚨 지점 입고 확인 필요
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`확인 대기 ${awaitingConfirmation}건`}
                  color="warning"
                  size="medium"
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                  clickable
                  onClick={() => navigate('/purchase-requests?status=branch_dispatched')}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                💡 지점에서 부품을 받았는지 최종 확인이 필요한 요청들입니다. 수량과 상태를 확인해주세요.
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => navigate('/purchase-requests?status=branch_dispatched')}
              sx={{ minWidth: 140, py: 1.5 }}
            >
              확인하러 가기
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'stretch' }}>
        {/* 📋 단계별 요청 현황 */}
        <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold' }}>
              📋 단계별 요청 현황
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              {/* 1. 요청 완료 → 물류팀 처리 대기 */}
              <Box sx={{ p: 2.5, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'warning.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  1
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ScheduleIcon color="warning" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        요청 완료 → 물류팀 처리 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        내가 요청한 부품이 물류팀 처리를 기다리는 중
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {operationsWaiting}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=operations_submitted')}
                      sx={{ minWidth: 80 }}
                    >
                      확인하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 2. 물류 처리 중 (모니터링) */}
              <Box sx={{ p: 2.5, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'info.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  2
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ShippingIcon color="info" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        물류 처리 중 (모니터링)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        발주 → 입고 → 출고 과정을 물류팀에서 처리 중
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {inProgress}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="info"
                      size="medium"
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate('/purchase-requests?filter=in-progress')}
                      sx={{ minWidth: 80 }}
                    >
                      추적하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 3. 지점 입고 확인 필요 */}
              <Box sx={{ p: 2.5, bgcolor: 'secondary.50', borderRadius: 2, border: '1px solid', borderColor: 'secondary.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'secondary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  3
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <CheckCircleIcon color="secondary" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        지점 입고 확인 필요
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        지점 출고 완료 → 운영담당자 최종 확인 필요
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      {awaitingConfirmation}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=branch_dispatched')}
                      sx={{ minWidth: 80 }}
                    >
                      확인하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 4. 완료된 요청 */}
              <Box sx={{ p: 2.5, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  4
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <TrendingUpIcon color="success" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        완료된 요청
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        지점 입고 확인 완료 → 부품 취급 업무 완료
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {completed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="success"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=branch_received_confirmed')}
                      sx={{ minWidth: 80 }}
                    >
                      보기
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* 📊 이달의 성과 */}
        <Box sx={{ flex: '1 1 350px', minWidth: 350 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold' }}>
              📊 이달의 성과
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
                  {monthlyRequests}
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  이달의 요청 건수
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  신규 요청 작성 완료
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ mb: 0.5 }}>
                  {avgCompletionTime}
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  평균 완료 시간 (일)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  요청부터 최종 완료까지
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mb: 0.5 }}>
                  {requestAccuracy}%
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  요청 정확도
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  수량 변경 없이 완료
                </Typography>
              </Box>
            </Box>
            
            {/* 성과 지표 설명 */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4, textAlign: 'center' }}>
                💡 <strong>요청 정확도</strong>는 처음 요청한 수량과 최종 지점 입고 수량이 일치하는 비율입니다.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 🚀 빠른 액션 & 💡 운영팀 업무 가이드 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* 업무 가이드 */}
        <Box sx={{ flex: '1 1 100%', minWidth: 400 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'info.main' }}>
              💡 운영팀 업무 가이드
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📝 효율적인 요청 작성
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  • 부품번호와 명칭 정확히 입력<br/>
                  • 지점별 필요 수량 미리 계획<br/>
                  • 긴급도에 따른 우선순위 설정
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  🔄 업무 프로세스
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  1. 요청 작성 → 2. 물류팀 처리 → 3. 지점 출고 → 4. 입고 확인 → 5. 완료
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  ⚡ 주의사항
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  • 지점 입고 확인은 운영담당자 필수<br/>
                  • 수량 변경 시 물류팀과 사전 협의<br/>
                  • 긴급 요청은 사유 명시 필요
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  📊 성과 향상 팁
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                  • 정기적인 재고 현황 파악<br/>
                  • 계절별 수요 패턴 분석<br/>
                  • 지점별 특성 고려한 계획
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

interface LogisticsDashboardProps {
  awaitingLogistics: number;
  overdueRequests: number;
  activeRequests: number;
  loading: boolean;
  userId?: string;
  monthlyCompleted?: number;
  monthlyDispatched?: number;
  avgProcessingTime?: number;
  operationsSubmitted?: number;
  poCompleted?: number;
  warehouseReceived?: number;
  branchDispatched?: number;
}

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  awaitingLogistics,
  overdueRequests,
  activeRequests,
  loading,
  userId,
  monthlyCompleted = 0,
  monthlyDispatched = 0,
  avgProcessingTime = 2.3,
  operationsSubmitted = 0,
  poCompleted = 0,
  warehouseReceived = 0,
  branchDispatched = 0
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 🚨 긴급 알림 카드 (최상단) */}
      {overdueRequests > 0 && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                🚨 긴급 처리 필요
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  icon={<ErrorIcon />}
                  label={`긴급 처리 ${overdueRequests}건`}
                  color="error"
                  size="medium"
                  sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                  clickable
                  onClick={() => navigate('/purchase-requests?filter=urgent')}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                ⚠️ 다음 조건에 해당하는 요청들입니다: ① 운영부 요청완료 후 24시간 경과 ② 입고예정일 초과 ③ 입고완료 후 3일 이상 출고 지연 ④ 긴급 요청 표시
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate('/purchase-requests?filter=urgent')}
              sx={{ minWidth: 140, py: 1.5 }}
            >
              긴급 요청 확인
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'stretch' }}>
        {/* 📋 단계별 처리 현황 */}
        <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold' }}>
              📋 단계별 처리 현황
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              {/* 1. 이카운트 등록 및 구매처 발주 대기 */}
              <Box sx={{ p: 2.5, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'warning.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  1
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ScheduleIcon color="warning" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        이카운트등록 및 구매처발주 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        운영부 요청 완료 → 구매처발주 처리 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                      {operationsSubmitted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=operations_submitted')}
                      sx={{ minWidth: 80 }}
                    >
                      처리하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 2. 발주 완료 → 입고 대기 */}
              <Box sx={{ p: 2.5, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'info.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  2
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ShippingIcon color="info" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        발주 완료 → 입고 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        구매처 발주 완료 → 실제 입고 확인 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h4" fontWeight="bold" color="info.main">
                      {poCompleted}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="info"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=po_completed')}
                      sx={{ minWidth: 80 }}
                    >
                      확인하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 3. 창고 입고 → 출고 대기 */}
              <Box sx={{ p: 2.5, bgcolor: 'secondary.50', borderRadius: 2, border: '1px solid', borderColor: 'secondary.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'secondary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  3
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <LocalShippingIcon color="secondary" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        입고 완료 → 출고 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        물류창고 입고 완료 → 지점 출고 처리 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h4" fontWeight="bold" color="secondary.main">
                      {warehouseReceived}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=warehouse_received')}
                      sx={{ minWidth: 80 }}
                    >
                      출고하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 4. 지점 출고 완료 */}
              <Box sx={{ p: 2.5, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: -8, left: 16, width: 24, height: 24, borderRadius: '50%', bgcolor: 'success.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 'bold' }}>
                  4
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <CheckCircleIcon color="success" sx={{ fontSize: '2rem' }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 0.5 }}>
                        지점 출고 완료
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                        전체 지점 출고 완료 → 입고 확인 대기
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {branchDispatched}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>건</Typography>
                    <Button
                      variant="contained"
                      color="success"
                      size="medium"
                      onClick={() => navigate('/purchase-requests?status=branch_dispatched')}
                      sx={{ minWidth: 80 }}
                    >
                      추적하기
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* 📊 이달의 성과 */}
        <Box sx={{ flex: '1 1 350px', minWidth: 350 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 'bold' }}>
              📊 이달의 성과
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 0.5 }}>
                  {monthlyCompleted}
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  물류 처리 완료
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  발주·입고·출고 처리
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mb: 0.5 }}>
                  {monthlyDispatched}
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  지점 출고 완료
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  배송 완료 건수
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ mb: 0.5 }}>
                  {avgProcessingTime}
                </Typography>
                <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 0.25 }}>
                  평균 처리시간 (일)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  요청부터 완료까지
                </Typography>
              </Box>
            </Box>
            
            {/* 성과 지표 설명 */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.4, textAlign: 'center' }}>
                💡 <strong>물류 처리 완료</strong>는 이카운트 등록, 구매처 발주, 창고 입고, 지점 출고 중 하나 이상 처리한 건수입니다.
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 💡 업무 가이드 */}
      <Paper sx={{ p: 3, borderRadius: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'info.main' }}>
          💡 물류팀 업무 가이드
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              🔄 일반적인 처리 순서
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              1. 운영부 요청 접수 → 2. 이카운트 등록 → 3. 구매처 발주 → 4. 입고 확인 → 5. 지점별 출고
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              ⚡ 우선순위 처리 기준
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
              긴급 요청 {'>'} 지연된 요청 {'>'} 입고 예정일 임박 {'>'} 일반 요청 순으로 처리하세요.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

interface AdminDashboardProps {
  systemHealth: {
    activeUsers: number;
    todayActivity: number;
    errorRate: number;
  };
  totalUsers: number;
  totalBranches: number;
  loading: boolean;
  userId?: string;
  operationsWaiting?: number;
  poCompleted?: number;
  warehouseReceived?: number;
  branchDispatched?: number;
  completed?: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  systemHealth,
  totalUsers,
  totalBranches,
  loading,
  userId,
  operationsWaiting = 0,
  poCompleted = 0,
  warehouseReceived = 0,
  branchDispatched = 0,
  completed = 0
}) => {
  const getHealthColor = (rate: number) => {
    if (rate < 2) return 'success';
    if (rate < 5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 🔄 전체 프로세스 현황 */}
      <ProcessOverview
        operationsWaiting={operationsWaiting}
        poCompleted={poCompleted}
        warehouseReceived={warehouseReceived}
        branchDispatched={branchDispatched}
        completed={completed}
        userRole="admin"
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {/* 시스템 상태 */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              🖥️ 시스템 상태
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">시스템 안정성</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {(100 - systemHealth.errorRate).toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100 - systemHealth.errorRate}
                color={getHealthColor(systemHealth.errorRate) as any}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            <List dense>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <PeopleIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={`활성 사용자: ${systemHealth.activeUsers}명`}
                  secondary="현재 시스템 사용 중"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <TrendingUpIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={`오늘 활동: ${systemHealth.todayActivity}건`}
                  secondary="부품 등록, 요청 등"
                />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <ErrorIcon 
                    fontSize="small" 
                    color={getHealthColor(systemHealth.errorRate) as any}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`오류율: ${systemHealth.errorRate.toFixed(2)}%`}
                  secondary="시스템 안정성 지표"
                />
              </ListItem>
            </List>
          </Paper>
        </Box>

        {/* 관리 도구 */}
        <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
          <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              📊 시스템 요약
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                  총 사용자: {totalUsers}명
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                  활성 지점: {totalBranches}개
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                  시스템 가동률: {(100 - systemHealth.errorRate).toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}; 