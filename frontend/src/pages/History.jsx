import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { format } from "date-fns";
import { 
  Calendar, 
  FileText, 
  BarChart3, 
  Download, 
  Upload, 
  Trash2, 
  Search, 
  Filter, 
  Eye,
  Clock,
  Activity,
  PieChart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { useNavigate } from "react-router-dom";

const History = () => {
  const user = useSelector((state) => state.auth.user);
  const [history, setHistory] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    chartType: "",
    downloadFormat: "",
    analysisType: "",
    dateFrom: "",
    dateTo: "",
    fileName: ""
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  const actionIcons = {
    upload: <Upload className="w-4 h-4" />,
    analysis: <BarChart3 className="w-4 h-4" />,
    chart_created: <PieChart className="w-4 h-4" />,
    pdf_downloaded: <Download className="w-4 h-4" />,
    csv_exported: <Download className="w-4 h-4" />,
    analysis_downloaded: <Download className="w-4 h-4" />,
    file_deleted: <Trash2 className="w-4 h-4" />
  };

  const actionColors = {
    upload: "bg-blue-100 text-blue-800",
    analysis: "bg-green-100 text-green-800",
    chart_created: "bg-purple-100 text-purple-800",
    pdf_downloaded: "bg-red-100 text-red-800",
    csv_exported: "bg-orange-100 text-orange-800",
    analysis_downloaded: "bg-indigo-100 text-indigo-800",
    file_deleted: "bg-gray-100 text-gray-800"
  };

  const statusIcons = {
    completed: <CheckCircle className="w-4 h-4 text-green-500" />,
    in_progress: <Clock className="w-4 h-4 text-yellow-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    cancelled: <XCircle className="w-4 h-4 text-gray-500" />
  };

  // Dropdown options
  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'upload', label: 'File Upload' },
    { value: 'analysis', label: 'Analysis' },
    { value: 'chart_created', label: 'Chart Created' },
    { value: 'pdf_downloaded', label: 'PDF Download' },
    { value: 'csv_exported', label: 'CSV Export' },
    { value: 'analysis_downloaded', label: 'Analysis Download' },
    { value: 'file_deleted', label: 'File Deleted' },
  ];
  const chartTypeOptions = [
    { value: '', label: 'All Chart Types' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'doughnut', label: 'Doughnut Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'radar', label: 'Radar Chart' },
    { value: 'bubble', label: 'Bubble Chart' },
  ];
  const downloadFormatOptions = [
    { value: '', label: 'All Formats' },
    { value: 'pdf', label: 'PDF' },
    { value: 'csv', label: 'CSV' },
    { value: 'excel', label: 'Excel' },
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
  ];
  const analysisTypeOptions = [
    { value: '', label: 'All Analysis Types' },
    { value: 'basic_stats', label: 'Basic Statistics' },
    { value: 'correlation', label: 'Correlation Analysis' },
    { value: 'trend_analysis', label: 'Trend Analysis' },
    { value: 'outlier_detection', label: 'Outlier Detection' },
    { value: 'custom', label: 'Custom Analysis' },
  ];

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: pagination.itemsPerPage,
        ...filters
      });

      const response = await fetch(`/api/history/user?${queryParams}`, {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token")
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setPagination(data.pagination);
      } else {
        console.error("Failed to fetch history:", response.status);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/history/stats", {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": localStorage.getItem("token")
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Failed to fetch stats:", response.status);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHistory();
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page) => {
    fetchHistory(page);
  };

  const openModal = (entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEntry(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "MMM dd, yyyy HH:mm:ss");
  };

  const getTimeSpent = (entry) => {
    if (!entry.metadata?.timeSpent) return "N/A";
    const minutes = Math.floor(entry.metadata.timeSpent / 60);
    const seconds = entry.metadata.timeSpent % 60;
    return `${minutes}m ${seconds}s`;
  };

  const refreshData = () => {
    fetchHistory();
    fetchStats();
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 mb-8 rounded-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-white">Activity History</h1>
                <p className="text-slate-400 mt-1">Track all your file and analysis activities</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshData}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => navigate("/home")}
                  className="bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg transition-all duration-300 border border-slate-600 hover:border-slate-500"
                >
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Actions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalActions || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Files Processed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFiles || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Charts Created</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCharts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Download className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Downloads</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDownloads || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <Listbox value={filters.action} onChange={val => handleFilterChange('action', val)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
                        <span>{actionOptions.find(o => o.value === filters.action)?.label}</span>
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={React.Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                          {actionOptions.map(option => (
                            <Listbox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                      <CheckIcon className="w-5 h-5" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chart Type
                </label>
                <Listbox value={filters.chartType} onChange={val => handleFilterChange('chartType', val)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
                        <span>{chartTypeOptions.find(o => o.value === filters.chartType)?.label}</span>
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={React.Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                          {chartTypeOptions.map(option => (
                            <Listbox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                      <CheckIcon className="w-5 h-5" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Download Format
                </label>
                <Listbox value={filters.downloadFormat} onChange={val => handleFilterChange('downloadFormat', val)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
                        <span>{downloadFormatOptions.find(o => o.value === filters.downloadFormat)?.label}</span>
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={React.Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                          {downloadFormatOptions.map(option => (
                            <Listbox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                      <CheckIcon className="w-5 h-5" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Type
                </label>
                <Listbox value={filters.analysisType} onChange={val => handleFilterChange('analysisType', val)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center">
                        <span>{analysisTypeOptions.find(o => o.value === filters.analysisType)?.label}</span>
                        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
                      </Listbox.Button>
                      <Transition
                        show={open}
                        as={React.Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                          {analysisTypeOptions.map(option => (
                            <Listbox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none relative py-2 pl-10 pr-4 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'}`
                              }
                            >
                              {({ selected }) => (
                                <>
                                  <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{option.label}</span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                      <CheckIcon className="w-5 h-5" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  value={filters.fileName}
                  onChange={(e) => handleFilterChange("fileName", e.target.value)}
                  placeholder="Search by file name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* History Display */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Activities</h2>
            {loading && (
              <div className="flex items-center text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Loading...
              </div>
            )}
          </div>

          {Object.keys(history).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Activity className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-400">No activities found. Start by uploading a file or generating charts!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(history).map(([date, entries]) => (
                <div key={date} className="border border-slate-700/50 rounded-lg overflow-hidden">
                  <div className="bg-slate-700/30 px-4 py-2">
                    <h3 className="text-white font-semibold">{new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</h3>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {entries.map((entry, index) => (
                      <div key={entry._id || index} className="p-4 hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${actionColors[entry.action] || 'bg-gray-100 text-gray-800'}`}>
                              {actionIcons[entry.action] || <Activity className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-white font-medium">
                                  {entry.action === 'upload' && 'File Uploaded'}
                                  {entry.action === 'analysis' && 'Analysis Performed'}
                                  {entry.action === 'chart_created' && 'Chart Generated'}
                                  {entry.action === 'pdf_downloaded' && 'PDF Downloaded'}
                                  {entry.action === 'csv_exported' && 'CSV Exported'}
                                  {entry.action === 'file_deleted' && 'File Deleted'}
                                  {entry.action || 'Activity'}
                                </span>
                                {entry.chartType && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    {entry.chartType.toUpperCase()}
                                  </span>
                                )}
                                {entry.downloadFormat && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {entry.downloadFormat.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-300 text-sm mb-1">
                                {entry.fileName || 'Unknown file'}
                              </p>
                              {entry.selectedAxes && (
                                <p className="text-slate-400 text-xs">
                                  {entry.selectedAxes.xAxis} vs {entry.selectedAxes.yAxis}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <span>{formatTimestamp(entry.createdAt)}</span>
                                {entry.fileSize && (
                                  <span>{formatFileSize(entry.fileSize)}</span>
                                )}
                                {entry.rowCount && (
                                  <span>{entry.rowCount} rows</span>
                                )}
                                {entry.columnCount && (
                                  <span>{entry.columnCount} columns</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openModal(entry)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    page === pagination.currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Activity Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">File Name</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.fileName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Action</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.action.replace(/_/g, ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900 flex items-center">
                        {selectedEntry.status && statusIcons[selectedEntry.status]}
                        <span className="ml-1">{selectedEntry.status}</span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created At</dt>
                      <dd className="text-sm text-gray-900">{formatTimestamp(selectedEntry.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">File Details</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">File Size</dt>
                      <dd className="text-sm text-gray-900">{formatFileSize(selectedEntry.fileSize)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Rows</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.rowCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Columns</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.columnCount}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Session ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedEntry.sessionId}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              {selectedEntry.chartType && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Chart Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Chart Type</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.chartType}</dd>
                    </div>
                    {selectedEntry.selectedAxes && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Selected Axes</dt>
                        <dd className="text-sm text-gray-900">
                          X: {selectedEntry.selectedAxes.xAxis}, Y: {selectedEntry.selectedAxes.yAxis}
                          {selectedEntry.selectedAxes.zAxis && `, Z: ${selectedEntry.selectedAxes.zAxis}`}
                        </dd>
                      </div>
                    )}
                    {selectedEntry.chartId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Chart ID</dt>
                        <dd className="text-sm text-gray-900 font-mono">{selectedEntry.chartId}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {selectedEntry.downloadFormat && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Download Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Format</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.downloadFormat.toUpperCase()}</dd>
                    </div>
                    {selectedEntry.downloadFileName && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Download File Name</dt>
                        <dd className="text-sm text-gray-900">{selectedEntry.downloadFileName}</dd>
                      </div>
                    )}
                    {selectedEntry.downloadSize && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Download Size</dt>
                        <dd className="text-sm text-gray-900">{formatFileSize(selectedEntry.downloadSize)}</dd>
                      </div>
                    )}
                    {selectedEntry.downloadTime && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Download Time</dt>
                        <dd className="text-sm text-gray-900">{formatTimestamp(selectedEntry.downloadTime)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {selectedEntry.analysisType && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Analysis Information</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Analysis Type</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.analysisType.replace(/_/g, ' ')}</dd>
                    </div>
                    {selectedEntry.analysisId && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Analysis ID</dt>
                        <dd className="text-sm text-gray-900 font-mono">{selectedEntry.analysisId}</dd>
                      </div>
                    )}
                    {selectedEntry.analysisTime && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Analysis Time</dt>
                        <dd className="text-sm text-gray-900">{formatTimestamp(selectedEntry.analysisTime)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {selectedEntry.metadata && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Metadata</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Browser</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.metadata.browser}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                      <dd className="text-sm text-gray-900">{selectedEntry.metadata.ipAddress}</dd>
                    </div>
                    {selectedEntry.metadata.screenResolution && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Screen Resolution</dt>
                        <dd className="text-sm text-gray-900">{selectedEntry.metadata.screenResolution}</dd>
                      </div>
                    )}
                    {selectedEntry.metadata.timeSpent > 0 && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Time Spent</dt>
                        <dd className="text-sm text-gray-900">{getTimeSpent(selectedEntry)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
              
              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEntry.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEntry.errorMessage && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3 text-red-600">Error Information</h4>
                  <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedEntry.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History; 