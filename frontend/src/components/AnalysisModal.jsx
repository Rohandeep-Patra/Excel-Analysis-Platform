const handleAnalyze = async () => {
  if (!selectedFile || !selectedChartType || !selectedAxes.xAxis || !selectedAxes.yAxis) {
    toast.error("Please select a file, chart type, and axes");
    return;
  }

  setIsAnalyzing(true);
  try {
    const response = await fetch(`/api/analysis/${selectedFile._id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysisType: "basic_stats",
        chartType: selectedChartType,
        selectedAxes,
        chartConfig: {
          title: `${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart`,
          description: `Analysis of ${selectedAxes.xAxis} vs ${selectedAxes.yAxis}`,
          colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              title: { display: true, text: `${selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} Chart` }
            }
          }
        }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setAnalysisResults(data.analysis);
      setChartData(data.analysis.chartData);
      setShowResults(true);
      
      // Log analysis history
      await logAnalysisHistory(data.analysis, data.historyId);
      
      toast.success("Analysis completed successfully!");
    } else {
      const error = await response.json();
      toast.error(error.error || "Analysis failed");
    }
  } catch (error) {
    console.error("Analysis error:", error);
    toast.error("Analysis failed");
  } finally {
    setIsAnalyzing(false);
  }
};

const logAnalysisHistory = async (analysis, historyId) => {
  try {
    // The backend already logs the analysis history, but we can add additional frontend logging if needed
    console.log('Analysis completed:', {
      analysisId: analysis.id,
      historyId: historyId,
      chartType: selectedChartType,
      selectedAxes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging analysis history:', error);
  }
}; 