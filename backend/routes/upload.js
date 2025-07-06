const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const auth = require("../middlewares/auth");

router.post("/excel", auth, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File not uploaded" });
  res.status(200).json({ message: "File uploaded", file: req.file.filename });
});

module.exports = router;
