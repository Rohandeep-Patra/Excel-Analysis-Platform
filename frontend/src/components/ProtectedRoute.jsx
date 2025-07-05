import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (!user || !token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute; 