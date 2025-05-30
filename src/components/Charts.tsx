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
} from 'recharts';
import {
  MonthlyTrendData,
  CategoryDistributionData,
  ProcessingTimeData,
  BranchRequestData,
  StatusDistributionData,
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
  </ChartContainer>
);

// 종합 차트 대시보드 컴포넌트
interface ChartDashboardProps {
  monthlyTrend: MonthlyTrendData[];
  categoryDistribution: CategoryDistributionData[];
  processingTime: ProcessingTimeData[];
  branchRequests: BranchRequestData[];
  statusDistribution: StatusDistributionData[];
  loading?: boolean;
}

export const ChartDashboard: React.FC<ChartDashboardProps> = ({
  monthlyTrend,
  categoryDistribution,
  processingTime,
  branchRequests,
  statusDistribution,
  loading = false,
}) => (
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