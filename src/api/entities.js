import { apiClient } from './client';

// Player endpoints
export const Player = {
  list: () => apiClient.request('/players'),
  get: (id) => apiClient.request(`/players/${id}`),
  create: (data) => apiClient.request('/players', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiClient.request(`/players/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiClient.request(`/players/${id}`, { 
    method: 'DELETE' 
  }),
};

// Group endpoints
export const Group = {
  list: () => apiClient.request('/groups'),
  get: (id) => apiClient.request(`/groups/${id}`),
  create: (data) => apiClient.request('/groups', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiClient.request(`/groups/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiClient.request(`/groups/${id}`, { 
    method: 'DELETE' 
  }),
};

// Session endpoints
export const Session = {
  list: () => apiClient.request('/sessions'),
  get: (id) => apiClient.request(`/sessions/${id}`),
  create: (data) => apiClient.request('/sessions', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiClient.request(`/sessions/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiClient.request(`/sessions/${id}`, { 
    method: 'DELETE' 
  }),
};

// Transaction endpoints
export const Transaction = {
  list: () => apiClient.request('/transactions'),
  get: (id) => apiClient.request(`/transactions/${id}`),
  getBySession: (sessionId) => apiClient.request(`/transactions/session/${sessionId}`),
  getByPlayer: (playerId) => apiClient.request(`/transactions/player/${playerId}`),
  create: (data) => apiClient.request('/transactions', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiClient.request(`/transactions/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiClient.request(`/transactions/${id}`, { 
    method: 'DELETE' 
  }),
};

// Settings endpoints
export const Settings = {
  list: () => apiClient.request('/settings'),
  get: (id) => apiClient.request(`/settings/${id}`),
  create: (data) => apiClient.request('/settings', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  update: (id, data) => apiClient.request(`/settings/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify(data) 
  }),
  delete: (id) => apiClient.request(`/settings/${id}`, { 
    method: 'DELETE' 
  }),
};