import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useBundleAnalyzer } from '../hooks/useBundleAnalyzer';
import { useToast } from '../hooks/useToast';

const BundleAnalyzer: React.FC = () => {
  const {
    bundleStats,
    performanceMetrics,
    recommendations,
    isAnalyzing,
    analyzeBundles,
    generateReport,
    calculatePerformanceScore,
  } = useBundleAnalyzer();

  const { success, error, info } = useToast();
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 초기 분석
    analyzeBundles();
  }, [analyzeBundles]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        analyzeBundles();
      }, 30000); // 30초마다 자동 새로고침
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, analyzeBundles]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  const handleDownloadReport = () => {
    try {
      const report = generateReport();
      if (!report) {
        error('리포트 생성에 실패했습니다.');
        return;
      }

      const dataStr = JSON.stringify(report, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      success('성능 리포트를 다운로드했습니다.');
    } catch (err) {
      error('리포트 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleRefresh = async () => {
    try {
      await analyzeBundles();
      info('분석이 완료되었습니다.');
    } catch (err) {
      error('분석 중 오류가 발생했습니다.');
    }
  };

  if (isAnalyzing && !bundleStats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography variant="h6">성능 분석 중...</Typography>
          <Typography variant="body2" color="text.secondary">
            번들 크기와 성능 메트릭을 분석하고 있습니다.
          </Typography>
        </Stack>
      </Box>
    );
  }

  const score = performanceMetrics ? calculatePerformanceScore(performanceMetrics) : 0;

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 성능 분석 & 최적화
          </Typography>
          <Typography variant="body1" color="text.secondary">
            번들 크기, Core Web Vitals, 그리고 최적화 권장사항을 확인하세요.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={isAnalyzing}
          >
            새로고침
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadReport}
            disabled={!bundleStats}
          >
            리포트 다운로드
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {/* 성능 점수 카드 */}
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              {getScoreIcon(score)}
              <Typography variant="h4" sx={{ ml: 1 }}>
                {score}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ ml: 0.5 }}>
                /100
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom>
              성능 점수
            </Typography>
            <Chip
              label={score >= 90 ? '우수' : score >= 70 ? '보통' : '개선 필요'}
              color={getScoreColor(score) as any}
              size="small"
            />
          </CardContent>
        </Card>

        {/* Core Web Vitals */}
        {performanceMetrics && (
          <>
            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <SpeedIcon color="primary" />
                  <Typography variant="h6">FCP</Typography>
                </Stack>
                <Typography variant="h4" color={performanceMetrics.fcp > 1800 ? 'error' : 'success'}>
                  {formatTime(performanceMetrics.fcp)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  First Contentful Paint
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <TrendingUpIcon color="primary" />
                  <Typography variant="h6">LCP</Typography>
                </Stack>
                <Typography variant="h4" color={performanceMetrics.lcp > 2500 ? 'error' : 'success'}>
                  {formatTime(performanceMetrics.lcp)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Largest Contentful Paint
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <MemoryIcon color="primary" />
                  <Typography variant="h6">메모리</Typography>
                </Stack>
                <Typography variant="h4" color={performanceMetrics.memoryUsage > 50 ? 'error' : 'success'}>
                  {performanceMetrics.memoryUsage.toFixed(1)}MB
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JS Heap Size
                </Typography>
              </CardContent>
            </Card>
          </>
        )}
      </Box>

      {/* 번들 정보 */}
      {bundleStats && (
        <Box sx={{ mt: 3 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <StorageIcon />
                <Typography variant="h6">번들 분석</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>총 크기</Typography>
                    <Typography variant="h4" color="primary">
                      {formatBytes(bundleStats.totalSize)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      압축 후: {formatBytes(bundleStats.gzipSize)}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>로드 시간</Typography>
                    <Typography variant="h4" color="primary">
                      {formatTime(bundleStats.loadTime)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      렌더링: {formatTime(bundleStats.renderTime)}
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>리소스 수</Typography>
                    <Typography variant="h4" color="primary">
                      {bundleStats.assets.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      청크: {bundleStats.chunks.length}개
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* 자산 목록 */}
      {bundleStats && (
        <Box sx={{ mt: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AnalyticsIcon />
                <Typography variant="h6">자산 상세 분석</Typography>
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>파일명</TableCell>
                      <TableCell>타입</TableCell>
                      <TableCell align="right">크기</TableCell>
                      <TableCell align="center">캐시됨</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bundleStats.assets
                      .sort((a, b) => b.size - a.size)
                      .slice(0, 20) // 상위 20개만 표시
                      .map((asset, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {asset.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={asset.type} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatBytes(asset.size)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {asset.cached ? (
                            <CheckIcon color="success" fontSize="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}

      {/* 최적화 권장사항 */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🚀 최적화 권장사항
            </Typography>
            
            {recommendations.length > 0 ? (
              <Stack spacing={2}>
                {recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    severity={rec.includes('양호') ? 'success' : rec.includes('권장') ? 'info' : 'warning'}
                    variant="outlined"
                  >
                    {rec}
                  </Alert>
                ))}
              </Stack>
            ) : (
              <Typography color="text.secondary">
                분석 중이거나 권장사항이 없습니다.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default BundleAnalyzer; 