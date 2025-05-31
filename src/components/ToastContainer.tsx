import React from 'react';
import {
  Box,
  Alert,
  AlertTitle,
  IconButton,
  Button,
  Slide,
  Stack,
  Portal,
} from '@mui/material';
import {
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useToast, ToastMessage } from '../hooks/useToast';

interface ToastItemProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
  onExecuteAction: (id: string, action: () => void) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove, onExecuteAction }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <SuccessIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverity = () => {
    switch (toast.type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  return (
    <Slide direction="left" in={true} mountOnEnter unmountOnExit>
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        variant="filled"
        sx={{
          mb: 1,
          minWidth: 300,
          maxWidth: 500,
          boxShadow: 3,
          '& .MuiAlert-action': {
            alignItems: 'flex-start',
            paddingTop: 0,
          },
        }}
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            {toast.action && (
              <Button
                size="small"
                variant="text"
                sx={{ 
                  color: 'inherit',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                onClick={() => onExecuteAction(toast.id, toast.action!.onClick)}
              >
                {toast.action.label}
              </Button>
            )}
            <IconButton
              size="small"
              sx={{ 
                color: 'inherit',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
              onClick={() => onRemove(toast.id)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        }
      >
        {toast.title && <AlertTitle>{toast.title}</AlertTitle>}
        {toast.message}
      </Alert>
    </Slide>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast, executeAction } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Box
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: (theme) => theme.zIndex.snackbar,
          pointerEvents: 'none',
        }}
      >
        <Stack spacing={1} sx={{ pointerEvents: 'auto' }}>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onRemove={removeToast}
              onExecuteAction={executeAction}
            />
          ))}
        </Stack>
      </Box>
    </Portal>
  );
};

export default ToastContainer; 