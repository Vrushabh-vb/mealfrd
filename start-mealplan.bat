@echo off
echo MealMitra - AI Meal Plan Generator Launcher
echo =============================================

REM Check if .env file exists, create if not
if not exist .env (
  echo Creating .env file...
  echo GEMINI_API_KEY=AIzaSyAix7hz00aVUqle2r08-riFh5qbxtyj7dA > .env
  echo Created .env file with default Gemini API key
) else (
  echo Found existing .env file
)

REM Check Node.js version
for /f "tokens=* usebackq" %%v in (`node -v`) do set NODE_VERSION=%%v
echo Node.js version: %NODE_VERSION%

REM Configure Next.js environment
set NODE_OPTIONS=--no-deprecation
set NEXT_TELEMETRY_DISABLED=1

REM Ensure all dependencies are installed
echo Checking dependencies...
call npm install

REM Run application
echo Starting MealMitra AI Meal Planner...
echo Access the application at: http://localhost:3000/meal-planner
echo.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev

REM If server stops, wait for user input before closing
pause 