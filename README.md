# VERITY AI – Brand Governance & Compliance Review System

## Project Overview

VERITY AI is an AI-powered brand governance and compliance review application designed to help organizations review content against established brand guidelines, identify potential violations, assess risks, and maintain governance records.

The application provides a centralized interface for managing brand guidelines, reviewing content, monitoring analytics, tracking governance activities, and maintaining audit logs.

## Key Features

- **Guidelines Management:** Upload and manage brand guidelines.
- **Content Reviews:** Review submitted content against established brand guidelines.
- **Risk Assessment:** Identify and categorize potential violations by risk level.
- **Analytics Dashboard:** Monitor review activities and compliance-related metrics.
- **Governance Management:** Track governance decisions and review findings.
- **Audit Logs:** Maintain records of important application activities.
- **User Authentication:** Secure login and user authentication.

## Technology Stack

### Frontend
- React
- JavaScript
- Vite

### Backend
- Python
- FastAPI
- REST API

### Database
- PostgreSQL
- SQLite (legacy database and migration source)

### Additional Technologies
- Git and GitHub
- JWT-based authentication

## Application Modules

The application includes five main sections:

1. Guidelines
2. Existing Reviews
3. Analytics
4. Governance
5. Audit Logs

## Database Migration

The project includes PostgreSQL database support, replacing the previous SQLite-only database implementation.

The migration includes:

- PostgreSQL connection management.
- Database compatibility for SQLite and PostgreSQL.
- PostgreSQL-compatible authentication queries.
- A dedicated SQLite-to-PostgreSQL migration script.
- Existing record transfer and row-count verification.

Migration script:

`migrate_sqlite_to_postgres.py`

The original SQLite database is preserved during migration.

## Project Structure

```text
VERITY_AI_Submission/
│
├── backend/
│   ├── app/
│   ├── auth.py
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   └── services/
│   └── vite.config.js
│
├── migrate_sqlite_to_postgres.py
├── requirements.txt
├── .gitignore
└── README.md
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/adityahandge4-bit/VERITY_AI_Submission.git
cd VERITY_AI_Submission
```

### 2. Backend Setup

Create and activate a Python virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a local `.env` file in the project root.

Configure the following variables using your own PostgreSQL credentials and a securely generated JWT secret:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
VARIETY_JWT_SECRET=your_secure_secret
```

Do not commit your `.env` file or expose database credentials.

### 4. Start the Backend

From the project root:

```powershell
python -m uvicorn backend.main:app --reload
```

Backend API:

`http://127.0.0.1:8000`

API documentation:

`http://127.0.0.1:8000/docs`

### 5. Frontend Setup

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5177`

## Repository

GitHub: https://github.com/adityahandge4-bit/VERITY_AI_Submission

## Project Status

The PostgreSQL migration has been implemented and verified. Backend compilation, database connectivity, user login, and the application's five main sections have been tested.

---

**VERITY AI – Brand Governance & Compliance Review System**
