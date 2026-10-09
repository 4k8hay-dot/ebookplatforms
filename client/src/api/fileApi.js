import axiosClient from './axiosClient';

export const getBookFileRequest = (bookId) => axiosClient.get(`/books/${bookId}/file`, { responseType: 'arraybuffer' });
