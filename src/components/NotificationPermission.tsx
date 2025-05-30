import React, { useState, useEffect } from 'react';
import {
  Box,
  Alert,
  Button,
  Typography,
  Snackbar,
  IconButton,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { browserNotificationService } from '../services/browserNotificationService';

const NotificationPermission: React.FC = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

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
    }
  }, []);

  const requestPermission = async () => {
    try {
      const granted = await browserNotificationService.requestPermission();
      
      if (granted) {
        setPermission('granted');
        setAlertMessage('✅ 브라우저 알림이 활성화되었습니다!');
        setAlertSeverity('success');
        
        // 테스트 알림 표시
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
      await browserNotificationService.notifyPurchaseRequest(
        '테스트 부품',
        '테스트 사용자',
        'high',
        'test-123'
      );
      
      setAlertMessage('🔔 테스트 알림이 발송되었습니다!');
      setAlertSeverity('success');
      setShowAlert(true);
    } catch (error) {
      console.error('테스트 알림 실패:', error);
      setAlertMessage('테스트 알림 발송에 실패했습니다.');
      setAlertSeverity('error');
      setShowAlert(true);
    }
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
      {permission === 'default' && (
        <Alert 
          severity="info" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={requestPermission}
              startIcon={<NotificationsIcon />}
            >
              허용하기
            </Button>
          }
        >
          <Typography variant="body2">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                실시간 알림 받기
              </Typography>
              <Typography variant="body2">
                중요한 구매 요청과 업무 알림을 놓치지 마세요!
              </Typography>
            </Box>
          </Typography>
        </Alert>
      )}

      {/* 권한 상태 표시 */}
      {permission === 'granted' && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          action={
            <span>
              <Button 
                color="inherit" 
                size="small" 
                onClick={testNotification}
              >
                테스트
              </Button>
            </span>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            <Typography variant="body2">
              브라우저 알림이 활성화되었습니다.
            </Typography>
          </Box>
        </Alert>
      )}

      {permission === 'denied' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsOffIcon />
            <Box>
              <Typography variant="body2">
                <strong>브라우저 알림이 차단되었습니다.</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                브라우저 설정에서 알림을 허용해주세요.
              </Typography>
            </Box>
          </Box>
        </Alert>
      )}

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