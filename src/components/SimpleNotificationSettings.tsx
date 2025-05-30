import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  Button,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const SimpleNotificationSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // 알림 채널
    enableKakaoNotifications: true,
    enableBrowserNotifications: true,
    enableTelegramNotifications: true,
    enableEmailNotifications: true,
    
    // 운영사업본부 전용 설정
    operationsReceiveAll: true,
    onlyMyRequests: false,
    allRequestsInMyDepartment: false,
    
    // 알림 유형
    purchaseRequestCreated: true,
    ecountRegistrationNeeded: true,
    purchaseOrderCompleted: true,
    warehouseReceived: true,
    branchDispatchReady: true,
    urgentRequest: true,
    overdueRequest: true,
    systemMaintenance: true,
    
    // 조용한 시간
    quietHoursEnabled: false
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      // 설정 저장 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('알림 설정이 저장되었습니다.');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage('설정 저장에 실패했습니다.');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            알림 설정
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </Button>
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {/* 알림 채널 설정 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📱 알림 채널 설정
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableKakaoNotifications}
                  onChange={(e) => handleChange('enableKakaoNotifications', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  카카오톡 알림
                  <Chip label="유료" size="small" color="warning" />
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableBrowserNotifications}
                  onChange={(e) => handleChange('enableBrowserNotifications', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  브라우저 알림
                  <Chip label="무료" size="small" color="success" />
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableTelegramNotifications}
                  onChange={(e) => handleChange('enableTelegramNotifications', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  텔레그램 알림
                  <Chip label="무료" size="small" color="success" />
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableEmailNotifications}
                  onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  이메일 알림
                  <Chip label="무료" size="small" color="success" />
                </Box>
              }
            />
          </Box>
        </CardContent>
      </Card>

      {/* 운영사업본부 전용 설정 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 운영사업본부 전용 설정
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            운영사업본부는 모든 과정의 알림을 받을 수 있지만, 개인 설정으로 조절할 수 있습니다.
          </Alert>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.operationsReceiveAll}
                  onChange={(e) => handleChange('operationsReceiveAll', e.target.checked)}
                />
              }
              label="모든 부품 요청 알림 받기"
            />
            
            {!settings.operationsReceiveAll && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.onlyMyRequests}
                      onChange={(e) => handleChange('onlyMyRequests', e.target.checked)}
                    />
                  }
                  label="내가 요청한 건만 받기"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allRequestsInMyDepartment}
                      onChange={(e) => handleChange('allRequestsInMyDepartment', e.target.checked)}
                    />
                  }
                  label="우리 부서 요청 모두 받기"
                />
              </Box>
            )}
          </FormGroup>
        </CardContent>
      </Card>

      {/* 알림 유형별 설정 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔔 알림 유형별 설정
          </Typography>
          
          <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
            📋 부품 요청 과정
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.purchaseRequestCreated}
                  onChange={(e) => handleChange('purchaseRequestCreated', e.target.checked)}
                />
              }
              label="구매 요청 생성"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.ecountRegistrationNeeded}
                  onChange={(e) => handleChange('ecountRegistrationNeeded', e.target.checked)}
                />
              }
              label="이카운트 등록 필요"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.purchaseOrderCompleted}
                  onChange={(e) => handleChange('purchaseOrderCompleted', e.target.checked)}
                />
              }
              label="발주 완료"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.warehouseReceived}
                  onChange={(e) => handleChange('warehouseReceived', e.target.checked)}
                />
              }
              label="입고 완료"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.branchDispatchReady}
                  onChange={(e) => handleChange('branchDispatchReady', e.target.checked)}
                />
              }
              label="지점 출고 준비"
            />
          </FormGroup>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" color="warning.main" gutterBottom>
            ⚠️ 중요 알림
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.urgentRequest}
                  onChange={(e) => handleChange('urgentRequest', e.target.checked)}
                />
              }
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  긴급 요청
                  <Chip label="권장: 항상 ON" size="small" color="error" />
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.overdueRequest}
                  onChange={(e) => handleChange('overdueRequest', e.target.checked)}
                />
              }
              label="지연 요청 경고"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.systemMaintenance}
                  onChange={(e) => handleChange('systemMaintenance', e.target.checked)}
                />
              }
              label="시스템 점검"
            />
          </FormGroup>
        </CardContent>
      </Card>

      {/* 조용한 시간 설정 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🌙 조용한 시간 설정
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHoursEnabled}
                onChange={(e) => handleChange('quietHoursEnabled', e.target.checked)}
              />
            }
            label="조용한 시간 활성화 (22:00 ~ 08:00)"
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            조용한 시간 동안에는 긴급 알림을 제외한 모든 알림이 차단됩니다.
          </Alert>
        </CardContent>
      </Card>

      {/* 도움말 */}
      <Alert severity="info">
        <Typography variant="subtitle2" gutterBottom>
          💡 알림 설정 도움말
        </Typography>
        <Typography variant="body2">
          • <strong>운영사업본부</strong>: 모든 부품 요청 과정의 알림을 받을 수 있습니다.<br/>
          • <strong>유통사업본부</strong>: 구매, 입고, 출고 관련 알림을 받습니다.<br/>
          • <strong>긴급 알림</strong>은 조용한 시간에도 발송됩니다.<br/>
          • 무료 알림(브라우저, 텔레그램, 이메일)을 활용하여 비용을 절약하세요.
        </Typography>
      </Alert>
    </Box>
  );
};

export default SimpleNotificationSettings; 