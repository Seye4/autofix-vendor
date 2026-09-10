/* import axios from 'axios';

export const API_URL = 'http://10.0.0.106/autofix/backend/index.php';

export const api = axios.create({
  baseURL: API_URL,

  timeout: 20000,

  headers: {
    Accept: 'application/json',
  },
});
 */

import axios from 'axios';

export const API_URL = 'http://10.0.0.106/autofix/backend/index.php';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,

  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (config.url && !config.url.startsWith('?')) {
    const path = config.url.replace(/^\/+/, '');

    config.url = '';
    config.params = {
      ...(config.params || {}),
      path,
    };
  }

  return config;
});
