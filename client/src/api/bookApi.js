import axiosClient from './axiosClient';

export const getBooksRequest = (params) => axiosClient.get('/books', { params });
export const getBookByIdRequest = (id) => axiosClient.get(`/books/${id}`);
