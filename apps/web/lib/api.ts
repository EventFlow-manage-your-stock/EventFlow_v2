// apps/web/lib/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

export const api = axios.create({
  // Tutaj podajemy port 3001 lub inny, na którym działa Twój backend NestJS!
  baseURL: 'http://localhost:3002/api', // Upewnij się, że porty frontu (3000) i API nie kolidują. Jeśli API to 3001, zmień to.
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});