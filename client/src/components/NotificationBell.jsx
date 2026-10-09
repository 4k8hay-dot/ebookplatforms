import { useEffect, useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getMyNotificationsRequest, markNotificationReadRequest } from '../api/notificationApi';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = () => {
    getMyNotificationsRequest()
      .then((res) => {
        setNotifications(res.data.data.notifications);
        setUnreadCount(res.data.data.unreadCount);
      })
      .catch(() => {});
  };

  // Poll periodically so a book-approval notification shows up without
  // requiring a manual page refresh.
  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    load();
  };

  const handleClickNotification = async (notification) => {
    if (!notification.isRead) {
      await markNotificationReadRequest(notification._id).catch(() => {});
      load();
    }
    setAnchorEl(null);
    if (notification.relatedBookId) {
      navigate(`/books/${notification.relatedBookId}`);
    }
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Notifications
        </Typography>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem disabled>No notifications yet</MenuItem>
        ) : (
          notifications.slice(0, 10).map((n) => (
            <MenuItem key={n._id} onClick={() => handleClickNotification(n)} sx={{ whiteSpace: 'normal' }}>
              <Box>
                <Typography variant="body2" fontWeight={n.isRead ? 400 : 700}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(n.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
