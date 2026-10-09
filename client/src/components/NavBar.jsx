import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Avatar, Box, Stack, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { resolveFileUrl } from '../utils/fileUrl';

const LIBRARY_LINKS = [
  { to: '/notes', label: 'Notes' },
  { to: '/knowledge-search', label: 'Knowledge Search' },
  { to: '/knowledge-map', label: 'Knowledge Map' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/history', label: 'History' },
];

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [libraryAnchor, setLibraryAnchor] = useState(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppBar position="static" color="primary" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: 'none', color: 'inherit', fontFamily: '"Source Serif Pro", serif' }}
        >
          Smart eBook Platform
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to="/bookshelf">
                Bookshelf
              </Button>

              <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} onClick={(e) => setLibraryAnchor(e.currentTarget)}>
                Library
              </Button>
              <Menu anchorEl={libraryAnchor} open={Boolean(libraryAnchor)} onClose={() => setLibraryAnchor(null)}>
                {LIBRARY_LINKS.map((link) => (
                  <MenuItem key={link.to} component={RouterLink} to={link.to} onClick={() => setLibraryAnchor(null)}>
                    {link.label}
                  </MenuItem>
                ))}
              </Menu>

              {(user.role === 'author' || user.role === 'admin') && (
                <Button color="inherit" component={RouterLink} to="/author/dashboard">
                  My Books
                </Button>
              )}
              {user.role === 'admin' && (
                <Button color="inherit" component={RouterLink} to="/admin">
                  Admin
                </Button>
              )}
              <NotificationBell />
              <Button color="inherit" component={RouterLink} to="/profile">
                {user.name}
              </Button>
              <Avatar
                src={resolveFileUrl(user.profileImage)}
                sx={{ width: 32, height: 32 }}
              >
                {user.name?.[0]?.toUpperCase()}
              </Avatar>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Box>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </Box>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
