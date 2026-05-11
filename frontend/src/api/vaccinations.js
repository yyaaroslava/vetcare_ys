import api from './axios';

/**
 * API-клієнт для керування записами про вакцинацію.
 */
export const getVaccinations = (params) => api.get('/vaccinations/', { params });
export const createVaccination = (data) => api.post('/vaccinations/', data);
export const updateVaccination = (id, data) => api.patch(`/vaccinations/${id}/`, data);
export const deleteVaccination = (id) => api.delete(`/vaccinations/${id}/`);
