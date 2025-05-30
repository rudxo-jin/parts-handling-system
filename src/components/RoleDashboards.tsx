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
} from '@mui/icons-material';
import { PurchaseRequest } from '../types';
import { ActivityFeed } from './ActivityFeed';
import { safeToDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';

interface OperationsDashboardProps {
  myRequests: number;
  urgentRequests: number;
  recentRequests: PurchaseRequest[];
  loading: boolean;
  userId?: string;
}

export const OperationsDashboard: React.FC<OperationsDashboardProps> = ({
  myRequests,
  urgentRequests,
  recentRequests,
  loading,
  userId
}) => {
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
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {/* 내 요청 현황 */}
      <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📋 내 요청 현황
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">전체 요청</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {myRequests}건
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={myRequests > 0 ? 100 : 0} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {urgentRequests > 0 && (
            <Box sx={{ mb: 3 }}>
              <Chip
                icon={<WarningIcon />}
                label={`긴급 요청 ${urgentRequests}건`}
                color="error"
                variant="outlined"
                size="small"
              />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            최근 요청 내역
          </Typography>
          
          {loading ? (
            <Typography variant="body2" color="text.secondary">
              로딩 중...
            </Typography>
          ) : recentRequests.length > 0 ? (
            <List dense>
              {recentRequests.slice(0, 3).map((request) => (
                <ListItem key={request.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <AssignmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={request.requestedPartName}
                    secondary={
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Chip
                          label={getStatusText(request.currentStatus)}
                          size="small"
                          color={getStatusColor(request.currentStatus) as any}
                          variant="outlined"
                        />
                        <Typography variant="caption" component="span">
                          {safeToDate(request.requestDate).toLocaleDateString('ko-KR')}
                        </Typography>
                      </span>
                    }
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              아직 요청한 부품이 없습니다.
            </Typography>
          )}
        </Paper>
      </Box>

      {/* 빠른 액션 */}
      <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🚀 빠른 액션
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              신규 부품 요청
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              내 요청 확인
            </Button>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              💡 팁
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                긴급 요청은 우선 처리됩니다
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                부품 정보를 정확히 입력해주세요
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mb: 0.5 }}>
                지점별 수량을 미리 계획하세요
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* 활동 피드 */}
      <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
        <ActivityFeed 
          userRole="operations" 
          userId={userId}
          maxItems={6}
          height={300}
        />
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
}

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  awaitingLogistics,
  overdueRequests,
  activeRequests,
  loading,
  userId,
  monthlyCompleted = 0,
  monthlyDispatched = 0,
  avgProcessingTime = 2.3
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 🚨 긴급 알림 카드 (최상단) */}
      {(overdueRequests > 0 || awaitingLogistics > 0) && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: overdueRequests > 0 ? 'error.50' : 'warning.50', border: '1px solid', borderColor: overdueRequests > 0 ? 'error.200' : 'warning.200' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: overdueRequests > 0 ? 'error.main' : 'warning.main', mb: 1 }}>
                🚨 긴급 처리 필요
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 1 }}>
                {overdueRequests > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`지연된 요청 ${overdueRequests}건`}
                    color="error"
                    size="medium"
                    sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                    clickable
                    onClick={() => navigate('/purchase-requests?filter=overdue')}
                  />
                )}
                {awaitingLogistics > 0 && (
                  <Chip
                    icon={<WarningIcon />}
                    label={`처리 대기 ${awaitingLogistics}건`}
                    color="warning"
                    size="medium"
                    sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                    clickable
                    onClick={() => navigate('/purchase-requests?filter=awaiting-logistics')}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {overdueRequests > 0 
                  ? '⚠️ 입고 예정일이 지난 요청들이 있습니다. 우선 처리가 필요합니다.'
                  : '📋 물류팀 처리가 필요한 요청들입니다. (이카운트 등록, 입고 확인, 출고 처리)'
                }
              </Typography>
            </Box>
            <Button
              variant="contained"
              color={overdueRequests > 0 ? 'error' : 'warning'}
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                // 지연된 요청이 있으면 지연 요청 우선, 없으면 처리 대기 요청
                if (overdueRequests > 0) {
                  navigate('/purchase-requests?filter=overdue');
                } else {
                  navigate('/purchase-requests?filter=awaiting-logistics');
                }
              }}
              sx={{ minWidth: 140, py: 1.5 }}
            >
              {overdueRequests > 0 ? '지연 요청 확인' : '대기 요청 확인'}
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* 📋 단계별 처리 현황 */}
        <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              📋 단계별 처리 현황
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
              {/* 이카운트 등록 대기 */}
              <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 2, border: '1px solid', borderColor: 'warning.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ScheduleIcon color="warning" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        이카운트 등록 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        운영부 요청 완료 → 이카운트 등록 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight="bold" color="warning.main">
                      {awaitingLogistics}건
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => navigate('/purchase-requests?status=operations_submitted')}
                    >
                      처리하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 발주 완료 → 입고 대기 */}
              <Box sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <ShippingIcon color="info" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        발주 완료 → 입고 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        구매처 발주 완료 → 실제 입고 확인 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {Math.floor(activeRequests * 0.3)}건
                    </Typography>
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={() => navigate('/purchase-requests?status=po_completed')}
                    >
                      확인하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 창고 입고 → 출고 대기 */}
              <Box sx={{ p: 2, bgcolor: 'secondary.50', borderRadius: 2, border: '1px solid', borderColor: 'secondary.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <LocalShippingIcon color="secondary" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        창고 입고 → 출고 대기
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        물류창고 입고 완료 → 지점 출고 처리 필요
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight="bold" color="secondary.main">
                      {Math.floor(activeRequests * 0.4)}건
                    </Typography>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      onClick={() => navigate('/purchase-requests?status=warehouse_received')}
                    >
                      출고하기
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 지점 출고 완료 */}
              <Box sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        지점 출고 완료
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        전체 지점 출고 완료 → 입고 확인 대기
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {Math.floor(activeRequests * 0.6)}건
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => navigate('/purchase-requests?status=branch_dispatched')}
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
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
              📊 이달의 성과
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  처리 완료
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {monthlyCompleted}건
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  출고 완료
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {monthlyDispatched}건
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  평균 처리 시간
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {avgProcessingTime}일
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 활동 피드 */}
      <Box sx={{ width: '100%' }}>
        <ActivityFeed 
          userRole="logistics" 
          userId={userId}
          maxItems={6}
          height={300}
        />
      </Box>
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
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  systemHealth,
  totalUsers,
  totalBranches,
  loading,
  userId
}) => {
  const getHealthColor = (rate: number) => {
    if (rate < 2) return 'success';
    if (rate < 5) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
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
            🛠️ 관리 도구
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<PeopleIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              사용자 관리
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AssignmentIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              지점 관리
            </Button>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              📊 시스템 요약
            </Typography>
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

      {/* 활동 피드 */}
      <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
        <ActivityFeed 
          userRole="admin" 
          userId={userId}
          maxItems={8}
          height={300}
        />
      </Box>
    </Box>
  );
}; 