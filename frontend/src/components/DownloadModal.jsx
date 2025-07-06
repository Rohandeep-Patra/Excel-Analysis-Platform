const handleDownload = async (format) => {
  if (!selectedFile) {
    toast.error("No file selected");
    return;
  }

  setIsDownloading(true);
  try {
    let response;
    let downloadData = {};

    switch (format) {
      case 'pdf':
        response = await fetch('/api/download/pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: selectedFile._id,
            analysisData: analysisResults,
            chartData: chartData,
            fileName: selectedFile.originalName
          }),
        });
        break;

      case 'csv':
        response = await fetch('/api/download/csv', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: selectedFile._id,
            selectedColumns: selectedFile.headers,
            fileName: selectedFile.originalName
          }),
        });
        break;

      case 'png':
      case 'jpg':
        response = await fetch('/api/download/chart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: selectedFile._id,
            chartData: chartData,
            chartType: chartType,
            format: format,
            fileName: selectedFile.originalName
          }),
        });
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.originalName.replace(/\.[^/.]+$/, "")}_${format}_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Log download history
      await logDownloadHistory(format, blob.size, a.download);
      
      toast.success(`${format.toUpperCase()} download completed!`);
      onClose();
    } else {
      const error = await response.json();
      toast.error(error.error || `Failed to download ${format.toUpperCase()}`);
    }
  } catch (error) {
    console.error(`Download error (${format}):`, error);
    toast.error(`Failed to download ${format.toUpperCase()}`);
  } finally {
    setIsDownloading(false);
  }
};

const logDownloadHistory = async (format, fileSize, fileName) => {
  try {
    // The backend already logs the download history, but we can add additional frontend logging if needed
    console.log('Download completed:', {
      format: format,
      fileSize: fileSize,
      fileName: fileName,
      fileId: selectedFile._id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging download history:', error);
  }
}; 