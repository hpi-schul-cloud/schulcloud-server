@echo off

rem set configuration variables
set MONGODIR=C:\Program Files (x86)\MongoDB\Server\3.4\bin

SET DEFAULT_DB=schulcloud
SET DEFAULT_HOST=localhost:27017
SET CREDENTIALS=-u username -p pwd


SET before="%cd%"
cd %~dp0

rem Finding Mongo directory
IF NOT EXIST %MONGODIR% (
  set MONGODIR=C:\Program Files\MongoDB\Server\3.4\bin
)
IF NOT EXIST %MONGODIR% (
  echo "Could not find the directory with the mongo.exe file. Please edit this script if you found it."
) ELSE (
  echo "Using mongodb in %MONGODIR%"
  
  cd backup\setup
  FOR /R %%F IN (*) DO for %%A IN ( %%~nF ) DO (
    echo SEED: %%~nA from %%F
    "%MONGODIR%\mongoimport" --host "%DEFAULT_HOST%" %CREDENTIALS% --db "%DEFAULT_DB%" --collection "%%~nA" "%%F" --jsonArray --drop
  )
)


cd %before%

