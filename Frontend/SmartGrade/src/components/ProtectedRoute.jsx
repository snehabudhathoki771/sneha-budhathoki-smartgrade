import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
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


  // Authorized
  return children;
};

export default ProtectedRoute;
