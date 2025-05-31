import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Slide,
  Alert,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  Smartphone as MobileIcon,
  Computer as DesktopIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstall: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newServiceWorker, setNewServiceWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // 설치 가능할 때만 안내 표시
      setTimeout(() => {
        setShowInstallDialog(true);
      }, 3000); // 3초 후 표시
    };

    // 앱이 설치되었을 때
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallDialog(false);
      console.log('PWA 설치 완료');
    };

    // Service Worker 업데이트 감지
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            setNewServiceWorker(newWorker);
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdateDialog(true);
              }
            });
          }
        });
      });
    }

    // 이미 설치된 상태 확인
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('사용자가 PWA 설치를 승인했습니다');
      } else {
        console.log('사용자가 PWA 설치를 거부했습니다');
      }
      
      setInstallPrompt(null);
      setShowInstallDialog(false);
    } catch (error) {
      console.error('PWA 설치 오류:', error);
    }
  };

  const handleUpdate = () => {
    if (newServiceWorker) {
      newServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdateDialog(false);
  };

  const dismissInstall = () => {
    setShowInstallDialog(false);
    // 7일 후 다시 표시
    const dismissTime = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissTime.toString());
  };

  // 이미 설치되었거나 지원하지 않는 브라우저면 표시하지 않음
  if (isInstalled || !installPrompt) {
    return (
      <>
        {/* 업데이트 다이얼로그 */}
        <Dialog open={showUpdateDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckIcon color="primary" />
              앱 업데이트 가능
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              새로운 버전의 앱이 준비되었습니다. 
              최신 기능과 개선사항을 사용하려면 지금 업데이트하세요.
            </Typography>
            <Alert severity="info">
              업데이트 후 앱이 다시 로드됩니다.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowUpdateDialog(false)}>
              나중에
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              startIcon={<CheckIcon />}
            >
              지금 업데이트
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {/* 설치 안내 다이얼로그 */}
      <Dialog
        open={showInstallDialog}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as any}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InstallIcon color="primary" />
              앱으로 설치하기
            </Box>
            <IconButton
              onClick={dismissInstall}
              size="small"
              sx={{ color: 'text.secondary' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3}>
            <Typography variant="h6" component="h3">
              🚀 더 나은 경험을 위해 앱으로 설치하세요!
            </Typography>

            <Typography variant="body1" color="text.secondary">
              부품 관리 시스템을 앱으로 설치하면 다음과 같은 장점이 있습니다:
            </Typography>

            <Box sx={{ pl: 2 }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DesktopIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    데스크톱에서 앱처럼 실행
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MobileIcon color="primary" fontSize="small" />
                  <Typography variant="body2">
                    모바일에서 홈 화면에 추가
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    오프라인에서도 일부 기능 사용 가능
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    빠른 실행 및 부드러운 성능
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckIcon color="success" fontSize="small" />
                  <Typography variant="body2">
                    푸시 알림 수신 (선택사항)
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                💡 <strong>팁:</strong> 설치 후에도 웹브라우저에서 계속 사용할 수 있습니다.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={dismissInstall} variant="outlined">
            나중에
          </Button>
          <Button
            onClick={handleInstall}
            variant="contained"
            startIcon={<InstallIcon />}
            size="large"
          >
            지금 설치
          </Button>
        </DialogActions>
      </Dialog>

      {/* 업데이트 다이얼로그 */}
      <Dialog open={showUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="primary" />
            앱 업데이트 가능
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            새로운 버전의 앱이 준비되었습니다. 
            최신 기능과 개선사항을 사용하려면 지금 업데이트하세요.
          </Typography>
          <Alert severity="info">
            업데이트 후 앱이 다시 로드됩니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>
            나중에
          </Button>
          <Button
            onClick={handleUpdate}
            variant="contained"
            startIcon={<CheckIcon />}
          >
            지금 업데이트
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PWAInstall; 