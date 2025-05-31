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
        <Box sx={{ pt: 1 }}>
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
      {/* 인사말 */}
      <Typography variant="h6" sx={{ mb: 1, color: 'text.secondary' }}>
        안녕하세요, {userProfile?.name}님! 👋
      </Typography>

      {/* 브라우저 알림 권한 요청 */}
      <NotificationPermission />

      {/* 에러 표시 */}
      {stats.error && (
        <Alert 
          severity="error" 
          sx={{ mb: 1 }}
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 1 }}>
        {/* 공통 카드들 - 운영담당자는 제외 */}
        {userProfile?.role !== 'logistics' && userProfile?.role !== 'operations' && (
          <>
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
        
        {/* 역할별 추가 카드들 - 운영담당자 카드 제거 */}
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
      <Paper sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}
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
          <Box sx={{ pr: 2 }}>
            <Tooltip title="새로고침">
              <IconButton onClick={handleRefresh} disabled={stats.loading} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* 탭 컨텐츠 */}
      <TabPanel value={tabValue} index={0}>
        {/* 역할별 맞춤 대시보드 */}
        <Box>
          {userProfile?.role === 'operations' && (
            <OperationsDashboard
              myRequests={stats.myRequests || 0}
              urgentRequests={stats.urgentRequests || 0}
              recentRequests={stats.recentRequests || []}
              loading={stats.loading}
              userId={currentUser?.uid}
              monthlyRequests={stats.monthlyRequests || 0}
              avgCompletionTime={stats.avgCompletionTime || 0}
              requestAccuracy={stats.requestAccuracy || 0}
              awaitingConfirmation={stats.awaitingConfirmation || 0}
              inProgress={stats.inProgress || 0}
              completed={stats.completed || 0}
              operationsWaiting={stats.operationsWaiting || 0}
              operationsPoCompleted={stats.operationsPoCompleted || 0}
              operationsWarehouseReceived={stats.operationsWarehouseReceived || 0}
            />
          )}

          {userProfile?.role === 'logistics' && (
            <LogisticsDashboard
              awaitingLogistics={stats.awaitingLogistics || 0}
              overdueRequests={stats.overdueRequests || 0}
              activeRequests={stats.activeRequests}
              loading={stats.loading}
              userId={currentUser?.uid}
              monthlyCompleted={stats.monthlyCompleted || 0}
              monthlyDispatched={stats.monthlyDispatched || 0}
              avgProcessingTime={stats.avgProcessingTime || 2.3}
              operationsSubmitted={stats.operationsSubmitted || 0}
              poCompleted={stats.poCompleted || 0}
              warehouseReceived={stats.warehouseReceived || 0}
              branchDispatched={stats.branchDispatched || 0}
            />
          )}

          {userProfile?.role === 'admin' && stats.systemHealth && (
            <AdminDashboard
              systemHealth={stats.systemHealth}
              totalUsers={stats.totalUsers}
              totalBranches={stats.totalBranches}
              loading={stats.loading}
              userId={currentUser?.uid}
              operationsWaiting={stats.operationsSubmitted || 0}
              poCompleted={stats.poCompleted || 0}
              warehouseReceived={stats.warehouseReceived || 0}
              branchDispatched={stats.branchDispatched || 0}
              completed={stats.completed || 0}
            />
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* 역할별 맞춤 차트 대시보드 */}
        <ChartDashboard
          userRole={userProfile?.role}
          monthlyTrend={chartData.monthlyTrend}
          categoryDistribution={chartData.categoryDistribution}
          processingTime={chartData.processingTime}
          branchRequests={chartData.branchRequests}
          statusDistribution={chartData.statusDistribution}
          supplierPerformance={chartData.supplierPerformance}
          quantityAccuracy={chartData.quantityAccuracy}
          systemActivity={chartData.systemActivity}
          bottleneckAnalysis={chartData.bottleneckAnalysis}
          loading={chartData.loading}
        />
      </TabPanel>
    </Box>
  );
};

export default Dashboard; 