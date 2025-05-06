@echo off
echo MealMitra - Gemini API Setup Helper
echo ===================================

:menu
cls
echo What would you like to do?
echo 1. Set up my own Gemini API key
echo 2. Use the default API key (limited usage)
echo 3. Test current API configuration
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto setup_key
if "%choice%"=="2" goto use_default
if "%choice%"=="3" goto test_api
if "%choice%"=="4" goto end
goto menu

:setup_key
cls
echo Setting up your Gemini API key
echo -----------------------------
echo.
echo You can get a free Gemini API key from:
echo https://makersuite.google.com/app/apikey
echo.
set /p api_key="Enter your Gemini API key: "

if "%api_key%"=="" (
  echo API key cannot be empty!
  pause
  goto menu
)

echo.
echo Saving API key to environment...
echo GEMINI_API_KEY=%api_key% > .env
setx GEMINI_API_KEY "%api_key%"
echo.
echo ✓ API key configured successfully!
echo.
echo Your API key has been saved to:
echo 1. .env file (for local development)
echo 2. User environment variables (for the current user)
echo.
pause
goto menu

:use_default
cls
echo Using default API key
echo --------------------
echo.
echo GEMINI_API_KEY=AIzaSyAix7hz00aVUqle2r08-riFh5qbxtyj7dA > .env
echo ✓ Default API key has been configured
echo.
echo Note: The default key has usage limitations.
echo Consider getting your own API key for production use.
echo.
pause
goto menu

:test_api
cls
echo Testing API configuration
echo -----------------------
echo.
echo Checking for Gemini API key...

set key_found=0

if exist .env (
  findstr /C:"GEMINI_API_KEY" .env > nul
  if not errorlevel 1 (
    echo ✓ Found API key in .env file
    set key_found=1
  )
)

if defined GEMINI_API_KEY (
  echo ✓ Found API key in environment variables
  set key_found=1
)

if %key_found%==0 (
  echo ✗ No API key found!
  echo.
  echo Please set up your API key first.
  pause
  goto menu
)

echo.
echo Testing connection to Gemini API...
echo.
echo This will start the development server temporarily to test the API.
echo The server will be stopped after the test.
echo.
echo Press any key to start testing...
pause > nul

start /wait /min npm run dev -- --port 3456
echo.
echo If you saw no errors, your API key is working correctly.
echo If you saw errors, please try setting up a different API key.
echo.
pause
goto menu

:end
echo Exiting setup...
exit /b 0 