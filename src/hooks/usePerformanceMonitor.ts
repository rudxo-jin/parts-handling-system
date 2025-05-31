import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  renderTime: number;
  apiResponseTime: number;
  errorCount: number;
  userActions: number;
}

interface PerformanceAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
}

export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    apiResponseTime: 0,
    errorCount: 0,
    userActions: 0,
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // cleanup을 위한 refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const metricsRef = useRef<PerformanceMetrics>(metrics);

  // 성능 임계값 설정 (상수로 고정)
  const thresholdsRef = useRef({
    loadTime: 3000, // 3초
    memoryUsage: 100, // 100MB
    renderTime: 16, // 16ms (60fps)
    apiResponseTime: 2000, // 2초
    errorCount: 5, // 5개 오류
    userActions: 1000, // 1000개 액션
  });

  // metrics가 변경될 때마다 ref 업데이트
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB 단위
      }
    } catch (error) {
      console.warn('메모리 측정 오류:', error);
    }
    return 0;
  }, []);

  // API 응답 시간 측정
  const measureApiResponse = useCallback((startTime: number) => {
    return Date.now() - startTime;
  }, []);

  // 렌더링 시간 측정
  const measureRenderTime = useCallback(() => {
    try {
      return performance.now();
    } catch (error) {
      console.warn('렌더링 시간 측정 오류:', error);
      return 0;
    }
  }, []);

  // 페이지 로드 시간 측정
  const measureLoadTime = useCallback(() => {
    try {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        return loadTime;
      }
    } catch (error) {
      console.warn('로드 시간 측정 오류:', error);
    }
    return 0;
  }, []);

  // 알림 생성 (안정적인 버전)
  const createAlert = useCallback((
    type: PerformanceAlert['type'],
    metric: keyof PerformanceMetrics,
    value: number,
    threshold: number
  ) => {
    if (!mountedRef.current) return;
    
    const messages = {
      loadTime: `페이지 로드 시간이 ${value}ms로 임계값 ${threshold}ms를 초과했습니다.`,
      memoryUsage: `메모리 사용량이 ${value}MB로 임계값 ${threshold}MB를 초과했습니다.`,
      renderTime: `렌더링 시간이 ${value}ms로 임계값 ${threshold}ms를 초과했습니다.`,
      apiResponseTime: `API 응답 시간이 ${value}ms로 임계값 ${threshold}ms를 초과했습니다.`,
      errorCount: `오류 발생 횟수가 ${value}개로 임계값 ${threshold}개를 초과했습니다.`,
      userActions: `사용자 액션이 ${value}개로 임계값 ${threshold}개를 초과했습니다.`,
    };

    const alert: PerformanceAlert = {
      type,
      message: messages[metric],
      timestamp: new Date(),
      metric,
      value,
      threshold,
    };

    setAlerts(prev => [alert, ...prev.slice(0, 9)]); // 최대 10개 알림 유지
  }, []);

  // 메트릭 업데이트 (의존성 최소화)
  const updateMetric = useCallback((metric: keyof PerformanceMetrics, value: number) => {
    if (!mountedRef.current) return;
    
    setMetrics(prev => {
      const newMetrics = { ...prev, [metric]: value };
      
      // 임계값 체크 (ref 사용)
      const threshold = thresholdsRef.current[metric];
      if (value > threshold) {
        const alertType = value > threshold * 1.5 ? 'error' : 'warning';
        // 직접 호출하지 않고 지연 실행
        setTimeout(() => {
          if (mountedRef.current) {
            createAlert(alertType, metric, value, threshold);
          }
        }, 0);
      }
      
      return newMetrics;
    });
  }, [createAlert]);

  // 성능 모니터링 시작 (안정화)
  const startMonitoring = useCallback(() => {
    if (!mountedRef.current) return () => {};
    
    try {
      setIsMonitoring(true);
      
      // 초기 메트릭 수집 (지연 실행)
      setTimeout(() => {
        if (mountedRef.current) {
          updateMetric('loadTime', measureLoadTime());
          updateMetric('memoryUsage', measureMemoryUsage());
        }
      }, 100);

      // 기존 interval 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // 주기적 모니터링 (5초마다)
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          updateMetric('memoryUsage', measureMemoryUsage());
        }
      }, 5000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (mountedRef.current) {
          setIsMonitoring(false);
        }
      };
    } catch (error) {
      console.error('모니터링 시작 오류:', error);
      return () => {};
    }
  }, [updateMetric, measureLoadTime, measureMemoryUsage]);

  // 성능 모니터링 중지
  const stopMonitoring = useCallback(() => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (mountedRef.current) {
        setIsMonitoring(false);
      }
    } catch (error) {
      console.error('모니터링 중지 오류:', error);
    }
  }, []);

  // API 호출 성능 측정 헬퍼
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    apiName: string
  ): Promise<T> => {
    const startTime = Date.now();
    try {
      const result = await apiCall();
      const responseTime = measureApiResponse(startTime);
      updateMetric('apiResponseTime', responseTime);
      
      console.log(`📊 API 성능: ${apiName} - ${responseTime}ms`);
      return result;
    } catch (error) {
      const responseTime = measureApiResponse(startTime);
      updateMetric('apiResponseTime', responseTime);
      updateMetric('errorCount', metricsRef.current.errorCount + 1);
      
      console.error(`❌ API 오류: ${apiName} - ${responseTime}ms`, error);
      throw error;
    }
  }, [measureApiResponse, updateMetric]);

  // 사용자 액션 추적
  const trackUserAction = useCallback((actionName: string) => {
    if (!mountedRef.current) return;
    updateMetric('userActions', metricsRef.current.userActions + 1);
    console.log(`👤 사용자 액션: ${actionName}`);
  }, [updateMetric]);

  // 렌더링 성능 측정
  const trackRender = useCallback((componentName: string) => {
    const startTime = measureRenderTime();
    
    return () => {
      if (!mountedRef.current) return;
      const renderTime = measureRenderTime() - startTime;
      updateMetric('renderTime', renderTime);
      
      if (renderTime > thresholdsRef.current.renderTime) {
        console.warn(`⚠️ 느린 렌더링: ${componentName} - ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [measureRenderTime, updateMetric]);

  // 알림 제거
  const clearAlert = useCallback((index: number) => {
    if (!mountedRef.current) return;
    setAlerts(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 모든 알림 제거
  const clearAllAlerts = useCallback(() => {
    if (!mountedRef.current) return;
    setAlerts([]);
  }, []);

  // 성능 리포트 생성
  const generateReport = useCallback(() => {
    const report = {
      timestamp: new Date(),
      metrics: metricsRef.current,
      alerts: alerts.length,
      recommendations: [] as string[],
    };

    // 성능 개선 권장사항
    const thresholds = thresholdsRef.current;
    const currentMetrics = metricsRef.current;
    
    if (currentMetrics.loadTime > thresholds.loadTime) {
      report.recommendations.push('페이지 로드 시간 최적화가 필요합니다.');
    }
    if (currentMetrics.memoryUsage > thresholds.memoryUsage) {
      report.recommendations.push('메모리 사용량 최적화가 필요합니다.');
    }
    if (currentMetrics.apiResponseTime > thresholds.apiResponseTime) {
      report.recommendations.push('API 응답 시간 최적화가 필요합니다.');
    }
    if (currentMetrics.errorCount > thresholds.errorCount) {
      report.recommendations.push('오류 처리 개선이 필요합니다.');
    }

    return report;
  }, [alerts.length]);

  // cleanup 효과
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    metrics,
    alerts,
    isMonitoring,
    thresholds: thresholdsRef.current,
    startMonitoring,
    stopMonitoring,
    trackApiCall,
    trackUserAction,
    trackRender,
    updateMetric,
    clearAlert,
    clearAllAlerts,
    generateReport,
  };
}; 