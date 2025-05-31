import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Button,
  Typography,
  Snackbar,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { browserNotificationService } from '../services/browserNotificationService';

// 개발/테스트 환경 여부 확인
const isDevelopment = process.env.NODE_ENV === 'development';

const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isCardDismissed, setIsCardDismissed] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(true);

  useEffect(() => {
    // 페이지 로드 시 현재 권한 상태 확인
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // 권한이 없는 경우 안내 표시
      if (Notification.permission === 'default') {
        setTimeout(() => {
          setShowAlert(true);
        }, 2000); // 2초 후 표시
      }
      
      // 이미 권한이 허용된 경우 성공 카드를 일정 시간 후 자동 숨김
      if (Notification.permission === 'granted') {
        setTimeout(() => {
          setShowSuccessCard(false);
        }, 5000); // 5초 후 자동 숨김
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await browserNotificationService.requestPermission();
      
      if (granted) {
        setPermission('granted');
        setAlertMessage('✅ 브라우저 알림이 활성화되었습니다!');
        setAlertSeverity('success');
        
        // 권한 허용 후 성공 카드 표시하고 자동 숨김 설정
        setShowSuccessCard(true);
        setTimeout(() => {
          setShowSuccessCard(false);
        }, 8000); // 8초 후 자동 숨김
        
        // 환영 알림 표시
        setTimeout(() => {
          browserNotificationService.showNotification(
            '🔔 알림 설정 완료',
            {
              body: '이제 중요한 업무 알림을 실시간으로 받을 수 있습니다.',
              tag: 'permission-granted'
            }
          );
        }, 1000);
      } else {
        setPermission('denied');
        setAlertMessage('❌ 브라우저 알림 권한이 거부되었습니다.');
        setAlertSeverity('error');
      }
      
      setShowAlert(true);
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      setAlertMessage('알림 권한 요청 중 오류가 발생했습니다.');
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };

  const testNotification = async () => {
    try {
      if (isDevelopment) {
        // 개발 환경에서는 테스트 알림
        await browserNotificationService.notifyPurchaseRequest(
          '테스트 부품',
          '테스트 사용자',
          'high',
          'test-123'
        );
        setAlertMessage('🔔 테스트 알림이 발송되었습니다!');
      } else {
        // 운영 환경에서는 샘플 알림
        await browserNotificationService.showNotification(
          '📋 알림 확인',
          {
            body: '브라우저 알림이 정상적으로 작동하고 있습니다.',
            tag: 'notification-check'
          }
        );
        setAlertMessage('🔔 알림이 정상적으로 작동합니다!');
      }
      
      setAlertSeverity('success');
      setShowAlert(true);
    } catch (error) {
      console.error('알림 테스트 실패:', error);
      setAlertMessage('알림 테스트에 실패했습니다.');
      setAlertSeverity('error');
      setShowAlert(true);
    }
  };

  const dismissCard = () => {
    setIsCardDismissed(true);
  };

  const dismissSuccessCard = () => {
    setShowSuccessCard(false);
  };

  // 브라우저가 알림을 지원하지 않는 경우
  if (!('Notification' in window)) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2">
          현재 브라우저는 데스크톱 알림을 지원하지 않습니다.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      {/* 권한 요청 알림 */}
      <Collapse in={permission === 'default' && !isCardDismissed}>
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={requestPermission}
                startIcon={<NotificationsIcon />}
              >
                허용하기
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={dismissCard}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              실시간 알림 받기
            </Typography>
            <Typography variant="body2">
              중요한 구매 요청과 업무 알림을 놓치지 마세요!
            </Typography>
          </Box>
        </Alert>
      </Collapse>

      {/* 권한 허용 성공 상태 */}
      <Collapse in={permission === 'granted' && showSuccessCard}>
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                size="small" 
                onClick={testNotification}
                startIcon={isDevelopment ? undefined : <SettingsIcon />}
              >
                {isDevelopment ? '테스트' : '확인'}
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={dismissSuccessCard}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                브라우저 알림이 활성화되었습니다
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isDevelopment 
                  ? '테스트 버튼으로 알림을 확인해보세요.' 
                  : '이제 중요한 업무 알림을 실시간으로 받을 수 있습니다.'
                }
              </Typography>
            </Box>
          </Box>
        </Alert>
      </Collapse>

      {/* 권한 거부 상태 */}
      <Collapse in={permission === 'denied' && !isCardDismissed}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={dismissCard}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsOffIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                브라우저 알림이 차단되었습니다
              </Typography>
              <Typography variant="caption" color="text.secondary">
                브라우저 설정에서 알림을 허용하거나 주소창의 🔒 아이콘을 클릭하세요.
              </Typography>
            </Box>
          </Box>
        </Alert>
      </Collapse>

      {/* 결과 메시지 스낵바 */}
      <Snackbar
        open={showAlert}
        autoHideDuration={4000}
        onClose={() => setShowAlert(false)}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setShowAlert(false)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationPermission; 