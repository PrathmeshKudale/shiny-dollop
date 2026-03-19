import api from './api'

// ── Expenses ──
export const expenseService = {
  getAll:   (params) => api.get('/expenses', { params }).then(r => r.data),
  getSummary: (params) => api.get('/expenses/summary', { params }).then(r => r.data),
  create:   (data) => api.post('/expenses', data).then(r => r.data),
  update:   (id, data) => api.patch(`/expenses/${id}`, data).then(r => r.data),
  delete:   (id) => api.delete(`/expenses/${id}`).then(r => r.data),
  parseVoice: (transcript) => api.post('/expenses/voice', { transcript }).then(r => r.data),
  uploadReceipt: (formData) => api.post('/expenses/receipt', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data),
}

// ── Budgets ──
export const budgetService = {
  getAll:  (month) => api.get('/budgets', { params: { month } }).then(r => r.data),
  create:  (data) => api.post('/budgets', data).then(r => r.data),
  update:  (id, data) => api.patch(`/budgets/${id}`, data).then(r => r.data),
  delete:  (id) => api.delete(`/budgets/${id}`).then(r => r.data),
}

// ── Insights ──
export const insightService = {
  get:         (month) => api.get('/insights', { params: { month } }).then(r => r.data),
  anomalies:   () => api.get('/insights/anomalies').then(r => r.data),
  trends:      () => api.get('/insights/trends').then(r => r.data),
}

// ── Chat ──
export const chatService = {
  query: (message, history) => api.post('/chat/query', { message, history }).then(r => r.data),
}

// ── Auth ──
export const authService = {
  getMe:      () => api.get('/auth/me').then(r => r.data),
  updateProfile: (data) => api.patch('/auth/profile', data).then(r => r.data),
}
