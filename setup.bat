@echo off
REM =====================================
REM Education CRM System - Setup Script (Windows)
REM =====================================
REM This script automates the setup process
REM =====================================

echo ============================================
echo Education CRM System - Automated Setup
echo ============================================
echo.

REM Check if Node.js is installed
echo Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo [OK] Node.js %NODE_VERSION% found

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo [OK] npm %NPM_VERSION% found
echo.

REM Step 1: Install dependencies
echo ============================================
echo Step 1/4: Installing dependencies...
echo This may take a few minutes...
echo ============================================
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Step 2: Set up environment variables
echo ============================================
echo Step 2/4: Setting up environment variables...
echo ============================================
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [OK] Created .env file from .env.example
        echo [WARNING] Please edit .env and update JWT_SECRET before running in production
    ) else (
        echo [WARNING] .env.example not found, creating minimal .env
        (
            echo JWT_SECRET=default-secret-change-in-production
            echo DATABASE_URL="file:./dev.db"
            echo NODE_ENV=development
        ) > .env
        echo [OK] Created .env file
    )
) else (
    echo [INFO] .env file already exists, skipping
)
echo.

REM Step 3: Set up database
echo ============================================
echo Step 3/4: Setting up database...
echo ============================================
call npx prisma db push
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to set up database
    pause
    exit /b 1
)
echo [OK] Database schema created
echo.

REM Step 4: Seed initial data
echo ============================================
echo Step 4/4: Seeding initial data...
echo ============================================
call npx tsx scripts/seed-roles-and-permissions.ts
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to seed initial data
    pause
    exit /b 1
)
echo [OK] Initial data seeded
echo.

REM Success message
echo ============================================
echo Setup completed successfully!
echo ============================================
echo.
echo Default Login Credentials:
echo   Email:    admin@example.com
echo   Password: admin123
echo.
echo To start the development server, run:
echo   npm run dev
echo.
echo Then open your browser to:
echo   http://localhost:3000
echo.
echo For more information, see:
echo   - README.md
echo   - SETUP_GUIDE.md
echo   - QUICK_SETUP.md
echo.
pause

