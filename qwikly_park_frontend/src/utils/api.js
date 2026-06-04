import { ofetch } from 'ofetch'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  async onRequest({ options }) {
    const authData = JSON.parse(localStorage.getItem('auth') || '{}')
    const token = authData?.token

    options.headers = {
      ...options.headers,
      'Accept': 'application/json',
      'X-Authorization': import.meta.env.VITE_API_KEY,
    }

    if (token) {
      options.headers.Authorization = `Bearer ${token}`
    }
  },
})
