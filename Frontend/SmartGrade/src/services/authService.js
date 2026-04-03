import api from "./api";

//  LOGIN 
export const login = async (email, password) => {
  const response = await api.post("/Auth/login", {
    email,
    password,
  });

  const { token, refreshToken, user } = response.data;

  // Store auth data
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));

  return user; // used for navigation
};

//  SIGNUP 
export const signup = async (data) => {
  const response = await api.post("/Auth/signup", data);
  return response.data;
};

//  LOGOUT 
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

//  HELPERS 
export const getToken = () => localStorage.getItem("token");

export const getRefreshToken = () =>
  localStorage.getItem("refreshToken");

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!getToken();

// Optional helpers
export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};
