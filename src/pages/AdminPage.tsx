import React from 'react';
import { Typography, Box } from '@mui/material';

const AdminPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        관리자
      </Typography>
      <Typography>
        관리자 기능이 여기에 구현됩니다.
      </Typography>
    </Box>
  );
};

export default AdminPage; 