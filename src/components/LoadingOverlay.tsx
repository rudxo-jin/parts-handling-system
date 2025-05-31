import React from 'react';
import {
  Backdrop,
  Box,
  CircularProgress,
  LinearProgress,
  Typography,
  Card,
  CardContent,
  Stack,
  Fade,
} from '@mui/material';
import { useLoadingState } from '../hooks/useLoadingState';

interface LoadingOverlayProps {
  open: boolean;
  title?: string;
  description?: string;
  showProgress?: boolean;
  variant?: 'circular' | 'linear' | 'minimal';
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  open,
  title = '로딩 중...',
  description,
  showProgress = true,
  variant = 'circular',
}) => {
  const { operations, getLoadingStats } = useLoadingState();
  const stats = getLoadingStats();

  const renderProgressContent = () => {
    if (!showProgress || operations.length === 0) {
      return null;
    }

    const currentOperation = operations[0]; // 가장 최근 작업
    const progress = currentOperation?.progress || 0;

    return (
      <Stack spacing={2} sx={{ mt: 2, minWidth: 300 }}>
        {variant === 'linear' && (
          <LinearProgress 
            variant={progress > 0 ? 'determinate' : 'indeterminate'} 
            value={progress}
            sx={{ width: '100%' }}
          />
        )}
        
        {currentOperation && (
          <Typography variant="body2" color="text.secondary" align="center">
            {currentOperation.label}
            {progress > 0 && ` (${Math.round(progress)}%)`}
          </Typography>
        )}

        {operations.length > 1 && (
          <Typography variant="caption" color="text.secondary" align="center">
            +{operations.length - 1}개 작업이 더 진행 중
          </Typography>
        )}

        {stats.averageProgress > 0 && (
          <Typography variant="caption" color="text.secondary" align="center">
            전체 진행률: {Math.round(stats.averageProgress)}%
          </Typography>
        )}
      </Stack>
    );
  };

  const renderContent = () => {
    switch (variant) {
      case 'minimal':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2">{title}</Typography>
          </Box>
        );

      case 'linear':
        return (
          <Card 
            sx={{ 
              minWidth: 300, 
              maxWidth: 500,
              backgroundColor: 'background.paper',
              boxShadow: 3,
            }}
          >
            <CardContent>
              <Stack spacing={2} alignItems="center">
                <Typography variant="h6" align="center">
                  {title}
                </Typography>
                
                {description && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    {description}
                  </Typography>
                )}

                <LinearProgress 
                  variant={stats.averageProgress > 0 ? 'determinate' : 'indeterminate'}
                  value={stats.averageProgress}
                  sx={{ width: '100%' }}
                />

                {renderProgressContent()}
              </Stack>
            </CardContent>
          </Card>
        );

      case 'circular':
      default:
        return (
          <Card 
            sx={{ 
              minWidth: 300, 
              maxWidth: 500,
              backgroundColor: 'background.paper',
              boxShadow: 3,
            }}
          >
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress 
                    size={60} 
                    variant={stats.averageProgress > 0 ? 'determinate' : 'indeterminate'}
                    value={stats.averageProgress}
                  />
                  {stats.averageProgress > 0 && (
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" component="div" color="text.secondary">
                        {Math.round(stats.averageProgress)}%
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="h6" align="center">
                  {title}
                </Typography>
                
                {description && (
                  <Typography variant="body2" color="text.secondary" align="center">
                    {description}
                  </Typography>
                )}

                {renderProgressContent()}
              </Stack>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}
      open={open}
    >
      <Fade in={open}>
        <Box>
          {renderContent()}
        </Box>
      </Fade>
    </Backdrop>
  );
};

// 전역 로딩 상태를 관리하는 컴포넌트
export const GlobalLoadingOverlay: React.FC = () => {
  const { isAnyLoading, operations } = useLoadingState();
  
  // 주요 작업만 오버레이 표시
  const showOverlay = operations.some(op => 
    op.label.includes('데이터 초기화') || 
    op.label.includes('시스템 테스트') ||
    op.label.includes('백업') ||
    op.label.includes('복원')
  );

  if (!showOverlay || !isAnyLoading) {
    return null;
  }

  const primaryOperation = operations.find(op => 
    op.label.includes('데이터 초기화') || 
    op.label.includes('시스템 테스트') ||
    op.label.includes('백업') ||
    op.label.includes('복원')
  );

  return (
    <LoadingOverlay
      open={showOverlay}
      title={primaryOperation?.label || '작업 진행 중...'}
      description="잠시만 기다려 주세요"
      showProgress={true}
      variant="circular"
    />
  );
};

export default LoadingOverlay; 