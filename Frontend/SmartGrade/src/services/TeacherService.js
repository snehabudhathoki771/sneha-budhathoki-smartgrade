import api from "./api";

export const getTeacherDashboard = async () => {
  const res = await api.get("/teacher/dashboard");
  return res.data;
};
