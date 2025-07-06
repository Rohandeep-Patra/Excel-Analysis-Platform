// Download analysis as PDF
router.post("/pdf", auth, async (req, res) => {
  try {
    const { fileId, analysisData, chartData, fileName } = req.body;

    // Find the file
    const file = await File.findOne({ _id: fileId, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF(analysisData, chartData, fileName || file.originalName);
    
    // Create download filename
    const downloadFileName = `${fileName || file.originalName.replace(/\.[^/.]+$/, "")}_analysis_${Date.now()}.pdf`;
    const downloadSize = pdfBuffer.length;

    // Log comprehensive download history
    const historyEntry = new FileHistory({
      userId: req.user.id,
      fileId: file._id,
      fileName: file.originalName,
      action: 'analysis_downloaded',
      downloadFormat: 'pdf',
      downloadFileName,
      downloadSize,
      downloadUrl: `/downloads/${downloadFileName}`,
      fileSize: file.size,
      rowCount: file.rowCount,
      columnCount: file.columnCount,
      sessionId: req.sessionID || `session_${Date.now()}`,
      tags: ['pdf_download', 'analysis_export'],
      metadata: {
        browser: req.headers['user-agent'],
        ipAddress: req.ip,
        screenResolution: req.headers['sec-ch-viewport-width'] ? 
          `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : 'Unknown',
        timeSpent: 0,
        chartCount: chartData ? 1 : 0,
        downloadCount: 1,
        analysisCount: 1
      }
    });

    await historyEntry.save();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', downloadSize);

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF download error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Download data as CSV
router.post("/csv", auth, async (req, res) => {
  try {
    const { fileId, selectedColumns, fileName } = req.body;

    // Find the file
    const file = await File.findOne({ _id: fileId, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Generate CSV
    const csvData = generateCSV(file.data, file.headers, selectedColumns);
    const csvBuffer = Buffer.from(csvData, 'utf-8');
    
    // Create download filename
    const downloadFileName = `${fileName || file.originalName.replace(/\.[^/.]+$/, "")}_export_${Date.now()}.csv`;
    const downloadSize = csvBuffer.length;

    // Log comprehensive download history
    const historyEntry = new FileHistory({
      userId: req.user.id,
      fileId: file._id,
      fileName: file.originalName,
      action: 'csv_exported',
      downloadFormat: 'csv',
      downloadFileName,
      downloadSize,
      downloadUrl: `/downloads/${downloadFileName}`,
      fileSize: file.size,
      rowCount: file.rowCount,
      columnCount: file.columnCount,
      sessionId: req.sessionID || `session_${Date.now()}`,
      tags: ['csv_export', 'data_export'],
      metadata: {
        browser: req.headers['user-agent'],
        ipAddress: req.ip,
        screenResolution: req.headers['sec-ch-viewport-width'] ? 
          `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : 'Unknown',
        timeSpent: 0,
        chartCount: 0,
        downloadCount: 1,
        analysisCount: 0
      }
    });

    await historyEntry.save();

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', downloadSize);

    res.send(csvBuffer);
  } catch (error) {
    console.error("CSV download error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Download chart as image
router.post("/chart", auth, async (req, res) => {
  try {
    const { fileId, chartData, chartType, format = 'png', fileName } = req.body;

    // Find the file
    const file = await File.findOne({ _id: fileId, userId: req.user.id });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Generate chart image
    const imageBuffer = await generateChartImage(chartData, chartType, format);
    
    // Create download filename
    const downloadFileName = `${fileName || file.originalName.replace(/\.[^/.]+$/, "")}_${chartType}_chart_${Date.now()}.${format}`;
    const downloadSize = imageBuffer.length;

    // Log comprehensive download history
    const historyEntry = new FileHistory({
      userId: req.user.id,
      fileId: file._id,
      fileName: file.originalName,
      action: 'analysis_downloaded',
      downloadFormat: format,
      downloadFileName,
      downloadSize,
      downloadUrl: `/downloads/${downloadFileName}`,
      chartType,
      fileSize: file.size,
      rowCount: file.rowCount,
      columnCount: file.columnCount,
      sessionId: req.sessionID || `session_${Date.now()}`,
      tags: ['chart_download', `${format}_export`, chartType],
      metadata: {
        browser: req.headers['user-agent'],
        ipAddress: req.ip,
        screenResolution: req.headers['sec-ch-viewport-width'] ? 
          `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : 'Unknown',
        timeSpent: 0,
        chartCount: 1,
        downloadCount: 1,
        analysisCount: 1
      }
    });

    await historyEntry.save();

    // Set response headers
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    res.setHeader('Content-Length', downloadSize);

    res.send(imageBuffer);
  } catch (error) {
    console.error("Chart download error:", error);
    res.status(500).json({ error: "Server error" });
  }
}); 