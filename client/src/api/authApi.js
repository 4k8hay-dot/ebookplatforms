import axiosClient from './axiosClient';

export const registerRequest = (payload) => axiosClient.post('/auth/register', payload);
export const loginRequest = (payload) => axiosClient.post('/auth/login', payload);
export const googleLoginRequest = (idToken) => axiosClient.post('/auth/google', { idToken });
export const forgotPasswordRequest = (email) => axiosClient.post('/auth/forgot-password', { email });
export const resetPasswordRequest = (token, password) => axiosClient.post('/auth/reset-password', { token, password });
export const logoutRequest = () => axiosClient.post('/auth/logout');
export const getMeRequest = () => axiosClient.get('/auth/me');
