@echo off && setlocal

rem set configuration variables
set MONGOVER=3.6
set MONGODIR=%programfiles%\MongoDB\Server\%MONGOVER%\bin

SET DEFAULT_DB=schulcloud
SET DEFAULT_HOST=localhost:27017

SET CREDENTIALS=-u username -p pwd

rem Finding Mongo directory
IF NOT EXIST %MONGODIR% (
  echo ## Could not find the MongoDB directory. Please check the script and path variables.
) ELSE (
  echo ## MongoDB directory found!
  echo ## Import...
  FOR /R %%F IN (*) DO for %%A IN ( %%~nF ) DO (
    echo SEED: %%~nA from %%F
    rem try without creds first
    "%MONGODIR%\mongoimport" --host "%DEFAULT_HOST%" --db "%DEFAULT_DB%" --collection "%%~nA" "%%F" --jsonArray --drop
    if errorlevel 1 (
    	rem use given credentials
    	"%MONGODIR%\mongoimport" --host "%DEFAULT_HOST%" %CREDENTIALS% --db "%DEFAULT_DB%" --collection "%%~nA" "%%F" --jsonArray --drop
    )
  )
)

endlocal