import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  People as PeopleIcon,
  Store as StoreIcon,
  Settings as SettingsIcon,
  Build as BuildIcon,
  BugReport as BugReportIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface MenuItemType {
  text: string;
  icon: React.ReactElement;
  path: string;
  roles?: string[];
}

const menuItems: MenuItemType[] = [
  {
    text: '대시보드',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['admin', 'operations', 'logistics']
  },
  {
    text: '신규 부품 등록 및 첫 구매 요청',
    icon: <ShoppingCartIcon />,
    path: '/new-part-request',
    roles: ['operations']
  },
  {
    text: '구매요청목록',
    icon: <ShoppingCartIcon />,
    path: '/purchase-requests',
    roles: ['admin', 'operations', 'logistics']
  },
  {
    text: '사용자 관리',
    icon: <PeopleIcon />,
    path: '/admin/users',
    roles: ['admin']
  },
  {
    text: '지점 관리',
    icon: <StoreIcon />,
    path: '/admin/branches',
    roles: ['admin']
  },
  {
    text: '시스템 설정',
    icon: <SettingsIcon />,
    path: '/admin/settings',
    roles: ['admin']
  },
  {
    text: '시스템 테스트',
    icon: <BugReportIcon />,
    path: '/admin/system-test',
    roles: ['admin']
  },
  {
    text: '성능 모니터링',
    icon: <SpeedIcon />,
    path: '/admin/performance',
    roles: ['admin']
  },
  {
    text: '알림 설정',
    icon: <NotificationsIcon />,
    path: '/settings/notifications',
    roles: ['operations', 'logistics']
  },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
    handleMenuClose();
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return userProfile && item.roles.includes(userProfile.role);
  });

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
          부품 취급 시스템
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => {
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {(() => {
              const currentMenuItem = menuItems.find(item => item.path === location.pathname);
              return currentMenuItem?.text || '신규 부품 취급 시스템';
            })()}
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={0} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton onClick={handleMenuClick} color="inherit">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {userProfile?.name?.charAt(0) || <AccountCircleIcon />}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleMenuClose}>
              <Typography variant="body2" color="text.secondary">
                {userProfile?.name} ({userProfile?.role})
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout; 