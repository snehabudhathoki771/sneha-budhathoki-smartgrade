import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7247/api",
});


// ================= REQUEST INTERCEPTOR =================
// Attach access token automatically

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ================= RESPONSE INTERCEPTOR =================
// Handle expired access token using refresh token

api.interceptors.response.use(
  (response) => response,

  async (error) => {

    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Prevent infinite retry loop
    if (error.response?.status === 401 && !originalRequest._retry) {

      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");

      // No refresh token → logout
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {

        const response = await axios.post(
          "https://localhost:7247/api/Auth/refresh-token",
          { refreshToken }
        );

        const newToken = response.data.token;

        localStorage.setItem("token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);

      } catch (refreshError) {

        localStorage.clear();
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


// ================= STUDENT APIs =================

export const getStudentDashboard = () =>
  api.get("/student/dashboard");

export const getStudentResults = () =>
  api.get("/student/results");

export const getStudentAnalytics = () =>
  api.get("/student/analytics");

export const getStudentProfile = () =>
  api.get("/student/profile");


// ================= UPDATE STUDENT PROFILE =================

export const updateStudentProfile = (formData) =>
  api.put("/student/profile", formData);

// ================= REPORT =================

export const downloadExamReport = (examId) =>
  api.get(`/student/report/${examId}`, {
    responseType: "arraybuffer",
  });


// ================= FEEDBACK =================

export const getStudentFeedback = () =>
  api.get("/student/feedback");


// ================= NOTIFICATIONS =================

export const getNotifications = () =>
  api.get("/notifications");

export const getUnreadCount = () =>
  api.get("/notifications/unread-count");

export const markNotificationRead = (id) =>
  api.put(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.put("/notifications/read-all");


export default api;