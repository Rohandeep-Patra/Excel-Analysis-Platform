// Delete file
router.delete("/:fileId", auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // Find the file
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Get all related history entries before deletion
    const relatedHistory = await FileHistory.find({ fileId, userId });

    // Log comprehensive deletion history
    const historyEntry = new FileHistory({
      userId,
      fileId: file._id,
      fileName: file.originalName,
      action: 'file_deleted',
      fileSize: file.size,
      rowCount: file.rowCount,
      columnCount: file.columnCount,
      sessionId: req.sessionID || `session_${Date.now()}`,
      tags: ['file_deletion', 'permanent_removal'],
      relatedActivities: relatedHistory.map(h => h._id),
      metadata: {
        browser: req.headers['user-agent'],
        ipAddress: req.ip,
        screenResolution: req.headers['sec-ch-viewport-width'] ? 
          `${req.headers['sec-ch-viewport-width']}x${req.headers['sec-ch-viewport-height']}` : 'Unknown',
        timeSpent: 0,
        chartCount: relatedHistory.filter(h => h.action === 'chart_created').length,
        downloadCount: relatedHistory.filter(h => ['pdf_downloaded', 'csv_exported', 'analysis_downloaded'].includes(h.action)).length,
        analysisCount: relatedHistory.filter(h => h.action === 'analysis').length
      }
    });

    await historyEntry.save();

    // Delete the file from storage
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete the file record from database
    await File.findByIdAndDelete(fileId);

    // Update all related history entries to mark them as related to deletion
    if (relatedHistory.length > 0) {
      await FileHistory.updateMany(
        { _id: { $in: relatedHistory.map(h => h._id) } },
        { $push: { relatedActivities: historyEntry._id } }
      );
    }

    res.json({ 
      message: "File deleted successfully",
      deletedFile: {
        id: file._id,
        name: file.originalName,
        size: file.size,
        relatedActivities: relatedHistory.length
      },
      historyId: historyEntry._id
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Server error" });
  }
}); 