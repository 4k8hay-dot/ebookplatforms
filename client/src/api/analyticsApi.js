import axiosClient from './axiosClient';

export const getReadingAnalyticsRequest = () => axiosClient.get('/analytics/reading');
export const getTopicAnalyticsRequest = () => axiosClient.get('/analytics/topics');
export const getKnowledgeMapRequest = () => axiosClient.get('/analytics/knowledge');
