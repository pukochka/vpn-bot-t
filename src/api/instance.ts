import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDialog } from 'src/utils/useDialog';
import config, { getNextBackendUrl } from 'src/utils/config';

export const instance = axios.create({
  baseURL: config.url,
  headers: { Accept: 'application/json' },
});

instance.interceptors.request.use(function (request) {
  return request;
});

instance.interceptors.response.use(
  function (response) {
    if (response.data.result) {
      return response;
    }

    useDialog(response.data?.message || 'Ошибка');

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject();
  },
  async function (error) {
    const originalRequest = error.config as AxiosRequestConfig & {
      _backendFallbackAttempts?: number;
    };
    const fallbackAttempts = originalRequest?._backendFallbackAttempts || 0;
    const maxFallbackAttempts = Math.max(config.backends.length - 1, 0);
    const canRetryWithFallback =
      fallbackAttempts < maxFallbackAttempts && (!error.response || error.response.status >= 500);

    if (canRetryWithFallback) {
      const nextBackend = getNextBackendUrl();

      if (nextBackend) {
        instance.defaults.baseURL = nextBackend;
        config.url = nextBackend;
        originalRequest._backendFallbackAttempts = fallbackAttempts + 1;

        return instance(originalRequest);
      }
    }

    if (!error.response || error.response.status !== 200 || !error.response.data.result) {
      useDialog(error.response?.data?.message || 'Ошибка');
    }

    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    return Promise.reject(error);
  },
);

export const api = {
  async get<T = Any>(config: AxiosRequestConfig<Any>): Promise<AxiosResponse<T, Any>> {
    return instance(Object.assign(config, { method: 'get' }));
  },
  async post<T = Any>(config: AxiosRequestConfig<Any>): Promise<AxiosResponse<T, Any>> {
    return instance(Object.assign(config, { method: 'post' }));
  },
};
