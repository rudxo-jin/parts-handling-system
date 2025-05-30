import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useActivityFeed } from '../hooks/useActivityFeed';
import { UserRole } from '../types';

interface ActivityFeedProps {
  userRole: UserRole | undefined;
  userId?: string;
  maxItems?: number;
  showHeader?: boolean;
  height?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  userRole,
  userId,
  maxItems = 8,
  showHeader = true,
  height = 400,
}) => {
  const { activities, loading, error } = useActivityFeed(userRole, userId, maxItems);

  const getActivityIcon = (entityType: string, action: string) => {
    switch (entityType) {
      case 'part':
        return <InventoryIcon fontSize="small" />;
      case 'purchase_request':
        if (action.includes('생성')) return <ShoppingCartIcon fontSize="small" />;
        if (action.includes('등록')) return <AssignmentIcon fontSize="small" />;
        if (action.includes('발주')) return <CheckCircleIcon fontSize="small" />;
        if (action.includes('입고')) return <LocalShippingIcon fontSize="small" />;
        if (action.includes('출고')) return <LocalShippingIcon fontSize="small" />;
        return <ShoppingCartIcon fontSize="small" />;
      case 'user':
        return <PeopleIcon fontSize="small" />;
      case 'branch':
        return <StoreIcon fontSize="small" />;
      default:
        return <AssignmentIcon fontSize="small" />;
    }
  };

  const getActivityColor = (importance?: string) => {
    switch (importance) {
      case 'urgent': return '#d32f2f';
      case 'high': return '#ed6c02';
      case 'medium': return '#1976d2';
      case 'low': return '#2e7d32';
      default: return '#757575';
    }
  };

  const getImportanceChip = (importance?: string) => {
    if (!importance || importance === 'low') return null;
    
    const config = {
      urgent: { label: '긴급', color: 'error' as const, icon: <ErrorIcon fontSize="small" /> },
      high: { label: '높음', color: 'warning' as const, icon: <WarningIcon fontSize="small" /> },
      medium: { label: '보통', color: 'info' as const, icon: <ScheduleIcon fontSize="small" /> },
    };

    const chipConfig = config[importance as keyof typeof config];
    if (!chipConfig) return null;

    return (
      <Chip
        label={chipConfig.label}
        color={chipConfig.color}
        size="small"
        icon={chipConfig.icon}
        variant="outlined"
        sx={{ ml: 1 }}
      />
    );
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  const getRoleText = (role: UserRole) => {
    switch (role) {
      case 'admin': return '관리자';
      case 'operations': return '운영';
      case 'logistics': return '물류';
      default: return role;
    }
  };

  if (error) {
    return (
      <Paper sx={{ p: 3, height, borderRadius: 2 }}>
        {showHeader && (
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
            📈 최근 활동
          </Typography>
        )}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: showHeader ? height - 80 : height - 40,
          color: 'error.main'
        }}>
          <Typography variant="body2">
            활동 데이터를 불러오는데 실패했습니다.
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, height, borderRadius: 2 }}>
      {showHeader && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            📈 최근 활동
          </Typography>
          {activities.length > 0 && (
            <Badge badgeContent={activities.length} color="primary" max={99}>
              <Typography variant="caption" color="text.secondary">
                실시간 업데이트
              </Typography>
            </Badge>
          )}
        </Box>
      )}

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: showHeader ? height - 80 : height - 40 
        }}>
          <CircularProgress />
        </Box>
      ) : activities.length > 0 ? (
        <Box sx={{ height: showHeader ? height - 80 : height - 40, overflow: 'auto' }}>
          <List dense>
            {activities.map((activity, index) => (
              <React.Fragment key={activity.id}>
                <ListItem sx={{ px: 0, py: 1 }}>
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: getActivityColor(activity.importance),
                        fontSize: '0.875rem'
                      }}
                    >
                      {getActivityIcon(activity.entityType, activity.action)}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {activity.action}
                        </Typography>
                        {getImportanceChip(activity.importance)}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {activity.entityName} • {activity.userName} ({getRoleText(activity.userRole)})
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTimeAgo(activity.timestamp)}
                        </Typography>
                        {activity.details && (
                          <Tooltip title={activity.details} arrow>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontStyle: 'italic',
                                cursor: 'help',
                                color: 'text.secondary'
                              }}
                            >
                              {activity.details.length > 50 
                                ? `${activity.details.substring(0, 50)}...` 
                                : activity.details
                              }
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: showHeader ? height - 80 : height - 40,
          color: 'text.secondary'
        }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            아직 활동 내역이 없습니다.
          </Typography>
          <Typography variant="caption">
            시스템 활동이 여기에 표시됩니다.
          </Typography>
        </Box>
      )}
    </Paper>
  );
}; 