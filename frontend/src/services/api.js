import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  changePassword: (current_password, new_password) =>
    api.post('/auth/change-password', { current_password, new_password }),
}

export const usersAPI = {
  list: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
}

export const tasksAPI = {
  list: (params) => api.get('/tasks/', { params }),
  statuses: () => api.get('/tasks/statuses'),
  collaborators: () => api.get('/tasks/collaborators'),
}

export const dashboardAPI = {
  summary: () => api.get('/dashboard/summary'),
  migrationsPerWeek: (params) => api.get('/dashboard/migrations-per-week', { params }),
  migrationTime: (params) => api.get('/dashboard/migration-time', { params }),
  migrationsByStatus: () => api.get('/dashboard/migrations-by-status'),
  phaseDistribution: () => api.get('/dashboard/phase-distribution'),
  tasksCompletedPerWeek: (params) => api.get('/dashboard/tasks-completed-per-week', { params }),
  tasksByCollaborator: (params) => api.get('/dashboard/tasks-by-collaborator', { params }),
  bugsPerWeek: (params) => api.get('/dashboard/bugs-per-week', { params }),
  bugsByPrograma: () => api.get('/dashboard/bugs-by-programa'),
  liberacoesHmlPerWeek: (params) => api.get('/dashboard/liberacoes-hml-per-week', { params }),
  liberacoesHmlSummary: () => api.get('/dashboard/liberacoes-hml-summary'),
  availableWeeks: () => api.get('/dashboard/available-weeks'),
  planningComparison: (params) => api.get('/dashboard/planning-comparison', { params }),
  aprovacoes_hml: (params) => api.get('/dashboard/aprovacoes-hml', { params }),
  statusLiberacaoHml: () => api.get('/dashboard/status-liberacao-hml'),
  productionSection: () => api.get('/dashboard/production-section'),
  bugsHmlMigrations: () => api.get('/dashboard/bugs-hml-migrations'),
  forecastData: () => api.get('/dashboard/forecast-data'),
  phasesPerWeek: (params) => api.get('/dashboard/phases-per-week', { params }),
}

export const configAPI = {
  get: (key) => api.get(`/app-config/${key}`),
  set: (key, value) => api.put(`/app-config/${key}`, { value }),
}

export const rolesAPI = {
  list: () => api.get('/roles/'),
  listPermissions: () => api.get('/roles/permissions'),
  create: (data) => api.post('/roles/', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
}

export const syncAPI = {
  listConfigs: () => api.get('/sync/configs'),
  createConfig: (data) => api.post('/sync/configs', data),
  updateConfig: (id, data) => api.put(`/sync/configs/${id}`, data),
  deleteConfig: (id) => api.delete(`/sync/configs/${id}`),
  triggerSync: (id) => api.post(`/sync/configs/${id}/trigger`),
  logs: (limit) => api.get('/sync/logs', { params: { limit } }),
}

export const planningAPI = {
  list: () => api.get('/planning'),
  get: (week) => api.get(`/planning/${week}`),
  create: (data) => api.post('/planning', data),
  update: (week, data) => api.put(`/planning/${week}`, data),
  delete: (week) => api.delete(`/planning/${week}`),
}

export default api
