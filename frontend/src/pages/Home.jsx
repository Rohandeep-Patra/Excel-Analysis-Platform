import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userFiles, setUserFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState(false);
  const [notification, setNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nextUpdate, setNextUpdate] = useState(new Date(Date.now() + 30000));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time dashboard data updates
  useEffect(() => {
    const dashboardTimer = setInterval(() => {
      refreshDashboardData();
      setNextUpdate(new Date(Date.now() + 30000));
      // Show a subtle notification that data was refreshed
      setNotification({
        type: 'success',
        message: 'Dashboard data refreshed automatically'
      });
      setTimeout(() => setNotification(null), 2000);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(dashboardTimer);
  }, []);

  // Update next update time every second
  useEffect(() => {
    const updateTimer = setInterval(() => {
      setNextUpdate(prev => {
        const now = new Date();
        const diff = prev.getTime() - now.getTime();
        if (diff <= 0) {
          return new Date(now.getTime() + 30000);
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(updateTimer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchUserFiles();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get("/api/dashboard/stats", {
        headers: { "x-auth-token": token },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserFiles = async () => {
    setFilesLoading(true);
    try {
      const response = await axios.get("/api/dashboard/files", {
        headers: { "x-auth-token": token },
      });
      setUserFiles(response.data.files);
    } catch (error) {
      console.error("Error fetching user files:", error);
    } finally {
      setFilesLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const handleUploadClick = () => {
    navigate("/upload");
  };

  const refreshDashboardData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchUserFiles()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteSingleFile = async (fileId, fileName) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeletingFiles(true);
    try {
      await axios.delete(`/api/upload/${fileId}`, {
        headers: { "x-auth-token": token }
      });
      
      // Refresh the dashboard data and files list
      await refreshDashboardData();
      
      // Show success message
      setNotification({
        type: 'success',
        message: `Successfully deleted "${fileName}"`
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error deleting file:", error);
      setNotification({
        type: 'error',
        message: 'Error deleting file. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeletingFiles(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-5 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Excel Analysis Platform</h1>
                <p className="text-slate-400 text-sm">Data Analytics Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-slate-400 text-sm">{formatDate(currentTime)}</p>
                <p className="text-white font-mono text-lg">{formatTime(currentTime)}</p>
              </div>
              <button
                onClick={refreshDashboardData}
                disabled={refreshing}
                className="bg-slate-700/50 hover:bg-slate-700 disabled:bg-slate-800 text-slate-300 p-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500 disabled:cursor-not-allowed"
                title="Refresh Dashboard"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-300"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate("/upload")}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                >
                  + Upload Files
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                  >
                    🔐 Admin Panel
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">Welcome back, {user?.name || 'User'}! 👋</h2>
              <p className="text-slate-300 text-lg">Here's what's happening with your data analysis today.</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-slate-400 text-sm">Live updates</p>
              </div>
              <p className="text-slate-400 text-xs">Last: {lastUpdated.toLocaleTimeString('en-US', { 
                hour12: true, 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}</p>
              <p className="text-slate-400 text-xs">Next: {nextUpdate.toLocaleTimeString('en-US', { 
                hour12: true, 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Files</p>
                <div className="text-3xl font-bold text-white">
                  {loading ? (
                    <div className="animate-pulse bg-slate-600 h-8 w-16 rounded"></div>
                  ) : (
                    formatNumber(dashboardData?.totalFiles || 0)
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Processed Today</p>
                <div className="text-3xl font-bold text-white">
                  {loading ? (
                    <div className="animate-pulse bg-slate-600 h-8 w-16 rounded"></div>
                  ) : (
                    formatNumber(dashboardData?.processedToday || 0)
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Rows</p>
                <div className="text-3xl font-bold text-white">
                  {loading ? (
                    <div className="animate-pulse bg-slate-600 h-8 w-16 rounded"></div>
                  ) : (
                    formatNumber(dashboardData?.totalRows || 0)
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-cyan-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Storage Used</p>
                <div className="text-3xl font-bold text-white">
                  {loading ? (
                    <div className="animate-pulse bg-slate-600 h-8 w-16 rounded"></div>
                  ) : (
                    formatFileSize(dashboardData?.storageUsed || 0)
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-600/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:bg-blue-600/30 transition-all duration-300 transform hover:scale-105 cursor-pointer" onClick={handleUploadClick}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Excel Files</h3>
              <p className="text-slate-300 mb-4">Upload and analyze your Excel files with advanced analytics</p>
              <button className="bg-slate-700/50 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500">
                Get Started
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:bg-emerald-600/30 transition-all duration-300 transform hover:scale-105 cursor-pointer" onClick={() => navigate("/history")}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">View History</h3>
              <p className="text-slate-300 mb-4">Explore your previous file analyses and insights</p>
              <button className="bg-slate-700/50 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500">
                View History
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-600/20 to-gray-600/20 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:bg-slate-600/30 transition-all duration-300 transform hover:scale-105 cursor-pointer" onClick={() => navigate("/settings")}>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-gray-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Settings</h3>
              <p className="text-slate-300 mb-4">Manage your account settings and preferences</p>
              <button className="bg-slate-700/50 hover:bg-slate-700 text-white px-6 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500">
                Configure
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 mb-8">
          <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {dashboardData?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'upload' ? 'bg-emerald-500' : 
                  activity.type === 'analysis' ? 'bg-blue-500' : 'bg-slate-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Files Section */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-white">Your Files</h3>
              </div>
              <button
                onClick={() => navigate("/upload")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
              >
                + Upload New
              </button>
            </div>
            
            {filesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-slate-700/30 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : userFiles.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userFiles.map((file) => (
                  <div key={file._id} className="flex items-center justify-between p-4 rounded-lg border transition-colors bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">{file.originalName}</p>
                        <p className="text-slate-400 text-sm">
                          {file.rowCount} rows • {file.columnCount} columns • {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => navigate(`/analysis/${file._id}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Analyze
                      </button>
                      <button
                        onClick={() => handleDeleteSingleFile(file._id, file.originalName)}
                        disabled={deletingFiles}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-3 py-1 rounded text-sm transition-colors disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-4">No files uploaded yet</p>
                <button
                  onClick={() => navigate("/upload")}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2 rounded-lg transition-all duration-300"
                >
                  Upload Your First File
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home; 