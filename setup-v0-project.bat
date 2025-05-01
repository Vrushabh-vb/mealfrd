@echo off
echo Creating .npmrc with legacy-peer-deps=true...
echo legacy-peer-deps=true > .npmrc

echo Updating Node version compatibility...
call nvm use 20

echo Installing dependencies...
call npm install

echo V0 project setup complete! You can now run:
echo npm run dev

pause 