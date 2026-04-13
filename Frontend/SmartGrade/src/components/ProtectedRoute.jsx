import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");

  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  console.log("ProtectedRoute token:", token);
  console.log("ProtectedRoute user:", user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return children;
  }

  // Role-based authorization
  if (
    allowedRoles &&
    !allowedRoles.some(
      (role) =>
        role.toLowerCase() ===
        (user?.role || user?.Role || "").toLowerCase()
    )
  ) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;