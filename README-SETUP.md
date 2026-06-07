# FinFusion V2 - Setup Complete! 🎉

## Project Overview

**FinFusion** is a full-stack financial analytics application with:
- **Backend**: FastAPI (Python) with SQLite database
- **Frontend**: React with Tailwind CSS + Shadcn UI
- **Features**: Expense tracking, budget management, LSTM forecasting, receipt OCR scanning

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.110.1
- **Database**: SQLAlchemy 2.0.49 + SQLite
- **Data Science**: Pandas, NumPy, Scikit-learn, SciPy
- **Auth**: BCrypt + PyJWT
- **OCR**: Pytesseract + Pillow
- **Python Version**: 3.11.9

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router DOM 7.5.1
- **UI Components**: Radix UI + Shadcn
- **Styling**: Tailwind CSS 3.4.17
- **Charts**: Recharts 3.6.0
- **Build Tool**: CRACO (Create React App Configuration Override)
- **Node Version**: v24.13.1

---

## Quick Start

### Option 1: Run Everything at Once (Recommended)
```cmd
START_PROJECT.bat
```

This will:
1. Start the backend server on http://localhost:8000
2. Start the frontend server on http://localhost:3000
3. Open both in separate command windows

### Option 2: Run Separately

**Backend** (Terminal 1):
```cmd
cd FinFusion-V2-main\backend
start.bat
```

**Frontend** (Terminal 2):
```cmd
cd FinFusion-V2-main\frontend
npm start
```

---

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/api/health

---

## Demo Accounts

Demo seeding has been removed. Sign up with any email to get a clean account. All analytics are driven exclusively by your own expenses.

---

## Project Structure

```
FinFusion-V2-main/
├── backend/
│   ├── venv/                # Python virtual environment
│   ├── .env                 # Backend environment variables
│   ├── server.py            # FastAPI application entry point
│   ├── database.py          # SQLAlchemy database setup
│   ├── models.py            # Database models (User, Expense, etc.)
│   ├── auth.py              # JWT authentication
│   ├── middleware.py        # Auth middleware
│   ├── init_demo.py         # Demo data initialization
│   ├── requirements.txt     # Full Python dependencies
│   ├── requirements-local.txt  # Windows-compatible subset
│   ├── routes/              # API endpoints
│   │   ├── auth_routes.py
│   │   ├── user_routes.py
│   │   ├── expense_routes.py
│   │   ├── analytics_routes.py
│   │   └── insights_routes.py
│   ├── services/            # Business logic
│   │   ├── insights_engine.py  # Analytics engine
│   │   └── lstm_forecaster.py  # ML forecasting (requires TensorFlow)
│   ├── utils/               # Helper functions
│   │   ├── query_helpers.py
│   │   └── ocr.py           # Receipt OCR (requires Tesseract)
│   ├── data/                # Dataset
│   │   └── budgetwise.csv
│   └── db.sqlite3           # SQLite database (auto-created)
│
├── frontend/
│   ├── .env                 # Frontend environment variables
│   ├── package.json         # NPM dependencies
│   ├── craco.config.js      # Build configuration
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React contexts
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utility functions
│   │   └── utils/           # Helper functions
│   └── public/              # Static assets
│
├── START_PROJECT.bat        # Start both servers
└── README-SETUP.md          # This file
```

---

## Environment Configuration

### Backend (`.env`)
```
JWT_SECRET_KEY=finfusion-secret-key-change-in-production-please
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
DATABASE_URL=sqlite:///./db.sqlite3
DATASET_PATH=./data/budgetwise.csv
```

### Frontend (`.env`)
```
REACT_APP_API_URL=http://localhost:8000
```

---

## Features

### Core Features
- ✅ User authentication (signup/login)
- ✅ Expense tracking & management
- ✅ Budget management with custom categories
- ✅ Analytics dashboard
- ✅ Historical trends & insights
- ✅ Forecasting (30-day predictions)
- ✅ Receipt OCR scanning (requires Tesseract)
- ✅ Demo data mode

### Advanced Features
- LSTM-based forecasting (disabled - requires TensorFlow)
- Anomaly detection
- Category-wise budget tracking
- Multi-user support with data isolation

---

## Optional: OCR Setup (Tesseract)

Receipt scanning requires Tesseract OCR. To install:

1. Download Tesseract for Windows:
   https://github.com/UB-Mannheim/tesseract/wiki

2. Install and add to PATH, or the backend will auto-detect common install locations:
   - `C:\Program Files\Tesseract-OCR\tesseract.exe`
   - `/opt/homebrew/bin/tesseract` (macOS)

3. Restart the backend server

---

## Optional: LSTM Forecasting (TensorFlow)

Advanced ML forecasting is disabled by default because TensorFlow is platform-specific.

**To enable (advanced users only)**:

1. For macOS (Apple Silicon):
   ```cmd
   backend\venv\Scripts\pip.exe install tensorflow-macos==2.15.0 tensorflow-metal==1.1.0
   ```

2. For Windows/Linux:
   ```cmd
   backend\venv\Scripts\pip.exe install tensorflow==2.15.0
   ```

3. Restart the backend

The application will automatically use LSTM forecasting when TensorFlow is available, otherwise it falls back to statistical forecasting.

---

## Troubleshooting

### Backend won't start
```cmd
cd backend
venv\Scripts\python.exe server.py
```

Check for errors in the output.

### Frontend won't start
```cmd
cd frontend
npm install
npm start
```

### Port already in use
Kill processes using ports 8000 or 3000:
```cmd
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### Database errors
Delete `backend/db.sqlite3` and restart the backend to recreate it.

### CORS errors
Verify frontend .env has correct API URL: `REACT_APP_API_URL=http://localhost:8000`

---

## Development Commands

### Backend
```cmd
# Activate virtual environment
cd backend
venv\Scripts\activate.bat

# Install new package
pip install <package-name>

# Update requirements
pip freeze > requirements-local.txt

# Run database migrations (if needed)
python -c "from database import init_db; init_db()"

# Test API endpoint
curl http://localhost:8000/api/health
```

### Frontend
```cmd
cd frontend

# Install new package
npm install <package-name>

# Build for production
npm run build

# Run linting
npm run lint
```

---

## Next Steps

1. ✅ Open http://localhost:3000
2. ✅ Sign up with any email to get a clean account
3. ✅ Add your own expenses and explore analytics
4. ✅ Try the forecasting feature
5. ✅ (Optional) Install Tesseract for receipt scanning
6. ✅ (Optional) Install TensorFlow for LSTM forecasting

---

## Notes

- **Tesseract OCR**: Not installed. Receipt scanning will not work until Tesseract is installed.
- **TensorFlow**: Not installed. LSTM forecasting is disabled, falling back to statistical forecasting.
- **Database**: SQLite (file-based). For production, use PostgreSQL.
- **Security**: Change JWT_SECRET_KEY in production!

---

## Support

For issues or questions, check:
- Backend logs in the terminal
- Frontend console in browser DevTools (F12)
- API documentation: http://localhost:8000/docs

---

**Enjoy building with FinFusion! 🚀**
