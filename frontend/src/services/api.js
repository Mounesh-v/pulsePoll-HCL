import axios from 'axios'

export const AUTH_STORAGE_KEY = 'pulsepoll.auth'

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'https://pulsepoll-api-60e5.onrender.com'
).replace(/\/$/, '')

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY)

  if (stored) {
    try {
      const { token } = JSON.parse(stored)

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)

    if (status === 401 && stored) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      window.dispatchEvent(new Event('pulsepoll:unauthorized'))
    }

    return Promise.reject(error)
  },
)

export const authApi = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials)
    return response.data
  },

  register: async (details) => {
    const response = await api.post('/api/auth/register', details)
    return response.data
  },
}

export const pollApi = {
  create: async (poll) => {
    const response = await api.post('/api/polls', poll)
    return response.data
  },

  getMine: async () => {
    const response = await api.get('/api/polls')
    return response.data
  },

  get: async (pollId) => {
    const response = await api.get(`/api/polls/${pollId}`)
    return response.data
  },

  close: async (pollId) => {
    const response = await api.patch(`/api/polls/${pollId}/close`)
    return response.data
  },

  vote: async (pollId, optionId) => {
    const response = await api.post(`/api/polls/${pollId}/vote`, { optionId })
    return response.data
  },

  getResults: async (pollId) => {
    const response = await api.get(`/api/polls/${pollId}/results`)
    return response.data
  },
}

export const getPollWebSocketUrl = (pollId) => {
  const path = `/ws/polls/${pollId}`

  if (API_BASE_URL) {
    return `${API_BASE_URL.replace(/^http/, 'ws')}${path}`
  }

  if (typeof window === 'undefined') {
    return path
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}

export const getApiErrorMessage = (error, fallback = 'Something went wrong') =>
  error?.response?.data?.message || error?.message || fallback

export default api
