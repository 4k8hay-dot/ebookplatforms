import axiosClient from './axiosClient';

export const getMyTagsRequest = () => axiosClient.get('/tags');
export const createTagRequest = (name) => axiosClient.post('/tags', { name });
export const deleteTagRequest = (id) => axiosClient.delete(`/tags/${id}`);
