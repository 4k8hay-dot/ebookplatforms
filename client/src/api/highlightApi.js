import axiosClient from './axiosClient';

export const getAllMyHighlightsRequest = (params) => axiosClient.get('/highlights', { params });
export const getHighlightsForBookRequest = (bookId) => axiosClient.get(`/highlights/${bookId}`);
export const createHighlightRequest = (bookId, payload) => axiosClient.post(`/highlights/${bookId}`, payload);
export const deleteHighlightRequest = (id) => axiosClient.delete(`/highlights/${id}`);
