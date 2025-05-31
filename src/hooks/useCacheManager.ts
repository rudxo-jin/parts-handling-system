import { useState, useCallback, useRef, useEffect } from 'react';

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expires: number;
  key: string;
  size: number;
}

interface CacheStats {
  totalItems: number;
  totalSize: number;
  hitRate: number;
  missCount: number;
  hitCount: number;
}

export const useCacheManager = (maxSize: number = 50 * 1024 * 1024) => { // 50MB 기본값
  const [cache, setCache] = useState<Map<string, CacheItem>>(new Map());
  const [stats, setStats] = useState<CacheStats>({
    totalItems: 0,
    totalSize: 0,
    hitRate: 0,
    missCount: 0,
    hitCount: 0,
  });
  
  const mountedRef = useRef(true);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // cleanup 관리
  useEffect(() => {
    mountedRef.current = true;
    
    // 10분마다 만료된 캐시 정리
    cleanupIntervalRef.current = setInterval(cleanupExpiredItems, 10 * 60 * 1000);
    
    return () => {
      mountedRef.current = false;
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []);

  // 데이터 크기 계산
  const calculateSize = useCallback((data: any): number => {
    try {
      return JSON.stringify(data).length * 2; // UTF-16 문자당 2바이트
    } catch {
      return 1000; // 직렬화 불가능한 경우 기본값
    }
  }, []);

  // 통계 업데이트
  const updateStats = useCallback(() => {
    if (!mountedRef.current) return;
    
    const items = Array.from(cache.values());
    const totalItems = items.length;
    const totalSize = items.reduce((sum, item) => sum + item.size, 0);
    
    setStats(prev => ({
      ...prev,
      totalItems,
      totalSize,
      hitRate: prev.hitCount + prev.missCount > 0 
        ? (prev.hitCount / (prev.hitCount + prev.missCount)) * 100 
        : 0,
    }));
  }, [cache]);

  // 만료된 아이템 정리
  const cleanupExpiredItems = useCallback(() => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    setCache(prev => {
      const newCache = new Map(prev);
      
      for (const [key, item] of Array.from(newCache.entries())) {
        if (item.expires < now) {
          newCache.delete(key);
        }
      }
      
      return newCache;
    });
    
    updateStats();
  }, [updateStats]);

  // LRU 정책으로 공간 확보
  const makeSpace = useCallback((requiredSize: number) => {
    if (!mountedRef.current) return;
    
    setCache(prev => {
      const newCache = new Map(prev);
      const items = Array.from(newCache.values()).sort((a, b) => a.timestamp - b.timestamp);
      
      let currentSize = items.reduce((sum, item) => sum + item.size, 0);
      
      for (const item of items) {
        if (currentSize + requiredSize <= maxSize) break;
        
        newCache.delete(item.key);
        currentSize -= item.size;
      }
      
      return newCache;
    });
  }, [maxSize]);

  // 캐시에 데이터 저장
  const set = useCallback(<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void => {
    if (!mountedRef.current) return;
    
    const size = calculateSize(data);
    const now = Date.now();
    
    // 공간이 부족하면 LRU로 정리
    if (stats.totalSize + size > maxSize) {
      makeSpace(size);
    }
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expires: now + ttl,
      key,
      size,
    };
    
    setCache(prev => new Map(prev).set(key, item));
    updateStats();
  }, [calculateSize, stats.totalSize, maxSize, makeSpace, updateStats]);

  // 캐시에서 데이터 조회
  const get = useCallback(<T>(key: string): T | null => {
    const item = cache.get(key);
    const now = Date.now();
    
    if (!item || item.expires < now) {
      // 캐시 미스
      setStats(prev => ({ ...prev, missCount: prev.missCount + 1 }));
      
      if (item && item.expires < now) {
        // 만료된 아이템 제거
        setCache(prev => {
          const newCache = new Map(prev);
          newCache.delete(key);
          return newCache;
        });
      }
      
      return null;
    }
    
    // 캐시 히트 - 타임스탬프 업데이트 (LRU)
    setStats(prev => ({ ...prev, hitCount: prev.hitCount + 1 }));
    
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, { ...item, timestamp: now });
      return newCache;
    });
    
    return item.data as T;
  }, [cache]);

  // 캐시에서 데이터 삭제
  const remove = useCallback((key: string): boolean => {
    if (!mountedRef.current) return false;
    
    const existed = cache.has(key);
    
    if (existed) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      updateStats();
    }
    
    return existed;
  }, [cache, updateStats]);

  // 모든 캐시 삭제
  const clear = useCallback(() => {
    if (!mountedRef.current) return;
    
    setCache(new Map());
    setStats({
      totalItems: 0,
      totalSize: 0,
      hitRate: 0,
      missCount: 0,
      hitCount: 0,
    });
  }, []);

  // 캐시된 함수 호출
  const cachedCall = useCallback(async <T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> => {
    // 캐시 확인
    const cached = get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // 캐시 미스 - 함수 실행 후 캐시 저장
    const result = await fn();
    set(key, result, ttl);
    
    return result;
  }, [get, set]);

  // 패턴으로 캐시 키 삭제
  const removeByPattern = useCallback((pattern: RegExp): number => {
    if (!mountedRef.current) return 0;
    
    let removedCount = 0;
    
    setCache(prev => {
      const newCache = new Map(prev);
      
      for (const key of Array.from(newCache.keys())) {
        if (pattern.test(key)) {
          newCache.delete(key);
          removedCount++;
        }
      }
      
      return newCache;
    });
    
    updateStats();
    return removedCount;
  }, [updateStats]);

  // 캐시 내보내기 (백업용)
  const exportCache = useCallback(() => {
    const items = Array.from(cache.entries()).map(([key, item]) => ({
      key,
      data: item.data,
      expires: item.expires,
    }));
    
    return {
      items,
      stats,
      timestamp: Date.now(),
    };
  }, [cache, stats]);

  // 캐시 가져오기 (복원용)
  const importCache = useCallback((exported: ReturnType<typeof exportCache>) => {
    if (!mountedRef.current) return;
    
    const now = Date.now();
    const newCache = new Map<string, CacheItem>();
    
    for (const item of exported.items) {
      if (item.expires > now) {
        const size = calculateSize(item.data);
        newCache.set(item.key, {
          data: item.data,
          timestamp: now,
          expires: item.expires,
          key: item.key,
          size,
        });
      }
    }
    
    setCache(newCache);
    updateStats();
  }, [calculateSize, updateStats]);

  // 캐시 상태 모니터링
  const getDetailedStats = useCallback(() => {
    const items = Array.from(cache.values());
    const now = Date.now();
    
    const expiredCount = items.filter(item => item.expires < now).length;
    const largestItem = items.reduce((largest, current) => 
      current.size > largest.size ? current : largest, 
      items[0] || { size: 0, key: 'none' }
    );
    
    const avgSize = items.length > 0 ? stats.totalSize / items.length : 0;
    const memoryUsage = (stats.totalSize / maxSize) * 100;
    
    return {
      ...stats,
      expiredCount,
      largestItem: { key: largestItem.key, size: largestItem.size },
      avgSize,
      memoryUsage,
      efficiency: stats.hitRate,
    };
  }, [cache, stats, maxSize]);

  return {
    // 기본 캐시 작업
    set,
    get,
    remove,
    clear,
    
    // 고급 기능
    cachedCall,
    removeByPattern,
    cleanupExpiredItems,
    
    // 백업/복원
    exportCache,
    importCache,
    
    // 통계 및 모니터링
    stats,
    getDetailedStats,
    
    // 상태
    cache,
    maxSize,
  };
}; 