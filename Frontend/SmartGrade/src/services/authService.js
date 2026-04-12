import api from "./api";

// ================= LOGIN =================
export const login = async (email, password) => {
  try {
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
  } catch (error) {
    const message =
    error.response?.data?.message ||
    error.response?.data ||
    error.message;

  console.error("Login error:", message);
  throw new Error(message);
  }
};

// ================= SIGNUP =================
export const signup = async (data) => {
  try {
    const response = await api.post("/Auth/signup", data);
    return response.data;
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw error;
  }
};

// ================= LOGOUT =================
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// ================= HELPERS =================
export const getToken = () => localStorage.getItem("token");

export const getRefreshToken = () =>
  localStorage.getItem("refreshToken");

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getToken();

// ================= ROLE CHECK =================
export const hasRole = (role) => {
  const user = getUser();
  return user?.role === role;
};