// API client configuration
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api';

// Create a client with authentication required
export const apiClient = {
  // Helper function to make authenticated requests
  request: async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `API request failed: ${response.statusText}`);
    }

    return response.json();
  },
}; 