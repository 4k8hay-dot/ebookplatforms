import axiosClient from './axiosClient';

export const getBookmarksRequest = (bookId) => axiosClient.get(`/bookmarks/${bookId}`);
export const createBookmarkRequest = (bookId, payload) => axiosClient.post(`/bookmarks/${bookId}`, payload);
export const deleteBookmarkRequest = (id) => axiosClient.delete(`/bookmarks/${id}`);
