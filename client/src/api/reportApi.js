import axiosClient from './axiosClient';

export const createReportRequest = (payload) => axiosClient.post('/reports', payload);
