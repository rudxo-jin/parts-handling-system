import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { NOTIFICATION_TEMPLATES } from '../types/notification';
import { telegramService } from '../services/telegramService';
import { emailService } from '../services/emailService';

const NotificationTest: React.FC = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState('');

  // 테스트 데이터
  const [testData, setTestData] = useState({
    templateId: 'purchase_request_created',
    recipientPhone: '010-1234-5678',
    recipientName: userProfile?.name || '관리자',
    recipientEmail: userProfile?.email || 'kt9411@naver.com',
    partName: '테스트 부품 (네이버 메일 연동)',
    requestorName: userProfile?.name || '테스트 요청자',
    urgentReason: '네이버 메일 연동 테스트',
  });

  // 개별 알림 테스트
  const testSingleNotification = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      const template = NOTIFICATION_TEMPLATES.find(t => t.id === testData.templateId);
      if (!template) {
        setError('선택된 템플릿을 찾을 수 없습니다.');
        return;
      }

      // 템플릿에 맞는 변수 생성
      const variables: Record<string, string> = {};
      template.variables.forEach(variable => {
        switch (variable) {
          case 'requestorName':
            variables[variable] = testData.requestorName;
            break;
          case 'partName':
            variables[variable] = testData.partName;
            break;
          case 'requestDate':
            variables[variable] = new Date().toLocaleDateString('ko-KR');
            break;
          case 'importance':
            variables[variable] = '🚨 긴급';
            break;
          case 'actionUrl':
            variables[variable] = `${window.location.origin}/purchase-requests/test-123`;
            break;
          case 'requestId':
            variables[variable] = 'TEST-' + Date.now();
            break;
          case 'requestorPhone':
            variables[variable] = testData.recipientPhone;
            break;
          case 'urgentReason':
            variables[variable] = testData.urgentReason;
            break;
          case 'expectedDate':
            variables[variable] = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR');
            break;
          case 'quantity':
            variables[variable] = '10';
            break;
          case 'branchName':
            variables[variable] = '테스트 지점';
            break;
          case 'overdueDays':
            variables[variable] = '3';
            break;
          case 'currentStatus':
            variables[variable] = '이카운트 등록';
            break;
          default:
            variables[variable] = `테스트 ${variable}`;
        }
      });

      console.log('🔔 알림 테스트 시작:', {
        templateId: testData.templateId,
        recipientPhone: testData.recipientPhone,
        recipientName: testData.recipientName,
        variables
      });

      const notificationResult = await notificationService.sendKakaoNotification(
        testData.templateId,
        testData.recipientPhone,
        testData.recipientName,
        variables,
        'purchase_request',
        'test-request-id'
      );

      if (notificationResult.success) {
        setResult(`✅ 알림 발송 성공!\n메시지 ID: ${notificationResult.messageId}\n수신자: ${testData.recipientName} (${testData.recipientPhone})`);
      } else {
        setError(`❌ 알림 발송 실패: ${notificationResult.errorMessage}`);
      }

    } catch (error: any) {
      console.error('알림 테스트 실패:', error);
      setError(`알림 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 구매 요청 생성 알림 테스트
  const testPurchaseRequestNotification = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('📋 구매 요청 생성 알림 테스트 시작');

      // 물류팀 사용자 조회 (실제 DB에서)
      const logisticsUsers = await notificationService.getUsersByRole('logistics');
      
      if (logisticsUsers.length === 0) {
        // 테스트용 사용자 생성
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const testUsers = [{
          phone: testData.recipientPhone,
          name: testData.recipientName,
          userId: 'test-user-id'
        }];

        await notificationService.notifyPurchaseRequestCreated(
          'test-request-' + Date.now(),
          testData.requestorName,
          testData.partName,
          'urgent',
          'test-user-id'
        );

        setResult(`✅ 구매 요청 생성 알림 발송 완료!\n테스트 사용자: ${testData.recipientName} (${testData.recipientPhone})`);
      } else {
        await notificationService.notifyPurchaseRequestCreated(
          'test-request-' + Date.now(),
          testData.requestorName,
          testData.partName,
          'urgent',
          'test-user-id'
        );

        setResult(`✅ 구매 요청 생성 알림 발송 완료!\n물류팀 ${logisticsUsers.length}명에게 발송`);
      }

    } catch (error: any) {
      console.error('구매 요청 알림 테스트 실패:', error);
      setError(`구매 요청 알림 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 긴급 요청 알림 테스트
  const testUrgentNotification = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('🚨 긴급 요청 알림 테스트 시작');

      const testUsers = [{
        phone: testData.recipientPhone,
        name: testData.recipientName,
        userId: 'test-user-id'
      }];

      await notificationService.notifyUrgentRequest(
        'urgent-test-' + Date.now(),
        testData.requestorName,
        testData.recipientPhone,
        testData.partName,
        testData.urgentReason,
        testUsers
      );

      setResult(`🚨 긴급 요청 알림 발송 완료!\n수신자: ${testData.recipientName} (${testData.recipientPhone})`);

    } catch (error: any) {
      console.error('긴급 요청 알림 테스트 실패:', error);
      setError(`긴급 요청 알림 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 텔레그램 알림 테스트
  const testTelegramNotification = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('📱 텔레그램 알림 테스트 시작');

      const telegramResult = await telegramService.notifyPurchaseRequest(
        testData.requestorName,
        testData.partName,
        'high',
        'telegram-test-' + Date.now()
      );

      if (telegramResult.success) {
        setResult(`✅ 텔레그램 알림 발송 성공!\n메시지 ID: ${telegramResult.messageId}`);
      } else {
        setError(`❌ 텔레그램 알림 발송 실패: ${telegramResult.error}`);
      }

    } catch (error: any) {
      console.error('텔레그램 알림 테스트 실패:', error);
      setError(`텔레그램 알림 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 텔레그램 봇 상태 확인
  const checkTelegramBot = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('🤖 텔레그램 봇 상태 확인 시작');

      const status = await telegramService.checkBotStatus();

      if (status.success) {
        if (status.simulation) {
          setResult(`📱 텔레그램 봇 시뮬레이션 모드\n${status.message}`);
        } else {
          setResult(`✅ 텔레그램 봇 연결 성공!\n봇 이름: ${status.botInfo?.first_name}\n사용자명: @${status.botInfo?.username}`);
        }
      } else {
        setError(`❌ 텔레그램 봇 연결 실패: ${status.error}`);
      }

    } catch (error: any) {
      console.error('텔레그램 봇 상태 확인 실패:', error);
      setError(`텔레그램 봇 상태 확인 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 알림 테스트
  const testEmailNotification = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('📧 이메일 알림 테스트 시작');

      const emailResult = await emailService.notifyPurchaseRequestCreated(
        testData.recipientEmail,
        testData.recipientName,
        testData.requestorName,
        testData.partName,
        'high',
        'email-test-' + Date.now()
      );

      if (emailResult.success) {
        setResult(`✅ 이메일 알림 발송 성공!\n메시지 ID: ${(emailResult as any).messageId}\n수신자: ${testData.recipientEmail}`);
      } else {
        setError(`❌ 이메일 알림 발송 실패: ${(emailResult as any).error}`);
      }

    } catch (error: any) {
      console.error('이메일 알림 테스트 실패:', error);
      setError(`이메일 알림 테스트 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 이메일 서비스 상태 확인
  const checkEmailService = async () => {
    try {
      setLoading(true);
      setError('');
      setResult('');

      console.log('📧 이메일 서비스 상태 확인 시작');

      const status = await emailService.checkEmailService();

      if (status.success) {
        if (status.simulation) {
          setResult(`📧 이메일 서비스 시뮬레이션 모드\n${status.message}`);
        } else {
          setResult(`✅ 이메일 서비스 연결 성공!\n서비스 ID: ${status.serviceId}\n템플릿 ID: ${status.templateId}`);
        }
      } else {
        setError(`❌ 이메일 서비스 연결 실패: ${status.error}`);
      }

    } catch (error: any) {
      console.error('이메일 서비스 상태 확인 실패:', error);
      setError(`이메일 서비스 상태 확인 중 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 권한 체크
  if (userProfile?.role !== 'admin') {
    return (
      <Box>
        <Alert severity="error">
          이 페이지는 관리자만 접근할 수 있습니다.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        🔔 알림 시스템 테스트
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        카카오톡 알림 시스템의 동작을 테스트할 수 있습니다. 개발 환경에서는 실제 카카오톡이 발송되지 않고 시뮬레이션됩니다.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setResult('')}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{result}</pre>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* 테스트 설정 */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                테스트 설정
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  label="수신자 전화번호"
                  value={testData.recipientPhone}
                  onChange={(e) => setTestData({ ...testData, recipientPhone: e.target.value })}
                  placeholder="010-1234-5678"
                />

                <TextField
                  fullWidth
                  label="수신자 이름"
                  value={testData.recipientName}
                  onChange={(e) => setTestData({ ...testData, recipientName: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="수신자 이메일"
                  value={testData.recipientEmail}
                  onChange={(e) => setTestData({ ...testData, recipientEmail: e.target.value })}
                  placeholder="test@company.com"
                />

                <TextField
                  fullWidth
                  label="부품명"
                  value={testData.partName}
                  onChange={(e) => setTestData({ ...testData, partName: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="요청자명"
                  value={testData.requestorName}
                  onChange={(e) => setTestData({ ...testData, requestorName: e.target.value })}
                />

                <TextField
                  fullWidth
                  label="긴급 사유"
                  value={testData.urgentReason}
                  onChange={(e) => setTestData({ ...testData, urgentReason: e.target.value })}
                  multiline
                  rows={2}
                />

                <FormControl fullWidth>
                  <InputLabel>알림 템플릿</InputLabel>
                  <Select
                    value={testData.templateId}
                    onChange={(e) => setTestData({ ...testData, templateId: e.target.value })}
                    label="알림 템플릿"
                  >
                    {NOTIFICATION_TEMPLATES.map(template => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 테스트 실행 */}
        <Box sx={{ flex: '1 1 400px', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                테스트 실행
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={testSingleNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  개별 알림 테스트
                </Button>

                <Divider />

                <Button
                  variant="outlined"
                  color="success"
                  onClick={testEmailNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📧 네이버 메일 알림 테스트
                </Button>

                <Button
                  variant="outlined"
                  color="info"
                  onClick={checkEmailService}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📧 이메일 서비스 상태 확인
                </Button>

                <Divider />

                <Button
                  variant="outlined"
                  color="primary"
                  onClick={testPurchaseRequestNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📋 구매 요청 생성 알림
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={testUrgentNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  🚨 긴급 요청 알림
                </Button>

                <Divider />

                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  📱 텔레그램 알림 테스트
                </Typography>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={checkTelegramBot}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  🤖 텔레그램 봇 상태 확인
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={testTelegramNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📱 텔레그램 알림 테스트
                </Button>

                <Divider />

                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                  📧 이메일 알림 테스트
                </Typography>

                <Button
                  variant="outlined"
                  color="success"
                  onClick={checkEmailService}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📧 이메일 서비스 상태 확인
                </Button>

                <Button
                  variant="outlined"
                  color="success"
                  onClick={testEmailNotification}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : undefined}
                  fullWidth
                >
                  📧 이메일 알림 테스트
                </Button>

                <Divider />

                <Typography variant="body2" color="text.secondary">
                  💡 개발 환경에서는 실제 카카오톡이 발송되지 않고, 콘솔에서 시뮬레이션 결과를 확인할 수 있습니다.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 템플릿 미리보기 */}
      <Box sx={{ width: '100%', mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              선택된 템플릿 미리보기
            </Typography>

            {(() => {
              const selectedTemplate = NOTIFICATION_TEMPLATES.find(t => t.id === testData.templateId);
              if (!selectedTemplate) return null;

              return (
                <Box>
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                    {selectedTemplate.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    대상: {selectedTemplate.targetRole === 'all' ? '전체' : 
                           selectedTemplate.targetRole === 'operations' ? '운영사업본부' :
                           selectedTemplate.targetRole === 'logistics' ? '유통사업본부' : '관리자'}
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.875rem'
                  }}>
                    {selectedTemplate.template}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    사용 변수: {selectedTemplate.variables.join(', ')}
                  </Typography>
                </Box>
              );
            })()}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default NotificationTest; 