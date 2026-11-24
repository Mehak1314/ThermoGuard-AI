import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

export const healthCheck = () => api.get('/health')
export const getMetrics = () => api.get('/metrics')
export const getModels = () => api.get('/models')
export const predictTemperature = (data) => api.post('/predict', data)
export const getDataset = (page = 1, pageSize = 50, search = '') =>
  api.get('/dataset', { params: { page, page_size: pageSize, search } })
export const getDatasetStats = () => api.get('/dataset/stats')

export default api
