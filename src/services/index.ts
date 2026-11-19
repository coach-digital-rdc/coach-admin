import axios, { AxiosError } from 'axios';
import StorageService from './storage/storage.service';
import { progress } from '@/common/progress';

const config = {
  baseURL: import.meta.env.VITE_API_URL,
};

const _axios = axios.create(config);

_axios.interceptors.request.use(
  (config: any) => {
    progress.start();
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    progress.done();
    return Promise.reject(error);
  },
);

_axios.interceptors.response.use(
  (response) => {
    progress.done();
    return response;
  },
  (error: AxiosError) => {
    progress.done();
    if (error.response?.status === 401) {
      StorageService.cleanStorage();
      location.reload();
    }

    throw error;
  },
);

export default _axios;
