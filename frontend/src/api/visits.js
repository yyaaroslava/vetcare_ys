import api from './axios';

/**
 * API-клієнт для керування медичними візитами.
 */
export const getVisits = (params) => api.get('/visits/', { params });
export const createVisit = d => api.post('/visits/', d);
export const updateVisit = (id, d) => api.patch(`/visits/${id}/`, d);
export const deleteVisit = id => api.delete(`/visits/${id}/`);
