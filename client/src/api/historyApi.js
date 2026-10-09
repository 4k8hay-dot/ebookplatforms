import axiosClient from './axiosClient';

export const getHistoryRequest = () => axiosClient.get('/history');
export const recordAccessRequest = (bookId) => axiosClient.post(`/history/${bookId}`);
export const removeHistoryItemRequest = (id) => axiosClient.delete(`/history/${id}`);
