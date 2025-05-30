import { useState, useEffect } from 'react';
import { UserRole } from '../types';

// 월별 구매 요청 트렌드 데이터
export interface MonthlyTrendData {
  month: string;
  requests: number;
  completed: number;
  pending: number;
}

// 부품 카테고리별 분포 데이터
export interface CategoryDistributionData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

// 구매 요청 처리 시간 분석 데이터
export interface ProcessingTimeData {
  stage: string;
  averageDays: number;
  minDays: number;
  maxDays: number;
}

// 지점별 요청 현황 데이터
export interface BranchRequestData {
  branchName: string;
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  completionRate: number;
}

// 상태별 구매 요청 분포
export interface StatusDistributionData {
  status: string;
  count: number;
  color: string;
  label: string;
}

interface ChartDataState {
  monthlyTrend: MonthlyTrendData[];
  categoryDistribution: CategoryDistributionData[];
  processingTime: ProcessingTimeData[];
  branchRequests: BranchRequestData[];
  statusDistribution: StatusDistributionData[];
  loading: boolean;
  error: string | null;
}

export const useChartData = (userRole: UserRole | undefined) => {
  const [data, setData] = useState<ChartDataState>({
    monthlyTrend: [],
    categoryDistribution: [],
    processingTime: [],
    branchRequests: [],
    statusDistribution: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userRole) return;

    const generateMockChartData = (): ChartDataState => {
      // 월별 트렌드 데이터 (최근 6개월)
      const monthlyTrend: MonthlyTrendData[] = [];
      const months = ['1월', '2월', '3월', '4월', '5월', '6월'];
      
      months.forEach((month, index) => {
        const requests = Math.floor(Math.random() * 50) + 20;
        const completed = Math.floor(requests * (0.6 + Math.random() * 0.3));
        const pending = requests - completed;
        
        monthlyTrend.push({
          month,
          requests,
          completed,
          pending,
        });
      });

      // 부품 카테고리별 분포
      const categories = [
        { name: '전자부품', color: '#1976d2' },
        { name: '기계부품', color: '#ed6c02' },
        { name: '소모품', color: '#2e7d32' },
        { name: '안전용품', color: '#9c27b0' },
        { name: '기타', color: '#d32f2f' },
      ];

      const categoryDistribution: CategoryDistributionData[] = categories.map(cat => {
        const count = Math.floor(Math.random() * 100) + 10;
        return {
          category: cat.name,
          count,
          percentage: 0, // 나중에 계산
          color: cat.color,
        };
      });

      // 퍼센티지 계산
      const totalCount = categoryDistribution.reduce((sum, item) => sum + item.count, 0);
      categoryDistribution.forEach(item => {
        item.percentage = Math.round((item.count / totalCount) * 100);
      });

      // 처리 시간 분석
      const processingTime: ProcessingTimeData[] = [
        {
          stage: '요청 접수',
          averageDays: 1,
          minDays: 0,
          maxDays: 3,
        },
        {
          stage: '이카운트 등록',
          averageDays: 2,
          minDays: 1,
          maxDays: 5,
        },
        {
          stage: '발주 처리',
          averageDays: 3,
          minDays: 1,
          maxDays: 7,
        },
        {
          stage: '입고 대기',
          averageDays: 7,
          minDays: 3,
          maxDays: 14,
        },
        {
          stage: '지점 출고',
          averageDays: 2,
          minDays: 1,
          maxDays: 5,
        },
      ];

      // 지점별 요청 현황
      const branchNames = ['강남점', '홍대점', '잠실점', '신촌점', '명동점'];
      const branchRequests: BranchRequestData[] = branchNames.map(name => {
        const totalRequests = Math.floor(Math.random() * 30) + 10;
        const completedRequests = Math.floor(totalRequests * (0.5 + Math.random() * 0.4));
        const pendingRequests = totalRequests - completedRequests;
        const completionRate = Math.round((completedRequests / totalRequests) * 100);

        return {
          branchName: name,
          totalRequests,
          completedRequests,
          pendingRequests,
          completionRate,
        };
      });

      // 상태별 분포
      const statusDistribution: StatusDistributionData[] = [
        {
          status: 'operations_submitted',
          count: Math.floor(Math.random() * 20) + 5,
          color: '#ed6c02',
          label: '요청 완료',
        },
        {
          status: 'ecount_registered',
          count: Math.floor(Math.random() * 15) + 3,
          color: '#1976d2',
          label: '이카운트 등록',
        },
        {
          status: 'po_completed',
          count: Math.floor(Math.random() * 25) + 8,
          color: '#9c27b0',
          label: '발주 완료',
        },
        {
          status: 'warehouse_received',
          count: Math.floor(Math.random() * 18) + 5,
          color: '#2e7d32',
          label: '입고 완료',
        },
        {
          status: 'branch_dispatched',
          count: Math.floor(Math.random() * 12) + 3,
          color: '#388e3c',
          label: '출고 완료',
        },
        {
          status: 'branch_received_confirmed',
          count: Math.floor(Math.random() * 30) + 15,
          color: '#4caf50',
          label: '입고 확인',
        },
      ];

      return {
        monthlyTrend,
        categoryDistribution,
        processingTime,
        branchRequests,
        statusDistribution,
        loading: false,
        error: null,
      };
    };

    // 초기 데이터 로드
    const loadData = () => {
      try {
        setData(generateMockChartData());
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: '차트 데이터를 불러오는데 실패했습니다.',
        }));
      }
    };

    loadData();

    // 5분마다 데이터 업데이트 (실시간 느낌)
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% 확률로 데이터 업데이트
        loadData();
      }
    }, 300000); // 5분

    return () => {
      clearInterval(interval);
    };
  }, [userRole]);

  return data;
}; 