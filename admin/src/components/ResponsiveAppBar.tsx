import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { AdminPanelSettings } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.store';
import { logoutRequest } from '../api/auth.api';

const drawerWidth = 240;
const pages = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Navigation', path: '/dashboard/navbars' },
    { label: 'Publications', path: '/dashboard/publications' },
    { label: 'Glimpses', path: '/dashboard/glimpses' },
];

interface Props {
    window?: () => Window;
    children?: React.ReactNode;
}

function ResponsiveAppBar(props: Props) {
    const { window, children } = props;
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const location = useLocation();
    const user = useAuth((state) => state.user);
    const clearAuth = useAuth((state) => state.clearAuth);

    const [mobileOpen, setMobileOpen] = React.useState(false);
    const [desktopOpen, setDesktopOpen] = React.useState(true);
    const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
    const [isSigningOut, setIsSigningOut] = React.useState(false);

    const handleDrawerToggle = () => {
        if (isMobile) {
            setMobileOpen((prev) => !prev);
        } else {
            setDesktopOpen((prev) => !prev);
        }
    };

    const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElUser(event.currentTarget);
    };

    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleLogout = async () => {
        if (isSigningOut) return;

        handleCloseUserMenu();
        if (isMobile) setMobileOpen(false);

        setIsSigningOut(true);
        try {
            // Clears the HttpOnly refresh-token cookie on the backend.
            await logoutRequest();
        } finally {
            clearAuth();
            navigate('/', { replace: true });
            setIsSigningOut(false);
        }
    };

    const isDrawerVisible = isMobile ? mobileOpen : desktopOpen;

    const drawer = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Sidebar Header with Brand and Toggle Hamburger */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 2,
                    minHeight: 64,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettings />
                    <Typography
                        variant="h6"
                        noWrap
                        component="a"
                        href="#app-bar-with-responsive-menu"
                        sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: '.3rem',
                            color: 'inherit',
                            textDecoration: 'none',
                        }}
                    >
                        Admin
                    </Typography>
                </Box>
                <IconButton onClick={handleDrawerToggle} aria-label="hide sidebar" size="small">
                    <MenuIcon />
                </IconButton>
            </Box>
            <Divider />

            {/* Navigation Pages */}
            <List sx={{ flexGrow: 1, py: 1 }}>
                {pages.map(({ label, path }) => (
                    <ListItem key={path} disablePadding>
                        <ListItemButton
                            selected={location.pathname === path}
                            onClick={() => handleNavigate(path)}
                        >
                            <ListItemText primary={<Typography>{label}</Typography>} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />

            {/* Profile & Settings at bottom of sidebar */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                    <Tooltip title="Open settings">
                        <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }} aria-label="Open settings">
                            <Avatar alt={user?.display_name ?? 'Admin'} src={user?.avatar_url}>
                                {(user?.display_name ?? 'A').charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {user?.display_name ?? 'Admin'}
                    </Typography>
                </Box>
                <Menu
                    sx={{ mb: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                >
                    <MenuItem onClick={() => { handleCloseUserMenu(); handleNavigate('/dashboard'); }}>
                        <Typography sx={{ textAlign: 'center' }}>Dashboard</Typography>
                    </MenuItem>
                    <MenuItem onClick={() => { void handleLogout(); }} disabled={isSigningOut}>
                        <Typography sx={{ textAlign: 'center' }}>
                            {isSigningOut ? 'Signing out…' : 'Logout'}
                        </Typography>
                    </MenuItem>
                </Menu>
            </Box>
        </Box>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            <CssBaseline />

            {/* Hamburger button visible when sidebar is closed (both desktop & mobile) */}
            {!isDrawerVisible && (
                <IconButton
                    color="inherit"
                    aria-label="open sidebar"
                    onClick={handleDrawerToggle}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: 1200,
                        bgcolor: 'background.paper',
                        boxShadow: 2,
                        '&:hover': { bgcolor: 'background.paper' },
                    }}
                >
                    <MenuIcon />
                </IconButton>
            )}

            {/* Sidebar Navigation */}
            <Box
                component="nav"
                sx={{
                    width: { sm: desktopOpen ? drawerWidth : 0 },
                    flexShrink: { sm: 0 },
                    transition: theme.transitions.create('width', {
                        easing: desktopOpen ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
                        duration: desktopOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
                    }),
                }}
                aria-label="admin side navigation"
            >
                {/* Mobile Temporary Drawer */}
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{
                        keepMounted: true, // Improves performance on mobile.
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop Persistent Drawer */}
                <Drawer
                    variant="persistent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                    }}
                    open={desktopOpen}
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    // Flex items default to min-width:auto, which refuses to
                    // shrink below content min-width — a wide table would then
                    // stretch the whole page. min-width:0 lets narrow viewports
                    // keep the content inside the column (the table scrolls
                    // within its own container instead).
                    minWidth: 0,
                    p: 3,
                    // The floating "open sidebar" button sits fixed at the
                    // top-left (16px, right edge ~56px) whenever the drawer is
                    // closed; indent the content so it never overlaps the
                    // page heading.
                    pl: isDrawerVisible ? 3 : 8,
                    transition: theme.transitions.create(
                        ['margin', 'width', 'padding-left'],
                        {
                            easing: desktopOpen ? theme.transitions.easing.easeOut : theme.transitions.easing.sharp,
                            duration: desktopOpen ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
                        },
                    ),
                    width: { sm: desktopOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default ResponsiveAppBar;
