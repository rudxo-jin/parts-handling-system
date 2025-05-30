import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Alert,
  Button,
  TextField,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
  Info as InfoIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { NotificationSettings } from '../types/notification';

const NotificationSettingsComponent: React.FC = () => {
  const { userProfile: user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 기본 설정값
  const defaultSettings: NotificationSettings = {
    userId: user?.id || '',
    phone: '',
    enableKakaoNotifications: true,
    enableBrowserNotifications: true,
    enableTelegramNotifications: true,
    enableEmailNotifications: true,
    notificationTypes: {
      purchaseRequestCreated: true,
      ecountRegistrationNeeded: true,
      purchaseOrderCompleted: true,
      warehouseReceived: true,
      branchDispatchReady: true,
      urgentRequest: true,
      overdueRequest: true,
      systemMaintenance: true,
      onlyMyRequests: false,
      allRequestsInMyDepartment: user?.role === 'operations'
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    },
    roleBasedFiltering: {
      enabled: user?.role === 'operations',
      operationsReceiveAll: user?.role === 'operations',
      logisticsReceiveAll: user?.role === 'logistics'
    }
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const userSettings = await notificationService.getUserNotificationSettings(user.id);
      setSettings(userSettings || defaultSettings);
    } catch (error) {
      console.error('설정 로드 실패:', error);
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user?.id) return;

    setSaving(true);
    try {
      // Firebase에 설정 저장 (실제 구현 필요)
      await new Promise(resolve => setTimeout(resolve, 1000)); // 시뮬레이션
      
      setMessage({ type: 'success', text: '알림 설정이 저장되었습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setMessage({ type: 'error', text: '설정 저장에 실패했습니다.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [key]: value
    });
  };

  const handleNotificationTypeChange = (type: keyof NotificationSettings['notificationTypes'], enabled: boolean) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      notificationTypes: {
        ...settings.notificationTypes,
        [type]: enabled
      }
    });
  };

  const handleQuietHoursChange = (key: keyof NotificationSettings['quietHours'], value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      quietHours: {
        ...settings.quietHours,
        [key]: value
      }
    });
  };

  const handleRoleFilteringChange = (key: keyof NotificationSettings['roleBasedFiltering'], value: boolean) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      roleBasedFiltering: {
        ...settings.roleBasedFiltering,
        [key]: value
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>설정을 불러오는 중...</Typography>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        설정을 불러올 수 없습니다. 페이지를 새로고침해주세요.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <NotificationsIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            알림 설정
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSettings}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Box>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {/* 알림 채널 설정 */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📱 알림 채널 설정
          </Typography>
                     <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={2}>
             <FormControlLabel
               control={
                 <Switch
                   checked={settings.enableKakaoNotifications}
                   onChange={(e) => handleSettingChange('enableKakaoNotifications', e.target.checked)}
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
                   onChange={(e) => handleSettingChange('enableBrowserNotifications', e.target.checked)}
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
                   onChange={(e) => handleSettingChange('enableTelegramNotifications', e.target.checked)}
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
                   onChange={(e) => handleSettingChange('enableEmailNotifications', e.target.checked)}
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

      {/* 역할별 필터링 설정 (운영사업본부용) */}
      {user?.role === 'operations' && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Typography variant="h6">
                🎯 운영사업본부 전용 설정
              </Typography>
              <Tooltip title="운영사업본부는 모든 과정의 알림을 받을 수 있지만, 개인 설정으로 조절할 수 있습니다.">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.roleBasedFiltering.operationsReceiveAll}
                    onChange={(e) => handleRoleFilteringChange('operationsReceiveAll', e.target.checked)}
                  />
                }
                label="모든 부품 요청 알림 받기"
              />
              
              {!settings.roleBasedFiltering.operationsReceiveAll && (
                <Box sx={{ ml: 4, mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificationTypes.onlyMyRequests}
                        onChange={(e) => handleNotificationTypeChange('onlyMyRequests', e.target.checked)}
                      />
                    }
                    label="내가 요청한 건만 받기"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notificationTypes.allRequestsInMyDepartment}
                        onChange={(e) => handleNotificationTypeChange('allRequestsInMyDepartment', e.target.checked)}
                      />
                    }
                    label="우리 부서 요청 모두 받기"
                  />
                </Box>
              )}
            </FormGroup>
          </CardContent>
        </Card>
      )}

      {/* 알림 유형별 설정 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">🔔 알림 유형별 설정</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={2}>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📋 부품 요청 과정
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.purchaseRequestCreated}
                      onChange={(e) => handleNotificationTypeChange('purchaseRequestCreated', e.target.checked)}
                    />
                  }
                  label="구매 요청 생성"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.ecountRegistrationNeeded}
                      onChange={(e) => handleNotificationTypeChange('ecountRegistrationNeeded', e.target.checked)}
                    />
                  }
                  label="이카운트 등록 필요"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.purchaseOrderCompleted}
                      onChange={(e) => handleNotificationTypeChange('purchaseOrderCompleted', e.target.checked)}
                    />
                  }
                  label="발주 완료"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.warehouseReceived}
                      onChange={(e) => handleNotificationTypeChange('warehouseReceived', e.target.checked)}
                    />
                  }
                  label="입고 완료"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.branchDispatchReady}
                      onChange={(e) => handleNotificationTypeChange('branchDispatchReady', e.target.checked)}
                    />
                  }
                  label="지점 출고 준비"
                />
              </FormGroup>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                ⚠️ 중요 알림
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.urgentRequest}
                      onChange={(e) => handleNotificationTypeChange('urgentRequest', e.target.checked)}
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
                      checked={settings.notificationTypes.overdueRequest}
                      onChange={(e) => handleNotificationTypeChange('overdueRequest', e.target.checked)}
                    />
                  }
                  label="지연 요청 경고"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notificationTypes.systemMaintenance}
                      onChange={(e) => handleNotificationTypeChange('systemMaintenance', e.target.checked)}
                    />
                  }
                  label="시스템 점검"
                />
              </FormGroup>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* 조용한 시간 설정 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">🌙 조용한 시간 설정</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={settings.quietHours.enabled}
                onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
              />
            }
            label="조용한 시간 활성화"
            sx={{ mb: 2 }}
          />
          
          {settings.quietHours.enabled && (
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
              <TextField
                label="시작 시간"
                type="time"
                value={settings.quietHours.startTime}
                onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="종료 시간"
                type="time"
                value={settings.quietHours.endTime}
                onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            조용한 시간 동안에는 긴급 알림을 제외한 모든 알림이 차단됩니다.
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* 연락처 정보 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📞 연락처 정보
          </Typography>
          <TextField
            label="전화번호 (카카오톡용)"
            value={settings.phone}
            onChange={(e) => handleSettingChange('phone', e.target.value)}
            fullWidth
            placeholder="010-1234-5678"
            helperText="카카오톡 알림을 받으려면 전화번호가 필요합니다."
          />
        </CardContent>
      </Card>

      {/* 도움말 */}
      <Alert severity="info" sx={{ mt: 2 }}>
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

export default NotificationSettingsComponent; 