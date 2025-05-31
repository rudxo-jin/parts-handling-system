import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Collapse,
  Stack,
  Divider,
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuth } from '../contexts/AuthContext';

const PerformanceDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const {
    metrics,
    alerts: performanceAlerts,
    isMonitoring,
    thresholds,
    startMonitoring,
    stopMonitoring,
    clearAllAlerts: clearPerformanceAlerts,
    generateReport: generatePerformanceReport,
  } = usePerformanceMonitor();

  const {
    errors,
    isRetrying,
    clearAllErrors,
    getErrorStats,
    generateErrorReport,
    getRecoveryActions,
    removeError,
  } = useErrorHandler();

  const [autoMonitoring, setAutoMonitoring] = useState(true);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    performance: true,
    errors: true,
    alerts: false,
  });

  // cleanup을 위한 ref
  const mountedRef = useRef(true);

  const errorStats = getErrorStats();

  // 섹션 토글
  const toggleSection = (section: string) => {
    if (!mountedRef.current) return;
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // 자동 모니터링 시작
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoMonitoring) {
      console.log('🚀 자동 모니터링 시작');
      startMonitoring();
    }

    return () => {
      mountedRef.current = false;
      try {
        stopMonitoring();
      } catch (error) {
        console.error('모니터링 정지 오류:', error);
      }
    };
  }, [autoMonitoring, startMonitoring, stopMonitoring]);

  // 성능 상태 계산
  const getPerformanceStatus = () => {
    const issues = [];
    
    if (metrics.loadTime > thresholds.loadTime) issues.push('로딩 속도');
    if (metrics.memoryUsage > thresholds.memoryUsage) issues.push('메모리 사용량');
    if (metrics.apiResponseTime > thresholds.apiResponseTime) issues.push('API 응답');
    if (metrics.errorCount > thresholds.errorCount) issues.push('오류 발생');

    if (issues.length === 0) return { status: 'excellent', color: 'success', text: '우수' };
    if (issues.length <= 2) return { status: 'good', color: 'warning', text: '양호' };
    return { status: 'poor', color: 'error', text: '개선 필요' };
  };

  const performanceStatus = getPerformanceStatus();

  // 메트릭 포맷팅
  const formatMetric = (value: number, type: string) => {
    switch (type) {
      case 'time':
        return value > 1000 ? `${(value / 1000).toFixed(1)}초` : `${Math.round(value)}ms`;
      case 'memory':
        return `${value}MB`;
      case 'count':
        return value.toString();
      default:
        return value.toString();
    }
  };

  // 리포트 다운로드
  const downloadReport = () => {
    if (!mountedRef.current) return;
    
    try {
      const performanceReport = generatePerformanceReport();
      const errorReport = generateErrorReport();
      
      const fullReport = {
        timestamp: new Date(),
        performance: performanceReport,
        errors: errorReport,
        system: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          user: userProfile?.name || 'Unknown',
          role: userProfile?.role || 'Unknown',
        },
      };

      const blob = new Blob([JSON.stringify(fullReport, null, 2)], {
        type: 'application/json',
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-report-${new Date().toISOString().slice(0, 19)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('리포트 다운로드 오류:', error);
    }
  };

  // 자동 모니터링 토글
  const handleAutoMonitoringToggle = () => {
    if (!mountedRef.current) return;
    
    try {
      setAutoMonitoring(prev => {
        const newValue = !prev;
        console.log(`🔄 모니터링 토글: ${newValue ? '시작' : '중지'}`);
        if (newValue) {
          startMonitoring();
        } else {
          stopMonitoring();
        }
        return newValue;
      });
    } catch (error) {
      console.error('모니터링 토글 오류:', error);
    }
  };

  // 테스트 에러 생성 (개발용)
  const createTestError = () => {
    if (!mountedRef.current) return;
    
    try {
      throw new Error('테스트 에러입니다.');
    } catch (error) {
      console.error('테스트 에러:', error);
    }
  };

  // 컴포넌트가 언마운트되었으면 렌더링하지 않음
  if (!mountedRef.current) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📊 성능 모니터링 대시보드
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoMonitoring}
                onChange={handleAutoMonitoringToggle}
                color="primary"
              />
            }
            label="자동 모니터링"
          />
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setShowReportDialog(true)}
          >
            리포트 생성
          </Button>
        </Box>
      </Box>

      <Stack spacing={3}>
        {/* 전체 상태 요약 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  시스템 상태
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`성능: ${performanceStatus.text}`}
                    color={performanceStatus.color as any}
                    icon={<SpeedIcon />}
                  />
                  <Chip
                    label={`활성 오류: ${errors.length}개`}
                    color={errors.length > 0 ? 'error' : 'success'}
                    icon={errors.length > 0 ? <ErrorIcon /> : <CheckIcon />}
                  />
                  <Chip
                    label={`모니터링: ${isMonitoring ? '활성' : '비활성'}`}
                    color={isMonitoring ? 'success' : 'default'}
                    icon={<RefreshIcon />}
                  />
                </Box>
              </Box>
              
              {userProfile?.role === 'admin' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={createTestError}
                  size="small"
                >
                  테스트 에러 생성
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          {/* 성능 메트릭 */}
          <Card sx={{ flex: { lg: '2 1 600px' }, minWidth: { xs: 'auto', lg: 600 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🚀 성능 메트릭
                </Typography>
                <IconButton onClick={() => toggleSection('performance')}>
                  {expandedSections.performance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.performance}>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
                  gap: 2 
                }}>
                  <Paper sx={{ textAlign: 'center', p: 2 }}>
                    <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">
                      {formatMetric(metrics.loadTime, 'time')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      페이지 로드
                    </Typography>
                    {metrics.loadTime > thresholds.loadTime && (
                      <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                    )}
                  </Paper>
                  
                  <Paper sx={{ textAlign: 'center', p: 2 }}>
                    <MemoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">
                      {formatMetric(metrics.memoryUsage, 'memory')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      메모리 사용량
                    </Typography>
                    {metrics.memoryUsage > thresholds.memoryUsage && (
                      <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                    )}
                  </Paper>
                  
                  <Paper sx={{ textAlign: 'center', p: 2 }}>
                    <SpeedIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">
                      {formatMetric(metrics.apiResponseTime, 'time')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      API 응답
                    </Typography>
                    {metrics.apiResponseTime > thresholds.apiResponseTime && (
                      <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                    )}
                  </Paper>
                  
                  <Paper sx={{ textAlign: 'center', p: 2 }}>
                    <ErrorIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">
                      {formatMetric(metrics.errorCount, 'count')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      오류 발생
                    </Typography>
                    {metrics.errorCount > thresholds.errorCount && (
                      <TrendingUpIcon color="error" sx={{ ml: 1 }} />
                    )}
                  </Paper>
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          {/* 오류 통계 */}
          <Card sx={{ flex: { lg: '1 1 300px' }, minWidth: { xs: 'auto', lg: 300 } }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  🚨 오류 현황
                </Typography>
                <IconButton onClick={() => toggleSection('errors')}>
                  {expandedSections.errors ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.errors}>
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    총 {errorStats.total}개 오류
                  </Typography>
                  
                  {errorStats.total > 0 && (
                    <Stack spacing={1}>
                      <Typography variant="subtitle2">
                        심각도별
                      </Typography>
                      {Object.entries(errorStats.bySeverity).map(([severity, count]) => (
                        <Stack key={severity} direction="row" justifyContent="space-between">
                          <Chip
                            label={severity}
                            size="small"
                            color={
                              severity === 'critical' ? 'error' :
                              severity === 'high' ? 'warning' :
                              severity === 'medium' ? 'info' : 'default'
                            }
                          />
                          <Typography variant="body2">{count}개</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                  
                  {errorStats.total > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={clearAllErrors}
                      fullWidth
                    >
                      모든 오류 제거
                    </Button>
                  )}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        </Box>

        {/* 활성 알림 및 오류 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                🔔 활성 알림 및 오류
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={() => toggleSection('alerts')}>
                  {expandedSections.alerts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
                {(performanceAlerts.length > 0 || errors.length > 0) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      clearPerformanceAlerts();
                      clearAllErrors();
                    }}
                  >
                    모두 제거
                  </Button>
                )}
              </Box>
            </Box>
            
            <Collapse in={expandedSections.alerts}>
              {performanceAlerts.length === 0 && errors.length === 0 ? (
                <Alert severity="success">
                  현재 활성 알림이나 오류가 없습니다. 시스템이 정상적으로 작동 중입니다.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {/* 성능 알림 */}
                  {performanceAlerts.map((alert, index) => (
                    <Stack key={`perf-${index}`} direction="row" spacing={2} alignItems="center">
                      <WarningIcon color={alert.type === 'error' ? 'error' : 'warning'} />
                      <Stack sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          {alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {alert.timestamp.toLocaleTimeString()} - {alert.metric}
                        </Typography>
                      </Stack>
                    </Stack>
                  ))}
                  
                  {/* 오류 목록 */}
                  {errors.map((error) => (
                    <Stack key={error.id} spacing={1}>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <ErrorIcon color="error" />
                        <Stack sx={{ flex: 1 }}>
                          <Typography variant="body2">
                            {error.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {error.timestamp.toLocaleString()} - {error.type} ({error.severity})
                          </Typography>
                          {error.context && (
                            <Typography variant="caption" color="text.secondary">
                              컨텍스트: {error.context}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {getRecoveryActions(error).map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant={action.primary ? 'contained' : 'outlined'}
                            size="small"
                            onClick={action.action}
                            disabled={isRetrying[error.id]}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </Stack>
                      <Divider />
                    </Stack>
                  ))}
                </Stack>
              )}
            </Collapse>
          </CardContent>
        </Card>
      </Stack>

      {/* 리포트 다이얼로그 */}
      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          시스템 리포트 생성
          <IconButton
            onClick={() => setShowReportDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              현재 시스템 상태에 대한 상세 리포트를 생성합니다.
            </Typography>
            
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                포함 내용:
              </Typography>
              <Typography variant="body2">• 성능 메트릭 및 임계값 분석</Typography>
              <Typography variant="body2">• 오류 발생 현황 및 통계</Typography>
              <Typography variant="body2">• 시스템 환경 정보</Typography>
              <Typography variant="body2">• 성능 개선 권장사항</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>
            취소
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              downloadReport();
              setShowReportDialog(false);
            }}
          >
            다운로드
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceDashboard; 