import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const { user, token } = useSelector((state) => state.auth);

  if (user && token) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default PublicRoute; 