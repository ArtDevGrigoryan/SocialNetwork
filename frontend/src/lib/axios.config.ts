import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      );

      const newAccessToken = data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);

      api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (err) {
      processQueue(err, null);

      localStorage.removeItem("accessToken");
      window.location.href = "/login";

      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
