import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useDialog } from 'src/utils/useDialog';
import { getApiV1Url } from 'src/utils/config';

export const instance = axios.create({
  baseURL: getApiV1Url(),
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
  function (error) {
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
