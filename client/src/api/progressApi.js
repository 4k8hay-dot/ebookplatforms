import axiosClient from './axiosClient';

export const getProgressRequest = (bookId) => axiosClient.get(`/progress/${bookId}`);
export const saveProgressRequest = (bookId, payload) => axiosClient.put(`/progress/${bookId}`, payload);
export const listMyProgressRequest = () => axiosClient.get('/progress');
