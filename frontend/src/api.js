import axios from "axios";

const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("markethub_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("markethub_token");
      localStorage.removeItem("markethub_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
