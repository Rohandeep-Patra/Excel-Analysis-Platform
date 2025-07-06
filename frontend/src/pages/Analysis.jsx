import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import jsPDF from 'jspdf';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analysis = () => {
  const { fileId } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("bar");
  const [currentChart, setCurrentChart] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);
  const [showChartTypeDropdown, setShowChartTypeDropdown] = useState(false);
  const [notification, setNotification] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchFileData();
    fetchChartHistory();
  }, [fileId]);

  const fetchFileData = async () => {
    try {
      const response = await axios.get(`/api/upload/file/${fileId}`, {
        headers: { 'x-auth-token': token }
      });
      setFileData(response.data.file);
      
      // Set initial axes if data is available
      if (response.data.file.allSheets && response.data.file.allSheets.length > 0) {
        const firstSheet = response.data.file.allSheets[0];
        if (firstSheet.headers && firstSheet.headers.length > 0) {
          setXAxis(firstSheet.headers[0]);
          setYAxis(firstSheet.headers.length > 1 ? firstSheet.headers[1] : firstSheet.headers[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching file data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartHistory = async () => {
    try {
      const response = await axios.get(`/api/analysis/file/${fileId}/charts`, {
        headers: { 'x-auth-token': token }
      });
      setChartHistory(response.data.charts);
    } catch (error) {
      console.error("Error fetching chart history:", error);
    }
  };

  const generateChart = async () => {
    if (!xAxis || !yAxis) {
      alert("Please select both X and Y axes");
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/analysis/chart', {
        fileId,
        chartType,
        xAxis,
        yAxis,
        sheetName: selectedSheet
      }, {
        headers: { 'x-auth-token': token }
      });

      setCurrentChart(response.data.chartData);
      await fetchChartHistory(); // Refresh chart history
    } catch (error) {
      console.error("Error generating chart:", error);
      alert("Error generating chart: " + (error.response?.data?.error || error.message));
    } finally {
      setGenerating(false);
    }
  };

  const downloadChart = async (format = 'png') => {
    if (!chartRef.current) return;

    const canvas = chartRef.current.canvas;
    const link = document.createElement('a');
    
    if (format === 'png') {
      link.download = `${fileData?.originalName}_${chartType}_chart.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } else if (format === 'pdf') {
      await generatePDFReport();
    }
  };

  const exportDataAsCSV = () => {
    if (!currentChart || !currentChart.labels || !currentChart.datasets) {
      setNotification({
        type: 'error',
        message: 'No chart data available for export.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const labels = currentChart.labels;
      const data = currentChart.datasets[0].data;
      
      // Create CSV content
      const csvContent = [
        [xAxis, yAxis], // Headers
        ...labels.map((label, index) => [label, data[index]])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileData?.originalName?.replace(/\.[^/.]+$/, '')}_${chartType}_data.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification({
        type: 'success',
        message: 'Data exported as CSV successfully!'
      });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('Error exporting CSV:', error);
      setNotification({
        type: 'error',
        message: 'Error exporting data as CSV.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const generatePDFReport = async () => {
    setGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('Excel Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add file information
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99); // Gray color
      pdf.text(`File: ${fileData?.originalName}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Analysis Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Chart Type: ${chartType.toUpperCase()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`X-Axis: ${xAxis}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Y-Axis: ${yAxis}`, margin, yPosition);
      yPosition += 15;

      // Add file statistics
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('File Statistics', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Total Rows: ${fileData?.stats?.rowCount || 0}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total Columns: ${fileData?.stats?.columnCount || 0}`, margin, yPosition);
      yPosition += 6;
      pdf.text(`Total Sheets: ${fileData?.stats?.sheetCount || 0}`, margin, yPosition);
      yPosition += 15;

      // Add chart
      if (chartRef.current) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Chart Visualization', margin, yPosition);
        yPosition += 10;

        // Convert chart to image
        const chartCanvas = chartRef.current.canvas;
        const chartImage = chartCanvas.toDataURL('image/png');
        
        // Calculate chart dimensions to fit on page
        const chartWidth = pageWidth - (2 * margin);
        const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
        
        // Check if chart fits on current page, if not add new page
        if (yPosition + chartHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.addImage(chartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
        yPosition += chartHeight + 15;
      }

      // Add data summary if available
      if (currentChart && currentChart.datasets && currentChart.datasets[0]) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Data Summary', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);

        const data = currentChart.datasets[0].data;
        if (Array.isArray(data)) {
          const numericData = data.filter(val => typeof val === 'number');
          if (numericData.length > 0) {
            const sum = numericData.reduce((a, b) => a + b, 0);
            const avg = sum / numericData.length;
            const max = Math.max(...numericData);
            const min = Math.min(...numericData);

            pdf.text(`Data Points: ${data.length}`, margin, yPosition);
            yPosition += 6;
            pdf.text(`Sum: ${sum.toFixed(2)}`, margin, yPosition);
            yPosition += 6;
            pdf.text(`Average: ${avg.toFixed(2)}`, margin, yPosition);
            yPosition += 6;
            pdf.text(`Maximum: ${max.toFixed(2)}`, margin, yPosition);
            yPosition += 6;
            pdf.text(`Minimum: ${min.toFixed(2)}`, margin, yPosition);
            yPosition += 15;
          }
        }
      }

      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(156, 163, 175);
      pdf.text('Generated by Excel Analysis Platform', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      const fileName = `${fileData?.originalName?.replace(/\.[^/.]+$/, '')}_analysis_report.pdf`;
      pdf.save(fileName);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'PDF report generated successfully!'
      });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('Error generating PDF:', error);
      setNotification({
        type: 'error',
        message: 'Error generating PDF report. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateComprehensiveReport = async () => {
    setGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Add title page
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Excel Analysis Platform', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      pdf.setFontSize(18);
      pdf.setTextColor(75, 85, 99);
      pdf.text('Comprehensive Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 30;

      // Add file information
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('File Information', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);
      pdf.text(`File Name: ${fileData?.originalName}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Analysis Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Total Rows: ${fileData?.stats?.rowCount || 0}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Total Columns: ${fileData?.stats?.columnCount || 0}`, margin, yPosition);
      yPosition += 8;
      pdf.text(`Total Sheets: ${fileData?.stats?.sheetCount || 0}`, margin, yPosition);
      yPosition += 20;

      // Add current chart analysis
      if (currentChart) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Current Chart Analysis', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        pdf.text(`Chart Type: ${chartType.toUpperCase()}`, margin, yPosition);
        yPosition += 8;
        pdf.text(`X-Axis: ${xAxis}`, margin, yPosition);
        yPosition += 8;
        pdf.text(`Y-Axis: ${yAxis}`, margin, yPosition);
        yPosition += 15;

        // Add chart image
        if (chartRef.current) {
          const chartCanvas = chartRef.current.canvas;
          const chartImage = chartCanvas.toDataURL('image/png');
          
          const chartWidth = pageWidth - (2 * margin);
          const chartHeight = (chartCanvas.height * chartWidth) / chartCanvas.width;
          
          if (yPosition + chartHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(chartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
          yPosition += chartHeight + 15;
        }

        // Add detailed data analysis
        if (currentChart.datasets && currentChart.datasets[0]) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(59, 130, 246);
          pdf.text('Data Analysis', margin, yPosition);
          yPosition += 10;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(75, 85, 99);

          const data = currentChart.datasets[0].data;
          if (Array.isArray(data)) {
            const numericData = data.filter(val => typeof val === 'number');
            if (numericData.length > 0) {
              const sum = numericData.reduce((a, b) => a + b, 0);
              const avg = sum / numericData.length;
              const max = Math.max(...numericData);
              const min = Math.min(...numericData);
              const sortedData = [...numericData].sort((a, b) => a - b);
              const median = sortedData.length % 2 === 0 
                ? (sortedData[sortedData.length / 2 - 1] + sortedData[sortedData.length / 2]) / 2
                : sortedData[Math.floor(sortedData.length / 2)];

              pdf.text(`Data Points: ${data.length}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Sum: ${sum.toFixed(2)}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Average: ${avg.toFixed(2)}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Median: ${median.toFixed(2)}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Maximum: ${max.toFixed(2)}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Minimum: ${min.toFixed(2)}`, margin, yPosition);
              yPosition += 6;
              pdf.text(`Range: ${(max - min).toFixed(2)}`, margin, yPosition);
              yPosition += 15;
            }
          }
        }
      }

      // Add chart history
      if (chartHistory && chartHistory.length > 0) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(59, 130, 246);
        pdf.text('Chart History', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);

        chartHistory.slice(0, 10).forEach((chart, index) => {
          if (yPosition > pageHeight - 50) {
            pdf.addPage();
            yPosition = margin;
          }

          const chartDate = new Date(chart.createdAt).toLocaleDateString();
          pdf.text(`${index + 1}. ${chart.metadata?.chartType || 'Chart'} - ${chartDate}`, margin, yPosition);
          yPosition += 6;
          if (chart.metadata?.xAxis && chart.metadata?.yAxis) {
            pdf.text(`   ${chart.metadata.xAxis} vs ${chart.metadata.yAxis}`, margin + 5, yPosition);
            yPosition += 6;
          }
        });
      }

      // Add data insights
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      pdf.text('Data Insights', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(75, 85, 99);

      // Add insights based on chart type
      const insights = getChartInsights();
      insights.forEach(insight => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(`• ${insight}`, margin, yPosition);
        yPosition += 6;
      });

      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(156, 163, 175);
      pdf.text('Generated by Excel Analysis Platform - Comprehensive Report', pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      const fileName = `${fileData?.originalName?.replace(/\.[^/.]+$/, '')}_comprehensive_analysis.pdf`;
      pdf.save(fileName);

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Comprehensive analysis report generated successfully!'
      });
      setTimeout(() => setNotification(null), 3000);

    } catch (error) {
      console.error('Error generating comprehensive PDF:', error);
      setNotification({
        type: 'error',
        message: 'Error generating comprehensive PDF report. Please try again.'
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setGeneratingPDF(false);
    }
  };

  const getChartInsights = () => {
    const insights = [];
    
    if (!currentChart || !currentChart.datasets || !currentChart.datasets[0]) {
      return ['No chart data available for insights.'];
    }

    const data = currentChart.datasets[0].data;
    if (!Array.isArray(data) || data.length === 0) {
      return ['No data available for analysis.'];
    }

    const numericData = data.filter(val => typeof val === 'number');
    if (numericData.length === 0) {
      return ['No numeric data available for statistical analysis.'];
    }

    const sum = numericData.reduce((a, b) => a + b, 0);
    const avg = sum / numericData.length;
    const max = Math.max(...numericData);
    const min = Math.min(...numericData);

    insights.push(`The dataset contains ${data.length} data points with ${numericData.length} numeric values.`);
    
    if (chartType === 'bar' || chartType === 'line') {
      insights.push(`The ${chartType} chart shows the relationship between ${xAxis} and ${yAxis}.`);
      if (max > avg * 2) {
        insights.push(`There are significant outliers with maximum value of ${max.toFixed(2)}.`);
      }
      if (min < avg * 0.5) {
        insights.push(`The data shows some low values with minimum of ${min.toFixed(2)}.`);
      }
    } else if (chartType === 'pie' || chartType === 'doughnut') {
      insights.push(`The ${chartType} chart displays the distribution of ${yAxis} across different ${xAxis} categories.`);
      insights.push(`The total sum of all values is ${sum.toFixed(2)}.`);
    } else if (chartType === 'scatter') {
      insights.push(`The scatter plot shows the correlation between ${xAxis} and ${yAxis}.`);
      insights.push(`Data points range from ${min.toFixed(2)} to ${max.toFixed(2)}.`);
    }

    if (numericData.length > 10) {
      insights.push(`With ${numericData.length} data points, this analysis provides a good sample size for statistical interpretation.`);
    }

    return insights;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white'
        }
      },
      title: {
        display: true,
        text: `${chartType.toUpperCase()} Chart: ${xAxis} vs ${yAxis}`,
        color: 'white',
        font: {
          size: 16
        }
      }
    },
    scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
      x: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      },
      y: {
        ticks: { color: 'white' },
        grid: { color: 'rgba(255,255,255,0.1)' }
      }
    } : undefined
  };

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', color: 'from-blue-500 to-blue-600', icon: '📊' },
    { value: 'line', label: 'Line Chart', color: 'from-emerald-500 to-emerald-600', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', color: 'from-purple-500 to-purple-600', icon: '🥧' },
    { value: 'doughnut', label: 'Doughnut Chart', color: 'from-pink-500 to-pink-600', icon: '🍩' },
    { value: 'scatter', label: 'Scatter Plot', color: 'from-orange-500 to-orange-600', icon: '🔵' }
  ];

  const getChartTypeColor = (type) => {
    const chartType = chartTypes.find(ct => ct.value === type);
    return chartType ? chartType.color : 'from-slate-500 to-slate-600';
  };

  const getChartTypeIcon = (type) => {
    const chartType = chartTypes.find(ct => ct.value === type);
    return chartType ? chartType.icon : '📊';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading file data...</div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">File not found</div>
      </div>
    );
  }

  // Get current sheet and available columns
  const currentSheet = fileData.allSheets && fileData.allSheets[selectedSheet];
  const availableColumns = currentSheet?.headers || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

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
                <h1 className="text-2xl font-bold text-white">Data Analysis</h1>
                <p className="text-slate-400 text-sm">{fileData.originalName}</p>
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

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-6">Chart Configuration</h2>
              
              {/* Sheet Selection */}
              {fileData.allSheets && fileData.allSheets.length > 1 && (
                <div className="mb-6">
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Select Sheet
                  </label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => {
                      const newSheetIndex = parseInt(e.target.value);
                      setSelectedSheet(newSheetIndex);
                      // Update axes when sheet changes
                      const newSheet = fileData.allSheets[newSheetIndex];
                      if (newSheet && newSheet.headers && newSheet.headers.length > 0) {
                        setXAxis(newSheet.headers[0]);
                        setYAxis(newSheet.headers.length > 1 ? newSheet.headers[1] : newSheet.headers[0]);
                      }
                    }}
                    className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {fileData.allSheets.map((sheet, index) => (
                      <option key={index} value={index}>
                        {sheet.name} ({sheet.totalRows} rows)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Chart Type Selection */}
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Chart Type
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowChartTypeDropdown(!showChartTypeDropdown)}
                    className={`w-full bg-gradient-to-r ${getChartTypeColor(chartType)} hover:opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-between`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2">{getChartTypeIcon(chartType)}</span>
                      {chartTypes.find(ct => ct.value === chartType)?.label}
                    </span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${showChartTypeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showChartTypeDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-slate-700/90 backdrop-blur-lg rounded-lg border border-slate-600/50 shadow-xl">
                      {chartTypes.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => {
                            setChartType(type.value);
                            setShowChartTypeDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-600/50 transition-all duration-300 flex items-center ${
                            chartType === type.value ? 'bg-slate-600/50' : ''
                          }`}
                        >
                          <span className="mr-3 text-lg">{type.icon}</span>
                          <span className="text-white">{type.label}</span>
                          {chartType === type.value && (
                            <svg className="ml-auto w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* X-Axis Selection */}
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  X-Axis
                </label>
                {availableColumns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableColumns.map((column, index) => (
                      <button
                        key={index}
                        onClick={() => setXAxis(column)}
                        className={`p-2 rounded-lg text-sm transition-all duration-300 ${
                          xAxis === column
                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        {column}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm p-3 bg-slate-700/30 rounded-lg">
                    No columns available
                  </div>
                )}
              </div>

              {/* Y-Axis Selection */}
              <div className="mb-6">
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Y-Axis
                </label>
                {availableColumns.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                    {availableColumns.map((column, index) => (
                      <button
                        key={index}
                        onClick={() => setYAxis(column)}
                        className={`p-2 rounded-lg text-sm transition-all duration-300 ${
                          yAxis === column
                            ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        {column}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm p-3 bg-slate-700/30 rounded-lg">
                    No columns available
                  </div>
                )}
              </div>

              {/* Generate Chart Button */}
              <button
                onClick={generateChart}
                disabled={generating || !xAxis || !yAxis}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {generating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating...
                  </div>
                ) : (
                  "Generate Chart"
                )}
              </button>

              {/* Download Buttons */}
              {currentChart && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => downloadChart('png')}
                    disabled={generatingPDF}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    Download PNG
                  </button>
                  <button
                    onClick={() => downloadChart('pdf')}
                    disabled={generatingPDF}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generatingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      'Download PDF Report'
                    )}
                  </button>
                  <button
                    onClick={() => generateComprehensiveReport()}
                    disabled={generatingPDF}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {generatingPDF ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating Full Report...
                      </>
                    ) : (
                      'Download Full Analysis'
                    )}
                  </button>
                  <button
                    onClick={exportDataAsCSV}
                    disabled={generatingPDF}
                    className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed"
                  >
                    Export Data as CSV
                  </button>
                </div>
              )}
            </div>

            {/* File Statistics */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">File Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Rows:</span>
                  <span className="text-white font-semibold">{fileData.stats.rowCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Columns:</span>
                  <span className="text-white font-semibold">{fileData.stats.columnCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Sheets:</span>
                  <span className="text-white font-semibold">{fileData.stats.sheetCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Charts Created:</span>
                  <span className="text-white font-semibold">{chartHistory.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-6">Chart Visualization</h2>
              
              {currentChart ? (
                <div className="h-96">
                  <Chart
                    ref={chartRef}
                    type={chartType}
                    data={currentChart}
                    options={chartOptions}
                  />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-700/50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-slate-400">Configure your chart settings and click "Generate Chart" to visualize your data</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chart History */}
            {chartHistory.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 mt-6">
                <h3 className="text-lg font-bold text-white mb-4">Chart History</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {chartHistory.map((chart, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div>
                        <p className="text-white font-medium">{chart.chartType.toUpperCase()} Chart</p>
                        <p className="text-slate-400 text-sm">{chart.xAxis} vs {chart.yAxis}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(chart.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setCurrentChart(chart.data)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analysis; 