import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Box,
} from '@mui/material';
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

const ConfirmDialog: React.FC = () => {
  const { dialog } = useConfirmDialog();

  const getIcon = () => {
    switch (dialog.type) {
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main', fontSize: 48 }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main', fontSize: 48 }} />;
      case 'success':
        return <SuccessIcon sx={{ color: 'success.main', fontSize: 48 }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ color: 'info.main', fontSize: 48 }} />;
    }
  };

  const getConfirmButtonColor = () => {
    switch (dialog.type) {
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'success':
        return 'success';
      case 'info':
      default:
        return 'primary';
    }
  };

  // 메시지에서 줄바꿈 처리
  const formatMessage = (message: string) => {
    return message.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < message.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <Dialog
      open={dialog.open}
      onClose={dialog.persistent ? undefined : dialog.onCancel}
      maxWidth={dialog.maxWidth || 'sm'}
      fullWidth
      disableEscapeKeyDown={dialog.persistent}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      {dialog.title && (
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {getIcon()}
            {dialog.title}
          </Box>
        </DialogTitle>
      )}
      
      <DialogContent sx={{ textAlign: 'center', pt: dialog.title ? 1 : 3 }}>
        {!dialog.title && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            {getIcon()}
          </Box>
        )}
        <DialogContentText
          sx={{
            fontSize: '1rem',
            color: 'text.primary',
            lineHeight: 1.6,
          }}
        >
          {formatMessage(dialog.message)}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 1 }}>
        <Button
          onClick={dialog.onCancel}
          variant="outlined"
          size="large"
          sx={{ minWidth: 100 }}
        >
          {dialog.cancelText || '취소'}
        </Button>
        <Button
          onClick={dialog.onConfirm}
          variant="contained"
          color={getConfirmButtonColor() as any}
          size="large"
          sx={{ minWidth: 100 }}
          autoFocus
        >
          {dialog.confirmText || '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog; 