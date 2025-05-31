import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import {
  Build as BuildIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import AdminTools from './AdminTools';
import SimpleNotificationSettings from '../components/SimpleNotificationSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const AdminSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [tabValue, setTabValue] = useState(0);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        시스템 설정
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="시스템 설정 탭">
            <Tab 
              icon={<BuildIcon />} 
              label="데이터 관리" 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="알림 설정" 
              iconPosition="start"
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <AdminTools />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <SimpleNotificationSettings />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AdminSettings; 