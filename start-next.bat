@echo off
echo Setting up environment for Next.js...

REM Find the system's Node.js installation
FOR /F "tokens=* USEBACKQ" %%F IN (`where node`) DO (
  SET NODE_PATH=%%F
)

echo Found Node at: %NODE_PATH%
echo Current Node version:
node -v

REM Ensure .npmrc exists
echo legacy-peer-deps=true > .npmrc

REM Create a temporary batch file to run with the correct environment
echo @echo off > temp_run.bat
echo echo Using Node.js from: %NODE_PATH% >> temp_run.bat
echo set PATH=C:\Program Files\nodejs;%%PATH%% >> temp_run.bat
echo set NEXT_TELEMETRY_DISABLED=1 >> temp_run.bat
echo npx next dev >> temp_run.bat

REM Run the temp batch file
call temp_run.bat

REM Clean up
del temp_run.bat

pause 