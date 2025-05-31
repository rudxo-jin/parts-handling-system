import { useState, useEffect, useCallback } from 'react';

interface BundleStats {
  totalSize: number;
  gzipSize: number;
  assets: AssetInfo[];
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  loadTime: number;
  renderTime: number;
}

interface AssetInfo {
  name: string;
  size: number;
  gzipSize?: number;
  type: string;
  cached: boolean;
}

interface ChunkInfo {
  name: string;
  size: number;
  modules: string[];
  isInitial: boolean;
  isAsync: boolean;
}

interface ModuleInfo {
  name: string;
  size: number;
  dependencies: string[];
  reasons: string[];
}

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  
  // Custom Metrics
  ttfb: number; // Time to First Byte
  domLoad: number; // DOM Content Loaded
  windowLoad: number; // Window Load
  memoryUsage: number; // JS Heap Size
  resourceCount: number; // Total Resources
}

export const useBundleAnalyzer = () => {
  const [bundleStats, setBundleStats] = useState<BundleStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  // 번들 분석 실행
  const analyzeBundles = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      const startTime = performance.now();
      
      // Performance API를 사용한 메트릭 수집
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      // 메모리 사용량 측정
      const memory = (performance as any).memory;
      
      const metrics: PerformanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: navigation.responseStart - navigation.requestStart,
        domLoad: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        windowLoad: navigation.loadEventEnd - navigation.fetchStart,
        memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0, // MB
        resourceCount: resources.length,
      };

      // Core Web Vitals 측정
      if ('web-vital' in window) {
        // 실제 환경에서는 web-vitals 라이브러리 사용
        // 여기서는 시뮬레이션
        metrics.fcp = Math.random() * 2000 + 1000; // 1-3초
        metrics.lcp = Math.random() * 3000 + 2000; // 2-5초
        metrics.fid = Math.random() * 100; // 0-100ms
        metrics.cls = Math.random() * 0.1; // 0-0.1
      }

      setPerformanceMetrics(metrics);

      // 리소스별 분석
      const assets: AssetInfo[] = resources.map(resource => {
        const resourceTiming = resource as PerformanceResourceTiming;
        return {
          name: resource.name.split('/').pop() || resource.name,
          size: resourceTiming.transferSize || 0,
          type: getResourceType(resource.name),
          cached: (resourceTiming.transferSize || 0) === 0,
        };
      });

      // 번들 통계 생성 (시뮬레이션)
      const totalSize = assets.reduce((sum, asset) => sum + asset.size, 0);
      const gzipSize = Math.floor(totalSize * 0.3); // 일반적으로 30% 압축

      const stats: BundleStats = {
        totalSize,
        gzipSize,
        assets,
        chunks: [
          {
            name: 'main',
            size: totalSize * 0.6,
            modules: ['react', 'material-ui', 'firebase'],
            isInitial: true,
            isAsync: false,
          },
          {
            name: 'vendor',
            size: totalSize * 0.3,
            modules: ['react-dom', 'react-router'],
            isInitial: true,
            isAsync: false,
          },
          {
            name: 'async',
            size: totalSize * 0.1,
            modules: ['lazy-components'],
            isInitial: false,
            isAsync: true,
          },
        ],
        modules: [],
        loadTime: performance.now() - startTime,
        renderTime: metrics.domLoad,
      };

      setBundleStats(stats);
      generateRecommendations(stats, metrics);
      
    } catch (error) {
      console.error('번들 분석 오류:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // 리소스 타입 감지
  const getResourceType = (url: string): string => {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'javascript';
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.match(/\.(json|xml)$/)) return 'data';
    return 'other';
  };

  // 최적화 권장사항 생성
  const generateRecommendations = (stats: BundleStats, metrics: PerformanceMetrics) => {
    const recs: string[] = [];

    // 번들 크기 검사
    if (stats.totalSize > 2 * 1024 * 1024) { // 2MB
      recs.push('번들 크기가 큽니다. 코드 스플리팅을 고려하세요.');
    }

    // Core Web Vitals 검사
    if (metrics.fcp > 1800) {
      recs.push('First Contentful Paint가 느립니다. 중요한 리소스를 먼저 로드하세요.');
    }

    if (metrics.lcp > 2500) {
      recs.push('Largest Contentful Paint가 느립니다. 이미지 최적화를 고려하세요.');
    }

    if (metrics.fid > 100) {
      recs.push('First Input Delay가 깁니다. 메인 스레드 작업을 줄이세요.');
    }

    if (metrics.cls > 0.1) {
      recs.push('Cumulative Layout Shift가 높습니다. 레이아웃 안정성을 개선하세요.');
    }

    // 메모리 사용량 검사
    if (metrics.memoryUsage > 50) { // 50MB
      recs.push('메모리 사용량이 높습니다. 메모리 누수를 확인하세요.');
    }

    // 캐싱 효율성 검사
    const uncachedAssets = stats.assets.filter(asset => !asset.cached);
    if (uncachedAssets.length > stats.assets.length * 0.7) {
      recs.push('캐싱 효율성이 낮습니다. 캐시 전략을 개선하세요.');
    }

    // JavaScript 번들 검사
    const jsAssets = stats.assets.filter(asset => asset.type === 'javascript');
    const totalJsSize = jsAssets.reduce((sum, asset) => sum + asset.size, 0);
    if (totalJsSize > 1 * 1024 * 1024) { // 1MB
      recs.push('JavaScript 번들이 큽니다. 트리 쉐이킹이나 코드 스플리팅을 적용하세요.');
    }

    // 이미지 최적화 검사
    const imageAssets = stats.assets.filter(asset => asset.type === 'image');
    const totalImageSize = imageAssets.reduce((sum, asset) => sum + asset.size, 0);
    if (totalImageSize > 500 * 1024) { // 500KB
      recs.push('이미지 크기가 큽니다. WebP 형식이나 압축을 고려하세요.');
    }

    if (recs.length === 0) {
      recs.push('성능이 양호합니다! 지속적인 모니터링을 권장합니다.');
    }

    setRecommendations(recs);
  };

  // 실시간 성능 모니터링
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          setPerformanceMetrics(prev => prev ? { ...prev, lcp: entry.startTime } : prev);
        }
        if (entry.entryType === 'first-input') {
          setPerformanceMetrics(prev => prev ? { ...prev, fid: (entry as any).processingStart - entry.startTime } : prev);
        }
        if (entry.entryType === 'layout-shift') {
          setPerformanceMetrics(prev => prev ? { ...prev, cls: prev.cls + (entry as any).value } : prev);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // 지원하지 않는 브라우저에서는 무시
    }

    return () => observer.disconnect();
  }, []);

  // 성능 리포트 생성
  const generateReport = useCallback(() => {
    if (!bundleStats || !performanceMetrics) return null;

    return {
      timestamp: new Date().toISOString(),
      bundleStats,
      performanceMetrics,
      recommendations,
      score: calculatePerformanceScore(performanceMetrics),
    };
  }, [bundleStats, performanceMetrics, recommendations]);

  // 성능 점수 계산
  const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100;

    // Core Web Vitals 점수 (각각 25점)
    if (metrics.fcp > 1800) score -= 25;
    else if (metrics.fcp > 1200) score -= 15;
    else if (metrics.fcp > 800) score -= 5;

    if (metrics.lcp > 2500) score -= 25;
    else if (metrics.lcp > 2000) score -= 15;
    else if (metrics.lcp > 1500) score -= 5;

    if (metrics.fid > 100) score -= 25;
    else if (metrics.fid > 50) score -= 15;
    else if (metrics.fid > 25) score -= 5;

    if (metrics.cls > 0.1) score -= 25;
    else if (metrics.cls > 0.05) score -= 15;
    else if (metrics.cls > 0.025) score -= 5;

    return Math.max(0, score);
  };

  return {
    bundleStats,
    performanceMetrics,
    recommendations,
    isAnalyzing,
    analyzeBundles,
    generateReport,
    calculatePerformanceScore,
  };
}; 