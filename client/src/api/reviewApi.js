import axiosClient from './axiosClient';

export const getReviewsForBookRequest = (bookId) => axiosClient.get(`/books/${bookId}/reviews`);
export const upsertReviewRequest = (bookId, payload) => axiosClient.post(`/books/${bookId}/reviews`, payload);
export const updateReviewRequest = (id, payload) => axiosClient.put(`/reviews/${id}`, payload);
export const deleteReviewRequest = (id) => axiosClient.delete(`/reviews/${id}`);
