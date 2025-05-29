// license-server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const LICENSE_FILE = path.join(__dirname, "licenses.json");

// Load lisensi
function loadLicenses() {
  if (!fs.existsSync(LICENSE_FILE)) return [];
  return JSON.parse(fs.readFileSync(LICENSE_FILE));
}

// Simpan lisensi
function saveLicenses(data) {
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/activate", (req, res) => {
  const { licenseKey, deviceId } = req.body;
  if (!licenseKey || !deviceId) {
    return res.status(400).json({ error: "licenseKey dan deviceId wajib diisi" });
  }

  const licenses = loadLicenses();
  const lic = licenses.find(l => l.licenseKey === licenseKey);

  if (!lic) return res.status(404).json({ error: "Lisensi tidak ditemukan" });
  if (!lic.active) return res.status(403).json({ error: "Lisensi tidak aktif" });

  // Jika belum dikaitkan ke device, kaitkan sekarang
  if (!lic.deviceId) {
    lic.deviceId = deviceId;
  }

  // Jika device tidak cocok
  if (lic.deviceId !== deviceId) {
    return res.status(403).json({ error: "Lisensi sudah digunakan di perangkat lain" });
  }

  return res.json({ success: true, expiresAt: lic.expiresAt });
});

// Endpoint admin buat lisensi baru
app.post("/api/create", (req, res) => {
  const { licenseKey, expiresAt } = req.body;
  const licenses = loadLicenses();
  if (licenses.find(l => l.licenseKey === licenseKey)) {
    return res.status(400).json({ error: "License key sudah ada" });
  }
  licenses.push({
    licenseKey,
    expiresAt,
    active: true,
    deviceId: null
  });
  saveLicenses(licenses);
  return res.json({ success: true });
});

app.listen(3000, () => console.log("🚀 License server running at http://localhost:3000"));
