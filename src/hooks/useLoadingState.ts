import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingOperation {
  id: string;
  label: string;
  startTime: number;
  progress?: number;
}

export const useLoadingState = () => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [operations, setOperations] = useState<LoadingOperation[]>([]);
  const mountedRef = useRef(true);

  // cleanup 관리
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 로딩 시작
  const startLoading = useCallback((id: string, label?: string) => {
    if (!mountedRef.current) return;
    
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    
    if (label) {
      setOperations(prev => [
        ...prev.filter(op => op.id !== id),
        {
          id,
          label,
          startTime: Date.now(),
          progress: 0,
        }
      ]);
    }
  }, []);

  // 로딩 완료
  const stopLoading = useCallback((id: string) => {
    if (!mountedRef.current) return;
    
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });

    setOperations(prev => prev.filter(op => op.id !== id));
  }, []);

  // 진행률 업데이트
  const updateProgress = useCallback((id: string, progress: number) => {
    if (!mountedRef.current) return;
    
    setOperations(prev => 
      prev.map(op => 
        op.id === id ? { ...op, progress: Math.min(100, Math.max(0, progress)) } : op
      )
    );
  }, []);

  // 전체 로딩 상태
  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  // 특정 로딩 상태 확인
  const isLoading = useCallback((id: string) => {
    return loadingStates[id] || false;
  }, [loadingStates]);

  // 비동기 작업 래퍼
  const withLoading = useCallback(async <T>(
    id: string,
    operation: () => Promise<T>,
    label?: string
  ): Promise<T> => {
    try {
      startLoading(id, label);
      const result = await operation();
      return result;
    } finally {
      stopLoading(id);
    }
  }, [startLoading, stopLoading]);

  // 진행률과 함께 비동기 작업 실행
  const withProgressLoading = useCallback(async <T>(
    id: string,
    operation: (updateProgress: (progress: number) => void) => Promise<T>,
    label?: string
  ): Promise<T> => {
    try {
      startLoading(id, label);
      
      const progressUpdater = (progress: number) => {
        updateProgress(id, progress);
      };
      
      const result = await operation(progressUpdater);
      return result;
    } finally {
      stopLoading(id);
    }
  }, [startLoading, stopLoading, updateProgress]);

  // 모든 로딩 중지
  const stopAllLoading = useCallback(() => {
    if (!mountedRef.current) return;
    
    setLoadingStates({});
    setOperations([]);
  }, []);

  // 로딩 통계
  const getLoadingStats = useCallback(() => {
    const totalOperations = operations.length;
    const averageProgress = totalOperations > 0 
      ? operations.reduce((sum, op) => sum + (op.progress || 0), 0) / totalOperations
      : 0;
    
    const longestRunning = operations.reduce((longest, current) => {
      const currentDuration = Date.now() - current.startTime;
      const longestDuration = Date.now() - longest.startTime;
      return currentDuration > longestDuration ? current : longest;
    }, operations[0]);

    return {
      totalOperations,
      averageProgress,
      longestRunning,
      isAnyLoading,
    };
  }, [operations, isAnyLoading]);

  return {
    // 상태
    loadingStates,
    operations,
    isAnyLoading,
    
    // 메서드
    startLoading,
    stopLoading,
    updateProgress,
    isLoading,
    withLoading,
    withProgressLoading,
    stopAllLoading,
    getLoadingStats,
  };
}; 