import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  PendingActions as PendingIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  BarChart as ChartIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useChartData } from '../hooks/useChartData';
import { OperationsDashboard, LogisticsDashboard, AdminDashboard } from '../components/RoleDashboards';
import { ChartDashboard } from '../components/Charts';
import NotificationPermission from '../components/NotificationPermission';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const stats = useDashboardStats(userProfile?.role, currentUser?.uid);
  const chartData = useChartData(userProfile?.role);
  const [tabValue, setTabValue] = useState(0);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
  }> = ({ title, value, icon, color, loading = false }) => (
    <Card sx={{ 
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            {loading ? (
              <Skeleton variant="text" width={60} height={32} />
            ) : (
              <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                {value}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color, fontSize: '2.5rem', opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          대시보드
        </Typography>
        <Tooltip title="새로고침">
          <IconButton onClick={handleRefresh} disabled={stats.loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
        안녕하세요, {userProfile?.name}님! 👋
      </Typography>

      {/* 브라우저 알림 권한 요청 */}
      <NotificationPermission />

      {/* 에러 표시 */}
      {stats.error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton
              aria-label="새로고침"
              color="inherit"
              size="small"
              onClick={handleRefresh}
            >
              <RefreshIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {stats.error}
        </Alert>
      )}

      {/* 통계 카드들 */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* 공통 카드들 - 역할별로 다르게 표시 */}
        {userProfile?.role !== 'logistics' && (
          <>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <StatCard
                title="등록된 부품"
                value={stats.totalParts}
                icon={<InventoryIcon />}
                color="#1976d2"
                loading={stats.loading}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <StatCard
                title="전체 구매 요청"
                value={stats.totalPurchaseRequests}
                icon={<ShoppingCartIcon />}
                color="#ed6c02"
                loading={stats.loading}
              />
            </Box>
          </>
        )}
        
        {/* 역할별 추가 카드들 */}
        {userProfile?.role === 'operations' && (
          <>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <StatCard
                title="내 요청"
                value={stats.myRequests || 0}
                icon={<PendingIcon />}
                color="#2e7d32"
                loading={stats.loading}
              />
            </Box>
            {(stats.urgentRequests || 0) > 0 && (
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <StatCard
                  title="긴급 요청"
                  value={stats.urgentRequests || 0}
                  icon={<WarningIcon />}
                  color="#d32f2f"
                  loading={stats.loading}
                />
              </Box>
            )}
          </>
        )}

        {userProfile?.role === 'logistics' && (
          <>
            {(stats.overdueRequests || 0) > 0 && (
              <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
                <StatCard
                  title="지연 요청"
                  value={stats.overdueRequests || 0}
                  icon={<WarningIcon />}
                  color="#d32f2f"
                  loading={stats.loading}
                />
              </Box>
            )}
          </>
        )}

        {userProfile?.role === 'admin' && (
          <>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <StatCard
                title="등록된 사용자"
                value={stats.totalUsers}
                icon={<PeopleIcon />}
                color="#2e7d32"
                loading={stats.loading}
              />
            </Box>
            <Box sx={{ flex: '1 1 250px', minWidth: 250 }}>
              <StatCard
                title="활성 지점"
                value={stats.totalBranches}
                icon={<StoreIcon />}
                color="#9c27b0"
                loading={stats.loading}
              />
            </Box>
          </>
        )}
      </Box>

      {/* 탭 네비게이션 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label="업무 현황" 
            icon={<PendingIcon />}
            iconPosition="start"
          />
          <Tab 
            label="데이터 분석" 
            icon={<ChartIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        {/* 역할별 맞춤 대시보드 */}
        <Box sx={{ mb: 3 }}>
          {userProfile?.role === 'operations' && (
            <OperationsDashboard
              myRequests={stats.myRequests || 0}
              urgentRequests={stats.urgentRequests || 0}
              recentRequests={stats.recentRequests || []}
              loading={stats.loading}
              userId={currentUser?.uid}
            />
          )}

          {userProfile?.role === 'logistics' && (
            <LogisticsDashboard
              awaitingLogistics={stats.awaitingLogistics || 0}
              overdueRequests={stats.overdueRequests || 0}
              activeRequests={stats.activeRequests}
              loading={stats.loading}
              userId={currentUser?.uid}
              monthlyCompleted={stats.todayCompleted || 0}
              monthlyDispatched={stats.weeklyDispatched || 0}
              avgProcessingTime={stats.avgProcessingTime || 2.3}
            />
          )}

          {userProfile?.role === 'admin' && stats.systemHealth && (
            <AdminDashboard
              systemHealth={stats.systemHealth}
              totalUsers={stats.totalUsers}
              totalBranches={stats.totalBranches}
              loading={stats.loading}
              userId={currentUser?.uid}
            />
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* 차트 대시보드 */}
        <ChartDashboard
          monthlyTrend={chartData.monthlyTrend}
          categoryDistribution={chartData.categoryDistribution}
          processingTime={chartData.processingTime}
          branchRequests={chartData.branchRequests}
          statusDistribution={chartData.statusDistribution}
          loading={chartData.loading}
        />
      </TabPanel>

      {/* 역할별 안내 메시지 */}
      <Paper sx={{ p: 3, borderRadius: 2, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          💡 시작하기
        </Typography>
        {userProfile?.role === 'admin' && (
          <Typography variant="body2" color="text.secondary">
            관리자로서 사용자 관리와 지점 관리 메뉴에서 시스템 설정을 시작하세요.
          </Typography>
        )}
        {userProfile?.role === 'operations' && (
          <Typography variant="body2" color="text.secondary">
            부품 관리 메뉴에서 신규 부품을 등록하고 구매 요청을 생성하세요.
          </Typography>
        )}
        {userProfile?.role === 'logistics' && (
          <Typography variant="body2" color="text.secondary">
            구매 요청 목록에서 처리 대상 요청들을 확인하세요.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard; 