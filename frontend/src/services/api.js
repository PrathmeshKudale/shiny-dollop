import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Response interceptor — handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || 'Something went wrong'

    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem('finance-auth')
      delete api.defaults.headers.common['Authorization']
      window.location.href = '/auth'
      return Promise.reject(error)
    }

    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.')
    }

    return Promise.reject({ ...error, message: msg })
  }
)

export default api
