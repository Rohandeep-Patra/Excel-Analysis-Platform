import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Upload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showAnalysisLink, setShowAnalysisLink] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        droppedFile.type === "application/vnd.ms-excel"
      ) {
        setFile(droppedFile);
        setMessage("");
      } else {
        setMessage("Please select a valid Excel file (.xls or .xlsx)");
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file first");
      return;
    }
    setLoading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload/", formData, {
        headers: {
          "x-auth-token": token,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });
      
      // Validate response data
      if (!res.data || !res.data.file) {
        throw new Error("Invalid response from server");
      }
      
      setMessage("File uploaded successfully: " + res.data.file.originalName);
      setFile(null);
      e.target.reset();
      setUploadedFile(res.data);
      setShowAnalysisLink(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setMessage("Authentication failed. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 400) {
        setMessage("Error: " + (err.response?.data?.error || "Invalid file format"));
      } else if (err.response?.status === 500) {
        setMessage("Server error: " + (err.response?.data?.error || "Internal server error"));
      } else if (err.code === "ECONNREFUSED") {
        setMessage("Connection refused. Please check if the server is running.");
      } else {
        setMessage("Error uploading file: " + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
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
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-5 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">File Upload</h1>
                <p className="text-slate-400 text-sm">Upload and analyze Excel files</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/home")}
                className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-slate-700/50">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">Upload Excel File</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Drag and drop your Excel file here or click to browse. We support .xls and .xlsx formats.
            </p>
          </div>

          {/* Upload Area */}
          <div className="mb-8">
            <form onSubmit={handleUpload}>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-blue-400 bg-blue-900/20"
                    : "border-slate-600 hover:border-slate-500"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl mx-auto flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg text-white font-semibold mb-2">
                      {file ? file.name : "Choose a file or drag it here"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {file ? `Size: ${(file.size / 1024 / 1024).toFixed(2)} MB` : "Maximum file size: 10MB"}
                    </p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".xls,.xlsx"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl cursor-pointer transition-all duration-300 border border-slate-600 hover:border-slate-500"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Browse Files
                  </label>
                </div>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm text-slate-300 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-6 text-center">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    "Upload File"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Message Display */}
          {message && (
            <div className={`p-4 rounded-xl mb-6 ${
              message.includes("successfully") 
                ? "bg-green-600/20 border border-green-500/30 text-green-200" 
                : "bg-red-600/20 border border-red-500/30 text-red-200"
            }`}>
              {message}
            </div>
          )}

          {/* Analysis Link */}
          {showAnalysisLink && uploadedFile && (
            <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
              <h3 className="text-xl font-semibold text-white mb-4">File Uploaded Successfully!</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-600/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Rows</p>
                  <p className="text-white font-semibold text-lg">{uploadedFile.file?.rowCount ?? '-'}</p>
                </div>
                <div className="bg-slate-600/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Columns</p>
                  <p className="text-white font-semibold text-lg">{uploadedFile.file?.columnCount ?? '-'}</p>
                </div>
                <div className="bg-slate-600/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">File Name</p>
                  <p className="text-white font-semibold text-lg">{uploadedFile.file?.originalName ?? '-'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/analysis/${uploadedFile.file?.id}`)}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Analyze Data
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Upload;
