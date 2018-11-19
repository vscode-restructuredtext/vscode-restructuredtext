echo to install dependencies
npm install
@IF %ERRORLEVEL% NEQ 0 EXIT /b 1
echo installed dependencies

echo to run test cases
npm run test
@IF %ERRORLEVEL% NEQ 0 EXIT /b 1
echo ran test cases
