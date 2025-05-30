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
} from '@mui/icons-material';
import { PurchaseRequest } from '../types';
import { ActivityFeed } from './ActivityFeed';
import { safeToDate } from '../utils/dateUtils';

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
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              • 긴급 요청은 우선 처리됩니다
              <br />
              • 부품 정보를 정확히 입력해주세요
              <br />
              • 지점별 수량을 미리 계획하세요
            </Typography>
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
}

export const LogisticsDashboard: React.FC<LogisticsDashboardProps> = ({
  awaitingLogistics,
  overdueRequests,
  activeRequests,
  loading,
  userId
}) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {/* 물류 처리 현황 */}
      <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            🚛 물류 처리 현황
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">처리 대기</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {awaitingLogistics}건
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={activeRequests > 0 ? (awaitingLogistics / activeRequests) * 100 : 0}
              color="warning"
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {overdueRequests > 0 && (
            <Box sx={{ mb: 3 }}>
              <Chip
                icon={<ErrorIcon />}
                label={`지연 요청 ${overdueRequests}건`}
                color="error"
                size="small"
              />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
            처리 단계별 현황
          </Typography>
          
          <List dense>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <ScheduleIcon fontSize="small" color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="이카운트 등록 대기"
                secondary="신규 요청 처리"
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <ShippingIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="발주 및 입고 관리"
                secondary="공급업체 관리"
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <CheckCircleIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText
                primary="지점 출고 관리"
                secondary="배송 및 확인"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* 오늘의 업무 */}
      <Box sx={{ flex: '1 1 300px', minWidth: 300 }}>
        <Paper sx={{ p: 3, height: 400, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📅 오늘의 업무
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<AssignmentIcon />}
              fullWidth
              sx={{ py: 1.5 }}
              color="warning"
            >
              처리 대기 요청 확인
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<ShippingIcon />}
              fullWidth
              sx={{ py: 1.5 }}
            >
              출고 관리
            </Button>
            
            <Divider sx={{ my: 1 }} />
            
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              ⚡ 우선 처리 필요
            </Typography>
            {overdueRequests > 0 ? (
              <Typography variant="body2" color="error">
                지연된 요청 {overdueRequests}건이 있습니다.
              </Typography>
            ) : (
              <Typography variant="body2" color="success.main">
                모든 요청이 정상 진행 중입니다.
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>

      {/* 활동 피드 */}
      <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
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
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              • 총 사용자: {totalUsers}명
              <br />
              • 활성 지점: {totalBranches}개
              <br />
              • 시스템 가동률: {(100 - systemHealth.errorRate).toFixed(1)}%
            </Typography>
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