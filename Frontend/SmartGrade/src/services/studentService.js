import axios from "axios";

const API = "https://localhost:7247/api/student";

export const getStudentDashboard = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getStudentResults = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API}/results`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getStudentAnalytics = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API}/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getStudentProfile = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API}/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};