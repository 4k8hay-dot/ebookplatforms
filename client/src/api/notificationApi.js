import axiosClient from './axiosClient';

export const getMyNotificationsRequest = () => axiosClient.get('/notifications');
export const markNotificationReadRequest = (id) => axiosClient.put(`/notifications/${id}/read`);
