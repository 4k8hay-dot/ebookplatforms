import axiosClient from './axiosClient';

export const getMyNotesRequest = (params) => axiosClient.get('/notes', { params });
export const createNoteRequest = (payload) => axiosClient.post('/notes', payload);
export const updateNoteRequest = (id, payload) => axiosClient.put(`/notes/${id}`, payload);
export const deleteNoteRequest = (id) => axiosClient.delete(`/notes/${id}`);
