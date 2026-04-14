import api from "./api";

// ================= LOGIN =================
export const login = async (email, password) => {
  try {
    const response = await api.post("/Auth/login", {
      email,
      password,
    });

    const data = response.data;

    // ================= STORE AUTH DATA =================
    if (data?.token) {
      localStorage.setItem("token", data.token);
    }

    if (data?.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken);
    }

    if (data?.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data; 

  } catch (error) {

    // ================= HANDLE API ERROR =================
    if (error.response && error.response.data) {
      console.error("Login error:", error.response.data);
      throw error.response.data;
    }

    // ================= FALLBACK ERROR =================
    console.error("Login error:", error.message);

    throw {
      message: error.message || "Login failed"
    };
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