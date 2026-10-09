import axiosClient from './axiosClient';

// Book approval (Phase 3)
export const getPendingBooksRequest = () => axiosClient.get('/admin/books/pending');
export const approveBookRequest = (id) => axiosClient.put(`/admin/books/${id}/approve`);
export const rejectBookRequest = (id) => axiosClient.put(`/admin/books/${id}/reject`);

// User management (FR-ADMIN-02/03)
export const getUsersRequest = (params) => axiosClient.get('/admin/users', { params });
export const updateUserStatusRequest = (id, status) => axiosClient.put(`/admin/users/${id}/status`, { status });

// Dashboard statistics (FR-ADMIN-08)
export const getAdminStatsRequest = () => axiosClient.get('/admin/stats');

// Reports/moderation (FR-REPORT-03/04)
export const getReportsRequest = (params) => axiosClient.get('/admin/reports', { params });
export const resolveReportRequest = (id, removeContent) => axiosClient.put(`/admin/reports/${id}/resolve`, { removeContent });

// Category management (FR-ADMIN-04)
export const createCategoryRequest = (payload) => axiosClient.post('/categories', payload);
export const updateCategoryRequest = (id, payload) => axiosClient.put(`/categories/${id}`, payload);
export const deleteCategoryRequest = (id) => axiosClient.delete(`/categories/${id}`);
