<<<<<<< HEAD
=======

>>>>>>> 7983f9c890bd4389dcdae986c50a32166ce5fb07
<h1 align="center">📊 Excel Data Analyzer</h1>
<p align="center">
  A modern MERN-based platform to upload Excel files, visualize data, and explore analytics through an interactive dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/MERN-Stack-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Vite-React-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/TailwindCSS-CSS-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square" />
</p>

---

## 🚀 Tech Stack

**Frontend:**
- Vite + React.js
- Tailwind CSS
- Chart.js
- Axios
- React Router

**Backend:**
- Node.js + Express.js
- MongoDB (Mongoose)
- Multer (for file uploads)
- XLSX (Excel parser)
- JWT + Bcrypt (Authentication)

---

## ✅ Features Completed So Far

### 🔐 Authentication System
- Secure user registration and login.
- Passwords hashed with Bcrypt.
- JWT token-based session management.

### 📁 Excel Upload
- Upload `.xls` or `.xlsx` files via clean UI.
- Backend parses and stores the data securely.
- Validations for file type and size.

### 🧮 Dashboard / Home
- Personalized dashboard view for each user.
- Displays uploaded file list with metadata.
- Interactive 2D visualizations using Chart.js.
- Modern responsive design via Tailwind CSS.

---

## 📁 Project Structure

### Frontend
```

client/
├── components/
│   ├── Navbar.jsx
│   ├── FileUpload.jsx
│   └── ChartDisplay.jsx
├── pages/
│   ├── Home.jsx
│   ├── Login.jsx
│   └── Register.jsx
├── services/
│   └── api.js
├── App.jsx
└── main.jsx

```

### Backend
```

server/
├── controllers/
│   └── fileController.js
├── routes/
│   ├── authRoutes.js
│   └── fileRoutes.js
├── middleware/
│   └── authMiddleware.js
├── models/
│   ├── User.js
│   └── File.js
├── utils/
│   └── excelParser.js
├── server.js
└── .env

````

---

## 🛠️ Getting Started

### 🔧 Prerequisites
- Node.js & npm
- MongoDB (local or Atlas)
- Vite CLI (optional but recommended)

### 📦 Installation

#### 1. Clone the repo
```bash
git clone https://github.com/your-username/excel-analyzer.git
cd excel-analyzer
````

#### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

#### 3. Backend Setup

```bash
cd server
npm install
npm run dev
```

> Ensure you have a `.env` file configured with your MongoDB URI and JWT secret.

---

## 🚧 Upcoming Features

* 📈 3D Chart Rendering (Three.js)
* 🧠 AI Insights for uploaded Excel data
* ⬇️ Export charts/images as PDF
* 📜 Upload history with search & filters
* 🧑‍💼 Admin dashboard with analytics

---

## 🤝 Contributing

Pull requests are welcome!
Feel free to fork, clone, and enhance this project.

---

> Built with 💡 passion and 📂 data.

```

