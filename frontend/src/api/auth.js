import api from './axios';

export const login = d => api.post('/accounts/login/', d);
export const register = d => api.post('/accounts/register/', d);
export const logout = d => api.post('/accounts/logout/', d);
export const getMe = () => api.get('/accounts/me/');
export const updateMe = d => api.patch('/accounts/me/', d);
export const changePassword = d => api.post('/accounts/change-password/', d);
export const getUsers = () => api.get('/accounts/users/');
export const createUser = d => api.post('/accounts/users/', d);
export const updateUser = (id, d) => api.patch(`/accounts/users/${id}/`, d);
export const deleteUser = id => api.delete(`/accounts/users/${id}/`);
export const getVets = () => api.get('/accounts/vets/');
export const getClients = () => api.get('/accounts/clients/');

// Сумісність з попередньою структурою коду
export const authApi = {
  login: d => api.post('/accounts/login/', d),
  register: d => api.post('/accounts/register/', d),
  getProfile: () => api.get('/accounts/me/'),
  logout: d => api.post('/accounts/logout/', d),
};
