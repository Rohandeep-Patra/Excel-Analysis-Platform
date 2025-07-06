import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Upload from "./pages/Upload";

// Component to handle navigation restrictions
const NavigationHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // If user is logged in and tries to access login/register pages, redirect to home
    if (
      user &&
      token &&
      (location.pathname === "/" || location.pathname === "/register")
    ) {
      navigate("/home", { replace: true });
    }

    // If user is not logged in and tries to access protected pages, redirect to login
    if (!user && !token && location.pathname === "/home") {
      navigate("/", { replace: true });
    }
  }, [location.pathname, user, token, navigate]);

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <NavigationHandler />
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
