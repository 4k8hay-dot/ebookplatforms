import axiosClient from './axiosClient';

function toFormData(fields, files) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });
  if (files.cover) formData.append('cover', files.cover);
  if (files.ebookFile) formData.append('ebookFile', files.ebookFile);
  return formData;
}

export const getMyBooksRequest = () => axiosClient.get('/books/mine');

export const createBookRequest = (fields, files) =>
  axiosClient.post('/books', toFormData(fields, files), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateBookRequest = (id, fields, files) =>
  axiosClient.put(`/books/${id}`, toFormData(fields, files), {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteBookRequest = (id) => axiosClient.delete(`/books/${id}`);
