import axiosClient from './axiosClient';

export const getBookshelfRequest = () => axiosClient.get('/bookshelf');
export const addToBookshelfRequest = (bookId) => axiosClient.post(`/bookshelf/${bookId}`);
export const removeFromBookshelfRequest = (bookId) => axiosClient.delete(`/bookshelf/${bookId}`);
