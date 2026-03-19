import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password })
        set({ token: data.token, user: data.user })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        return data.user
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password })
        set({ token: data.token, user: data.user })
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
        return data.user
      },

      logout: () => {
        set({ token: null, user: null })
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),

      // Restore token on app load
      initAuth: () => {
        const token = get().token
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'finance-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => { state?.initAuth() },
    }
  )
)
