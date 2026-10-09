import axiosClient from './axiosClient';

export const getMyProfileRequest = () => axiosClient.get('/users/me');
export const updateMyProfileRequest = (payload) => axiosClient.put('/users/me', payload);

export const updateMyAvatarRequest = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return axiosClient.put('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
