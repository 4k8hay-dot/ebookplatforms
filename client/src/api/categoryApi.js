import axiosClient from './axiosClient';

export const getCategoriesRequest = () => axiosClient.get('/categories');
