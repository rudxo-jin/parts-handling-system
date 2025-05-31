import React from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Area,
  AreaChart,
  ComposedChart,
  Line,
} from 'recharts';
import {
  MonthlyTrendData,
  CategoryDistributionData,
  ProcessingTimeData,
  BranchRequestData,
  StatusDistributionData,
  SupplierPerformanceData,
  QuantityAccuracyData,
  SystemActivityData,
  BottleneckData,
} from '../hooks/useChartData';

interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
  loading?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  children,
  height = 300,
  loading = false,
}) => (
  <Paper sx={{ p: 3, borderRadius: 2 }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
      {title}
    </Typography>
    {loading ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height 
      }}>
        <CircularProgress />
      </Box>
    ) : (
      <Box sx={{ height }}>
        {children}
      </Box>
    )}
  </Paper>
);

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[];
  loading?: boolean;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="📈 월별 구매 요청 트렌드" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          월별 트렌드 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              value,
              name === 'requests' ? '전체 요청' :
              name === 'completed' ? '완료' : '대기'
            ]}
          />
          <Legend 
            formatter={(value) => 
              value === 'requests' ? '전체 요청' :
              value === 'completed' ? '완료' : '대기'
            }
          />
          <Area
            type="monotone"
            dataKey="requests"
            stackId="1"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="completed"
            stackId="2"
            stroke="#2e7d32"
            fill="#2e7d32"
            fillOpacity={0.8}
          />
          <Area
            type="monotone"
            dataKey="pending"
            stackId="2"
            stroke="#ed6c02"
            fill="#ed6c02"
            fillOpacity={0.8}
          />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

interface CategoryPieChartProps {
  data: CategoryDistributionData[];
  loading?: boolean;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  loading = false,
}) => {
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ChartContainer title="🥧 부품 카테고리별 분포" loading={loading} height={350}>
      {data.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography variant="body1">
            카테고리별 분포 데이터가 없습니다.
          </Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value}개 (${props.payload.percentage}%)`,
                '부품 수'
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
};

interface ProcessingTimeChartProps {
  data: ProcessingTimeData[];
  loading?: boolean;
}

export const ProcessingTimeChart: React.FC<ProcessingTimeChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="⏱️ 단계별 처리 시간 분석" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          처리 시간 분석 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="stage" 
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis label={{ value: '일수', angle: -90, position: 'insideLeft' }} />
          <Tooltip 
            formatter={(value, name) => [
              `${value}일`,
              name === 'averageDays' ? '평균' :
              name === 'minDays' ? '최소' : '최대'
            ]}
          />
          <Legend 
            formatter={(value) => 
              value === 'averageDays' ? '평균 처리 시간' :
              value === 'minDays' ? '최소 시간' : '최대 시간'
            }
          />
          <Bar dataKey="averageDays" fill="#1976d2" />
          <Bar dataKey="minDays" fill="#2e7d32" />
          <Bar dataKey="maxDays" fill="#ed6c02" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

interface BranchRequestChartProps {
  data: BranchRequestData[];
  loading?: boolean;
}

export const BranchRequestChart: React.FC<BranchRequestChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="🏪 지점별 요청 현황" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          지점별 요청 현황 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="branchName" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              value,
              name === 'completedRequests' ? '완료된 요청' :
              name === 'pendingRequests' ? '대기 중인 요청' : '전체 요청'
            ]}
          />
          <Legend 
            formatter={(value) => 
              value === 'completedRequests' ? '완료된 요청' :
              value === 'pendingRequests' ? '대기 중인 요청' : '전체 요청'
            }
          />
          <Bar dataKey="completedRequests" stackId="a" fill="#2e7d32" />
          <Bar dataKey="pendingRequests" stackId="a" fill="#ed6c02" />
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
  loading?: boolean;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="📊 구매 요청 상태별 분포" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          상태별 분포 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            type="category" 
            dataKey="label" 
            width={80}
            fontSize={12}
          />
          <Tooltip 
            formatter={(value) => [`${value}건`, '요청 수']}
          />
          <Bar dataKey="count" fill="#1976d2">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

// 공급업체 성과 분석 차트
interface SupplierPerformanceChartProps {
  data: SupplierPerformanceData[];
  loading?: boolean;
}

export const SupplierPerformanceChart: React.FC<SupplierPerformanceChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="🏭 공급업체 성과 분석" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          공급업체 성과 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="supplierName" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => [
              name === 'onTimeDeliveryRate' ? `${value}%` :
              name === 'qualityScore' ? `${value}점` :
              name === 'avgDeliveryDays' ? `${value}일` : value,
              name === 'onTimeDeliveryRate' ? '납기 준수율' :
              name === 'qualityScore' ? '품질 점수' :
              name === 'avgDeliveryDays' ? '평균 배송일' : '총 주문'
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="onTimeDeliveryRate" fill="#2e7d32" name="납기 준수율 (%)" />
          <Bar yAxisId="left" dataKey="qualityScore" fill="#1976d2" name="품질 점수" />
          <Line yAxisId="right" type="monotone" dataKey="avgDeliveryDays" stroke="#ed6c02" strokeWidth={3} name="평균 배송일" />
        </ComposedChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

// 수량 정확도 분석 차트
interface QuantityAccuracyChartProps {
  data: QuantityAccuracyData[];
  loading?: boolean;
}

export const QuantityAccuracyChart: React.FC<QuantityAccuracyChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="🎯 요청 수량 vs 실제 입고 수량 정확도" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          수량 정확도 분석 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => [
              name === 'accuracyRate' ? `${value}%` : `${value}개`,
              name === 'requestedQuantity' ? '요청 수량' :
              name === 'actualQuantity' ? '실제 입고' : '정확도'
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="requestedQuantity" fill="#1976d2" name="요청 수량" />
          <Bar yAxisId="left" dataKey="actualQuantity" fill="#2e7d32" name="실제 입고" />
          <Line yAxisId="right" type="monotone" dataKey="accuracyRate" stroke="#ed6c02" strokeWidth={3} name="정확도 (%)" />
        </ComposedChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

// 시스템 활성도 차트
interface SystemActivityChartProps {
  data: SystemActivityData[];
  loading?: boolean;
}

export const SystemActivityChart: React.FC<SystemActivityChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="📊 시간대별 시스템 사용률" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          시스템 활성도 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              value,
              name === 'operations' ? '운영팀' :
              name === 'logistics' ? '물류팀' :
              name === 'admin' ? '관리자' : '전체 액션'
            ]}
          />
          <Legend />
          <Area type="monotone" dataKey="operations" stackId="1" stroke="#1976d2" fill="#1976d2" />
          <Area type="monotone" dataKey="logistics" stackId="1" stroke="#2e7d32" fill="#2e7d32" />
          <Area type="monotone" dataKey="admin" stackId="1" stroke="#9c27b0" fill="#9c27b0" />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

// 프로세스 병목 분석 차트
interface BottleneckChartProps {
  data: BottleneckData[];
  loading?: boolean;
}

export const BottleneckChart: React.FC<BottleneckChartProps> = ({
  data,
  loading = false,
}) => (
  <ChartContainer title="🚧 프로세스 병목 지점 분석" loading={loading} height={350}>
    {data.length === 0 ? (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography variant="body1">
          병목 분석 데이터가 없습니다.
        </Typography>
      </Box>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="stage" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip 
            formatter={(value, name) => [
              name === 'bottleneckScore' ? `${value}점` : `${value}일`,
              name === 'avgWaitTime' ? '평균 대기시간' :
              name === 'maxWaitTime' ? '최대 대기시간' : '병목 점수'
            ]}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="avgWaitTime" fill="#ed6c02" name="평균 대기시간 (일)" />
          <Bar yAxisId="left" dataKey="maxWaitTime" fill="#d32f2f" name="최대 대기시간 (일)" />
          <Line yAxisId="right" type="monotone" dataKey="bottleneckScore" stroke="#9c27b0" strokeWidth={3} name="병목 점수" />
        </ComposedChart>
      </ResponsiveContainer>
    )}
  </ChartContainer>
);

// 역할별 차트 대시보드 컴포넌트들
interface LogisticsChartDashboardProps {
  processingTime: ProcessingTimeData[];
  supplierPerformance: SupplierPerformanceData[];
  loading?: boolean;
}

export const LogisticsChartDashboard: React.FC<LogisticsChartDashboardProps> = ({
  processingTime,
  supplierPerformance,
  loading = false,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
      🚛 물류팀 데이터 분석
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <ProcessingTimeChart data={processingTime} loading={loading} />
      </Box>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <SupplierPerformanceChart data={supplierPerformance} loading={loading} />
      </Box>
    </Box>
  </Box>
);

interface OperationsChartDashboardProps {
  monthlyTrend: MonthlyTrendData[];
  quantityAccuracy: QuantityAccuracyData[];
  loading?: boolean;
}

export const OperationsChartDashboard: React.FC<OperationsChartDashboardProps> = ({
  monthlyTrend,
  quantityAccuracy,
  loading = false,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}>
      🏢 운영팀 데이터 분석
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
        <MonthlyTrendChart data={monthlyTrend} loading={loading} />
      </Box>
      <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
        <QuantityAccuracyChart data={quantityAccuracy} loading={loading} />
      </Box>
    </Box>
  </Box>
);

interface AdminChartDashboardProps {
  systemActivity: SystemActivityData[];
  bottleneckAnalysis: BottleneckData[];
  processingTime: ProcessingTimeData[];
  supplierPerformance: SupplierPerformanceData[];
  monthlyTrend: MonthlyTrendData[];
  quantityAccuracy: QuantityAccuracyData[];
  loading?: boolean;
}

export const AdminChartDashboard: React.FC<AdminChartDashboardProps> = ({
  systemActivity,
  bottleneckAnalysis,
  processingTime,
  supplierPerformance,
  monthlyTrend,
  quantityAccuracy,
  loading = false,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
    {/* 관리자 전용 차트 */}
    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
      👨‍💼 관리자 전용 분석
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <SystemActivityChart data={systemActivity} loading={loading} />
      </Box>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <BottleneckChart data={bottleneckAnalysis} loading={loading} />
      </Box>
    </Box>
    
    {/* 물류팀 데이터 */}
    <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold', color: 'primary.main' }}>
      🚛 물류팀 성과 분석
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <ProcessingTimeChart data={processingTime} loading={loading} />
      </Box>
      <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
        <SupplierPerformanceChart data={supplierPerformance} loading={loading} />
      </Box>
    </Box>
    
    {/* 운영팀 데이터 */}
    <Typography variant="h6" sx={{ mt: 3, fontWeight: 'bold', color: 'secondary.main' }}>
      🏢 운영팀 성과 분석
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
        <MonthlyTrendChart data={monthlyTrend} loading={loading} />
      </Box>
      <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
        <QuantityAccuracyChart data={quantityAccuracy} loading={loading} />
      </Box>
    </Box>
  </Box>
);

// 메인 차트 대시보드 컴포넌트 수정
interface ChartDashboardProps {
  userRole?: string;
  monthlyTrend: MonthlyTrendData[];
  categoryDistribution: CategoryDistributionData[];
  processingTime: ProcessingTimeData[];
  branchRequests: BranchRequestData[];
  statusDistribution: StatusDistributionData[];
  // 새로운 데이터 타입들
  supplierPerformance?: SupplierPerformanceData[];
  quantityAccuracy?: QuantityAccuracyData[];
  systemActivity?: SystemActivityData[];
  bottleneckAnalysis?: BottleneckData[];
  loading?: boolean;
}

export const ChartDashboard: React.FC<ChartDashboardProps> = ({
  userRole,
  monthlyTrend,
  categoryDistribution,
  processingTime,
  branchRequests,
  statusDistribution,
  supplierPerformance = [],
  quantityAccuracy = [],
  systemActivity = [],
  bottleneckAnalysis = [],
  loading = false,
}) => {
  // 역할별 대시보드 렌더링
  if (userRole === 'logistics') {
    return (
      <LogisticsChartDashboard
        processingTime={processingTime}
        supplierPerformance={supplierPerformance}
        loading={loading}
      />
    );
  }

  if (userRole === 'operations') {
    return (
      <OperationsChartDashboard
        monthlyTrend={monthlyTrend}
        quantityAccuracy={quantityAccuracy}
        loading={loading}
      />
    );
  }

  if (userRole === 'admin') {
    return (
      <AdminChartDashboard
        systemActivity={systemActivity}
        bottleneckAnalysis={bottleneckAnalysis}
        processingTime={processingTime}
        supplierPerformance={supplierPerformance}
        monthlyTrend={monthlyTrend}
        quantityAccuracy={quantityAccuracy}
        loading={loading}
      />
    );
  }

  // 기본 대시보드 (기존 코드 유지)
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '2 1 600px', minWidth: 600 }}>
          <MonthlyTrendChart data={monthlyTrend} loading={loading} />
        </Box>
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <CategoryPieChart data={categoryDistribution} loading={loading} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
          <ProcessingTimeChart data={processingTime} loading={loading} />
        </Box>
        <Box sx={{ flex: '1 1 500px', minWidth: 500 }}>
          <BranchRequestChart data={branchRequests} loading={loading} />
        </Box>
      </Box>
      <Box>
        <StatusDistributionChart data={statusDistribution} loading={loading} />
      </Box>
    </Box>
  );
};

// 새로운 데이터 타입들을 export
export type { SupplierPerformanceData, QuantityAccuracyData, SystemActivityData, BottleneckData }; 