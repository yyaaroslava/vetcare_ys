import api from './axios';

/**
 * API-клієнт для керування записами на прийом.
 */
export const getAppointments = (params) => api.get('/appointments/', { params });
export const createAppointment = d => api.post('/appointments/', d);
export const updateAppointment = (id, d) => api.patch(`/appointments/${id}/`, d);
export const cancelAppointment = id => api.post(`/appointments/${id}/cancel/`);
export const getFreeSlots = (vet, date) => api.get('/appointments/free-slots/', { params: { vet, date } });
