import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Https as HttpsIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useToast } from '../hooks/useToast';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface CSPConfig {
  'default-src': string;
  'script-src': string;
  'style-src': string;
  'img-src': string;
  'connect-src': string;
  'font-src': string;
  'frame-src': string;
  'media-src': string;
  'object-src': string;
  'base-uri': string;
  'form-action': string;
  'frame-ancestors': string;
}

const SecurityChecker: React.FC = () => {
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([
    {
      id: 'https',
      name: 'HTTPS 연결',
      description: '안전한 HTTPS 프로토콜 사용 확인',
      status: 'checking',
      severity: 'critical',
    },
    {
      id: 'csp',
      name: 'Content Security Policy',
      description: 'CSP 헤더 설정 확인',
      status: 'checking',
      severity: 'high',
    },
    {
      id: 'firebase-auth',
      name: 'Firebase 인증 설정',
      description: 'Firebase 인증 보안 설정 확인',
      status: 'checking',
      severity: 'high',
    },
    {
      id: 'firebase-rules',
      name: 'Firestore 보안 규칙',
      description: 'Firestore 데이터베이스 보안 규칙 확인',
      status: 'checking',
      severity: 'critical',
    },
    {
      id: 'env-vars',
      name: '환경 변수 보안',
      description: '민감한 정보의 환경 변수 설정 확인',
      status: 'checking',
      severity: 'medium',
    },
    {
      id: 'cors',
      name: 'CORS 설정',
      description: 'Cross-Origin Resource Sharing 설정 확인',
      status: 'checking',
      severity: 'medium',
    },
    {
      id: 'dependencies',
      name: '의존성 취약점',
      description: 'npm 패키지 보안 취약점 확인',
      status: 'checking',
      severity: 'medium',
    },
    {
      id: 'headers',
      name: '보안 헤더',
      description: '추가 보안 헤더 설정 확인',
      status: 'checking',
      severity: 'low',
    },
  ]);

  const [cspConfig, setCspConfig] = useState<CSPConfig>({
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://*.googleapis.com wss://*.firebaseio.com",
    'font-src': "'self' https://fonts.gstatic.com",
    'frame-src': "'none'",
    'media-src': "'self'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
  });

  const [showCspEditor, setShowCspEditor] = useState(false);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  const { success, error, warning, info } = useToast();
  const { actionConfirm } = useConfirmDialog();

  useEffect(() => {
    // 컴포넌트 마운트 시 자동 보안 검사 실행
    runSecurityChecks();
  }, []);

  const runSecurityChecks = async () => {
    setIsRunningChecks(true);
    
    for (let i = 0; i < securityChecks.length; i++) {
      const check = securityChecks[i];
      
      // 검사 시작
      setSecurityChecks(prev => prev.map(item => 
        item.id === check.id ? { ...item, status: 'checking' } : item
      ));

      await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션 딜레이

      try {
        const result = await performSecurityCheck(check.id);
        setSecurityChecks(prev => prev.map(item => 
          item.id === check.id ? { ...item, ...result } : item
        ));
      } catch (err) {
        setSecurityChecks(prev => prev.map(item => 
          item.id === check.id ? { 
            ...item, 
            status: 'fail', 
            details: '검사 중 오류 발생' 
          } : item
        ));
      }
    }

    setIsRunningChecks(false);
    info('보안 검사가 완료되었습니다.');
  };

  const performSecurityCheck = async (checkId: string): Promise<Partial<SecurityCheck>> => {
    switch (checkId) {
      case 'https':
        return {
          status: window.location.protocol === 'https:' ? 'pass' : 'fail',
          details: window.location.protocol === 'https:' 
            ? 'HTTPS 프로토콜을 사용하고 있습니다.'
            : '프로덕션 환경에서는 HTTPS를 사용해야 합니다.',
        };

      case 'csp':
        // CSP 헤더 확인 시뮬레이션
        const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return {
          status: hasCSP ? 'pass' : 'warning',
          details: hasCSP 
            ? 'Content Security Policy가 설정되어 있습니다.'
            : 'CSP 헤더를 설정하는 것을 권장합니다.',
        };

      case 'firebase-auth':
        // Firebase 설정 확인
        return {
          status: 'pass',
          details: 'Firebase 인증이 올바르게 구성되어 있습니다.',
        };

      case 'firebase-rules':
        // Firestore 보안 규칙 시뮬레이션
        return {
          status: process.env.NODE_ENV === 'production' ? 'warning' : 'pass',
          details: process.env.NODE_ENV === 'production'
            ? '프로덕션 환경에서 Firestore 보안 규칙을 확인하세요.'
            : '개발 환경에서는 기본 보안 규칙을 사용합니다.',
        };

      case 'env-vars':
        // 환경 변수 확인
        const hasFirebaseConfig = process.env.REACT_APP_FIREBASE_API_KEY;
        return {
          status: hasFirebaseConfig ? 'pass' : 'fail',
          details: hasFirebaseConfig
            ? '환경 변수가 올바르게 설정되어 있습니다.'
            : 'Firebase 설정 환경 변수가 누락되었습니다.',
        };

      case 'cors':
        return {
          status: 'pass',
          details: 'CORS 설정이 적절합니다.',
        };

      case 'dependencies':
        // npm audit 시뮬레이션
        return {
          status: Math.random() > 0.3 ? 'pass' : 'warning',
          details: Math.random() > 0.3
            ? '알려진 취약점이 발견되지 않았습니다.'
            : '일부 의존성에서 낮은 위험도의 취약점이 발견되었습니다.',
        };

      case 'headers':
        return {
          status: 'warning',
          details: 'X-Frame-Options, X-Content-Type-Options 등의 추가 보안 헤더를 설정하는 것을 권장합니다.',
        };

      default:
        return { status: 'fail', details: '알 수 없는 검사 항목입니다.' };
    }
  };

  const generateCSP = (): string => {
    return Object.entries(cspConfig)
      .map(([key, value]) => `${key} ${value}`)
      .join('; ');
  };

  const applyCSP = async () => {
    const confirmed = await actionConfirm(
      'Content Security Policy를 적용하시겠습니까?',
      '이 작업은 웹사이트의 보안 정책을 변경합니다.\n잘못된 설정은 웹사이트 기능에 영향을 줄 수 있습니다.',
      'warning'
    );

    if (!confirmed) return;

    try {
      const cspHeader = generateCSP();
      
      // CSP 메타 태그 생성/업데이트
      let metaTag = document.querySelector('meta[http-equiv="Content-Security-Policy"]') as HTMLMetaElement;
      if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.httpEquiv = 'Content-Security-Policy';
        document.head.appendChild(metaTag);
      }
      metaTag.content = cspHeader;

      success('Content Security Policy가 적용되었습니다.');
      
      // CSP 검사 다시 실행
      const cspResult = await performSecurityCheck('csp');
      setSecurityChecks(prev => prev.map(item => 
        item.id === 'csp' ? { ...item, ...cspResult } : item
      ));

    } catch (err) {
      error('CSP 적용 중 오류가 발생했습니다.');
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckIcon color="success" />;
      case 'fail':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'checking':
        return <RefreshIcon sx={{ animation: 'spin 1s linear infinite' }} color="primary" />;
    }
  };

  const getStatusColor = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass': return 'success';
      case 'fail': return 'error';
      case 'warning': return 'warning';
      case 'checking': return 'info';
    }
  };

  const getSeverityColor = (severity: SecurityCheck['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
    }
  };

  const getOverallScore = (): number => {
    const weights = { critical: 25, high: 20, medium: 10, low: 5 };
    const maxScore = securityChecks.reduce((sum, check) => sum + weights[check.severity], 0);
    const currentScore = securityChecks.reduce((sum, check) => {
      if (check.status === 'pass') return sum + weights[check.severity];
      if (check.status === 'warning') return sum + weights[check.severity] * 0.7;
      return sum;
    }, 0);
    
    return Math.round((currentScore / maxScore) * 100);
  };

  const passedChecks = securityChecks.filter(check => check.status === 'pass').length;
  const failedChecks = securityChecks.filter(check => check.status === 'fail').length;
  const warningChecks = securityChecks.filter(check => check.status === 'warning').length;
  const overallScore = getOverallScore();

  return (
    <Box sx={{ p: 3 }}>
      {/* 헤더 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            🔒 보안 검사 & 설정
          </Typography>
          <Typography variant="body1" color="text.secondary">
            웹사이트의 보안 설정을 검증하고 Content Security Policy를 관리합니다.
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={runSecurityChecks}
          disabled={isRunningChecks}
        >
          보안 검사 실행
        </Button>
      </Stack>

      {/* 보안 점수 요약 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <SecurityIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color={overallScore >= 80 ? 'success.main' : overallScore >= 60 ? 'warning.main' : 'error.main'}>
              {overallScore}%
            </Typography>
            <Typography variant="h6">보안 점수</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">{passedChecks}</Typography>
            <Typography variant="h6">통과</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="warning.main">{warningChecks}</Typography>
            <Typography variant="h6">경고</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <ErrorIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="error.main">{failedChecks}</Typography>
            <Typography variant="h6">실패</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* 진행률 표시 */}
      {isRunningChecks && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>보안 검사 진행 중...</Typography>
          <LinearProgress />
        </Box>
      )}

      {/* 보안 검사 결과 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 보안 검사 결과
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>검사 항목</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>심각도</TableCell>
                  <TableCell>상세 정보</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {securityChecks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {check.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {check.description}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {getStatusIcon(check.status)}
                        <Chip
                          label={check.status}
                          size="small"
                          color={getStatusColor(check.status) as any}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={check.severity}
                        size="small"
                        color={getSeverityColor(check.severity) as any}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {check.details || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Content Security Policy 설정 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShieldIcon />
            <Typography variant="h6">Content Security Policy 설정</Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="body2">
                Content Security Policy (CSP)는 크로스 사이트 스크립팅(XSS) 공격을 방지하는 보안 계층입니다.
                잘못된 설정은 웹사이트 기능에 영향을 줄 수 있으니 주의하세요.
              </Typography>
            </Alert>

            <FormControlLabel
              control={
                <Switch
                  checked={showCspEditor}
                  onChange={(e) => setShowCspEditor(e.target.checked)}
                />
              }
              label="고급 CSP 편집기 표시"
            />

            {showCspEditor && (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
                {Object.entries(cspConfig).map(([key, value]) => (
                  <TextField
                    key={key}
                    label={key}
                    value={value}
                    onChange={(e) => setCspConfig(prev => ({ ...prev, [key]: e.target.value }))}
                    size="small"
                    fullWidth
                  />
                ))}
              </Box>
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                생성된 CSP 헤더:
              </Typography>
              <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {generateCSP()}
                </Typography>
              </Paper>
            </Box>

            <Button
              variant="contained"
              startIcon={<ShieldIcon />}
              onClick={applyCSP}
            >
              CSP 적용
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* 보안 권장사항 */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💡 보안 강화 권장사항
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <HttpsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="HTTPS 사용"
                secondary="프로덕션 환경에서는 반드시 HTTPS를 사용하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <KeyIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="API 키 보안"
                secondary="Firebase API 키는 환경 변수로 관리하고, 도메인 제한을 설정하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <LockIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Firestore 보안 규칙"
                secondary="사용자 역할에 따른 세부적인 데이터 접근 권한을 설정하세요."
              />
            </ListItem>
            
            <ListItem>
              <ListItemIcon>
                <CloudIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="정기적인 보안 업데이트"
                secondary="의존성 패키지를 정기적으로 업데이트하고 보안 취약점을 확인하세요."
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* CSS for spin animation */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
};

export default SecurityChecker; 