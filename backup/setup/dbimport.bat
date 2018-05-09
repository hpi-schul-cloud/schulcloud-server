@echo off && setlocal

rem set configuration variables
SET DEFAULT_DB=schulcloud
SET DEFAULT_HOST=localhost:27017
SET CREDENTIALS=-u username -p pwd

rem auto detection of mongo dir - first and easiest: get path from mongoimport.exe if installed correctly
for /f "tokens=*" %%a in ('where mongoimport') do set MONGODIR=%%a
if exist %MONGODIR% goto import
rem next try: get version from registry and build path expecting default installation
rem works as long as version is up to 4 chars in length - 3.6 or 3.66 possible
rem get last 4 chars, could be "\3.6" or "3.66"
rem filter possible "\" to support possible 4-char version numbers in the future
for /f %%b in ('reg query "HKEY_LOCAL_MACHINE\SOFTWARE\MongoDB\Server" /s^|findstr "\\.\."') do set MONGOVER=%%b
set MONGOVER=%MONGOVER:~-4%
set MONGOVER=%MONGOVER:\=%
set MONGODIR=%programfiles%\MongoDB\Server\%MONGOVER%\bin
if exist "%MONGODIR%\mongoimport.exe" goto import
rem last but probably worst: ask the DAU
set /p MONGODIR="## Please provide the full path to your MongoDB install folder (eg ...\Server\[VER]\bin\): "
if exist "%MONGODIR%\mongoimport.exe" goto import
echo ## Your provided MongoDB folder doesn't contain the needed mongoimport.exe, please locate your mongoimport.exe.
echo ## If installed correctly, issueing the command 'where mongoimport' should return the path.
goto end

:import
rem Finding Mongo directory
echo ## Using MongoDB in path %MONGODIR%
IF NOT EXIST "%MONGODIR%\mongoimport.exe" (
  echo ## Your provided MongoDB folder doesn't contain the needed mongoimport.exe, please locate your mongoimport.exe.
	echo ## If installed correctly, issueing the command 'where mongoimport' should return the path.
) ELSE (
  echo ## MongoDB directory found!
  echo ## Import using default variables; DB: %DEFAULT_DB%, Host: %DEFAULT_HOST%
  FOR /R %%F IN (*) DO for %%A IN ( %%~nF ) DO (
    echo ## SEED: %%~nA from %%F without credentials
    rem try without creds first
    "%MONGODIR%\mongoimport" --host "%DEFAULT_HOST%" --db "%DEFAULT_DB%" --collection "%%~nA" "%%F" --jsonArray --drop
    if errorlevel 1 (
    	echo ## SEED: %%~nA from %%F with credentials %CREDENTIALS% (you can change these in the script)
    	rem use given credentials
    	"%MONGODIR%\mongoimport" --host "%DEFAULT_HOST%" %CREDENTIALS% --db "%DEFAULT_DB%" --collection "%%~nA" "%%F" --jsonArray --drop
    )
  )
)

:end
endlocal && exit