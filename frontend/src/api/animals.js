import api from './axios';
export const getAnimals = (params) => api.get('/animals/', { params });
export const getAnimal = id => api.get(`/animals/${id}/`);
export const createAnimal = d => api.post('/animals/', d);
export const updateAnimal = (id, d) => api.patch(`/animals/${id}/`, d);
export const deleteAnimal = id => api.delete(`/animals/${id}/`);
