import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
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

// 새로운 데이터 타입들
export interface SupplierPerformanceData {
  supplierName: string;
  onTimeDeliveryRate: number;
  qualityScore: number;
  avgDeliveryDays: number;
  totalOrders: number;
}

export interface QuantityAccuracyData {
  month: string;
  requestedQuantity: number;
  actualQuantity: number;
  accuracyRate: number;
}

export interface SystemActivityData {
  hour: string;
  operations: number;
  logistics: number;
  admin: number;
  totalActions: number;
}

export interface BottleneckData {
  stage: string;
  avgWaitTime: number;
  maxWaitTime: number;
  bottleneckScore: number;
}

interface ChartDataState {
  monthlyTrend: MonthlyTrendData[];
  categoryDistribution: CategoryDistributionData[];
  processingTime: ProcessingTimeData[];
  branchRequests: BranchRequestData[];
  statusDistribution: StatusDistributionData[];
  // 새로운 데이터들
  supplierPerformance: SupplierPerformanceData[];
  quantityAccuracy: QuantityAccuracyData[];
  systemActivity: SystemActivityData[];
  bottleneckAnalysis: BottleneckData[];
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
    supplierPerformance: [],
    quantityAccuracy: [],
    systemActivity: [],
    bottleneckAnalysis: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!userRole) return;

    const fetchChartData = async (): Promise<ChartDataState> => {
      try {
        // Firebase에서 구매 요청 데이터 가져오기
        const purchaseRequestsQuery = query(
          collection(db, 'purchaseRequests'),
          orderBy('createdAt', 'desc')
        );
        const purchaseRequestsSnapshot = await getDocs(purchaseRequestsQuery);
        const purchaseRequests = purchaseRequestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 지점 데이터 가져오기
        const branchesQuery = query(
          collection(db, 'branches'),
          where('isActive', '==', true)
        );
        const branchesSnapshot = await getDocs(branchesQuery);
        const branches = branchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 월별 트렌드 데이터 계산
        const monthlyTrend = calculateMonthlyTrend(purchaseRequests);

        // 부품 카테고리별 분포 계산
        const categoryDistribution = calculateCategoryDistribution(purchaseRequests);

        // 처리 시간 분석 (요청접수 제외)
        const processingTime = calculateProcessingTime(purchaseRequests);

        // 지점별 요청 현황
        const branchRequests = calculateBranchRequests(purchaseRequests, branches);

        // 상태별 분포
        const statusDistribution = calculateStatusDistribution(purchaseRequests);

        // 공급업체 성과 분석 (실제 데이터가 없으므로 빈 배열)
        const supplierPerformance: SupplierPerformanceData[] = [];

        // 수량 정확도 분석
        const quantityAccuracy = calculateQuantityAccuracy(purchaseRequests);

        // 시스템 활성도 (실제 로그 데이터가 없으므로 빈 배열)
        const systemActivity: SystemActivityData[] = [];

        // 프로세스 병목 분석
        const bottleneckAnalysis = calculateBottleneckAnalysis(purchaseRequests);

        return {
          monthlyTrend,
          categoryDistribution,
          processingTime,
          branchRequests,
          statusDistribution,
          supplierPerformance,
          quantityAccuracy,
          systemActivity,
          bottleneckAnalysis,
          loading: false,
          error: null,
        };
      } catch (error) {
        console.error('차트 데이터 로딩 실패:', error);
        return {
          monthlyTrend: [],
          categoryDistribution: [],
          processingTime: [],
          branchRequests: [],
          statusDistribution: [],
          supplierPerformance: [],
          quantityAccuracy: [],
          systemActivity: [],
          bottleneckAnalysis: [],
          loading: false,
          error: '차트 데이터를 불러오는데 실패했습니다.',
        };
      }
    };

    // 데이터 로딩
    fetchChartData().then(setData);
  }, [userRole]);

  return data;
};

// 월별 트렌드 계산 함수
const calculateMonthlyTrend = (requests: any[]): MonthlyTrendData[] => {
  const now = new Date();
  const monthlyData: { [key: string]: { requests: number; completed: number; pending: number } } = {};

  // 최근 6개월 초기화
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getMonth() + 1}월`;
    monthlyData[monthKey] = { requests: 0, completed: 0, pending: 0 };
  }

  requests.forEach(request => {
    if (request.createdAt?.toDate) {
      const createdDate = request.createdAt.toDate();
      const monthKey = `${createdDate.getMonth() + 1}월`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].requests++;
        if (request.currentStatus === 'branch_received_confirmed') {
          monthlyData[monthKey].completed++;
        } else {
          monthlyData[monthKey].pending++;
        }
      }
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    ...data
  }));
};

// 카테고리별 분포 계산 함수
const calculateCategoryDistribution = (requests: any[]): CategoryDistributionData[] => {
  const categoryCount: { [key: string]: number } = {};
  const colors = ['#1976d2', '#ed6c02', '#2e7d32', '#9c27b0', '#d32f2f'];

  requests.forEach(request => {
    const category = request.itemGroup1 || '기타';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const totalCount = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
  
  return Object.entries(categoryCount).map(([category, count], index) => ({
    category,
    count,
    percentage: Math.round((count / totalCount) * 100),
    color: colors[index % colors.length]
  }));
};

// 처리 시간 분석 계산 함수 (요청접수 제외)
const calculateProcessingTime = (requests: any[]): ProcessingTimeData[] => {
  const stages = [
    { key: 'po_processing', name: '이카운트등록 및 구매처발주', from: 'operationsSubmittedAt', to: 'poCompletedAt' },
    { key: 'warehouse_waiting', name: '입고 대기', from: 'poCompletedAt', to: 'warehouseReceiptAt' },
    { key: 'branch_dispatch', name: '지점 출고', from: 'warehouseReceiptAt', to: 'branchDispatchCompletedAt' }
  ];

  return stages.map(stage => {
    const processingTimes: number[] = [];

    requests.forEach(request => {
      const fromDate = request[stage.from]?.toDate?.();
      const toDate = request[stage.to]?.toDate?.();

      if (fromDate && toDate) {
        const diffTime = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          processingTimes.push(diffDays);
        }
      }
    });

    if (processingTimes.length === 0) {
      return {
        stage: stage.name,
        averageDays: 0,
        minDays: 0,
        maxDays: 0
      };
    }

    return {
      stage: stage.name,
      averageDays: Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length),
      minDays: Math.min(...processingTimes),
      maxDays: Math.max(...processingTimes)
    };
  });
};

// 지점별 요청 현황 계산 함수
const calculateBranchRequests = (requests: any[], branches: any[]): BranchRequestData[] => {
  return branches.map(branch => {
    const branchRequests = requests.filter(request => 
      request.branchDispatchQuantities?.some((dispatch: any) => 
        dispatch.branchName === branch.branchName
      )
    );

    const completedRequests = branchRequests.filter(request => 
      request.currentStatus === 'branch_received_confirmed'
    ).length;

    const totalRequests = branchRequests.length;
    const pendingRequests = totalRequests - completedRequests;
    const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

    return {
      branchName: branch.branchName,
      totalRequests,
      completedRequests,
      pendingRequests,
      completionRate
    };
  });
};

// 상태별 분포 계산 함수
const calculateStatusDistribution = (requests: any[]): StatusDistributionData[] => {
  const statusCount: { [key: string]: number } = {};
  const statusLabels: { [key: string]: { label: string; color: string } } = {
    'operations_submitted': { label: '요청 완료', color: '#ed6c02' },
    'po_completed': { label: '발주 완료', color: '#9c27b0' },
    'warehouse_received': { label: '입고 완료', color: '#2e7d32' },
    'branch_dispatched': { label: '출고 완료', color: '#388e3c' },
    'partial_dispatched': { label: '부분 출고', color: '#ff9800' },
    'branch_received_confirmed': { label: '입고 확인', color: '#4caf50' }
  };

  requests.forEach(request => {
    const status = request.currentStatus;
    if (status && statusLabels[status]) {
      statusCount[status] = (statusCount[status] || 0) + 1;
    }
  });

  return Object.entries(statusCount).map(([status, count]) => ({
    status,
    count,
    color: statusLabels[status]?.color || '#666',
    label: statusLabels[status]?.label || status
  }));
};

// 수량 정확도 계산 함수
const calculateQuantityAccuracy = (requests: any[]): QuantityAccuracyData[] => {
  const now = new Date();
  const monthlyData: { [key: string]: { requested: number; actual: number; count: number } } = {};

  // 최근 6개월 초기화
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getMonth() + 1}월`;
    monthlyData[monthKey] = { requested: 0, actual: 0, count: 0 };
  }

  requests.forEach(request => {
    if (request.createdAt?.toDate && request.requestedQuantity && request.actualReceivedQuantity) {
      const createdDate = request.createdAt.toDate();
      const monthKey = `${createdDate.getMonth() + 1}월`;
      
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].requested += request.requestedQuantity;
        monthlyData[monthKey].actual += request.actualReceivedQuantity;
        monthlyData[monthKey].count++;
      }
    }
  });

  return Object.entries(monthlyData).map(([month, data]) => {
    const accuracyRate = data.requested > 0 ? Math.round((data.actual / data.requested) * 100) : 100;
    return {
      month,
      requestedQuantity: data.requested,
      actualQuantity: data.actual,
      accuracyRate
    };
  });
};

// 프로세스 병목 분석 계산 함수
const calculateBottleneckAnalysis = (requests: any[]): BottleneckData[] => {
  const stages = [
    { key: 'po_processing', name: '이카운트등록 및 구매처발주', from: 'operationsSubmittedAt', to: 'poCompletedAt' },
    { key: 'warehouse_waiting', name: '입고 대기', from: 'poCompletedAt', to: 'warehouseReceiptAt' },
    { key: 'branch_dispatch', name: '지점 출고', from: 'warehouseReceiptAt', to: 'branchDispatchCompletedAt' }
  ];

  return stages.map(stage => {
    const waitTimes: number[] = [];

    requests.forEach(request => {
      const fromDate = request[stage.from]?.toDate?.();
      const toDate = request[stage.to]?.toDate?.();

      if (fromDate && toDate) {
        const diffTime = toDate.getTime() - fromDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          waitTimes.push(diffDays);
        }
      }
    });

    if (waitTimes.length === 0) {
      return {
        stage: stage.name,
        avgWaitTime: 0,
        maxWaitTime: 0,
        bottleneckScore: 0
      };
    }

    const avgWaitTime = waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length;
    const maxWaitTime = Math.max(...waitTimes);
    
    // 병목 점수: 평균 대기시간과 최대 대기시간을 기반으로 계산 (0-100점)
    const bottleneckScore = Math.min(100, Math.round((avgWaitTime * 2 + maxWaitTime) / 3 * 10));

    return {
      stage: stage.name,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10,
      maxWaitTime,
      bottleneckScore
    };
  });
}; 