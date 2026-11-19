@echo off
setlocal
where gradle >nul 2>nul
if %errorlevel%==0 (
  gradle %*
  exit /b %errorlevel%
)
set "ROOT=%~dp0"
set "DIST=%USERPROFILE%\.gradle\aura-gradle-8.13"
if not exist "%DIST%\gradle-8.13\bin\gradle.bat" (
  powershell -NoProfile -Command "New-Item -ItemType Directory -Force -Path '%DIST%' | Out-Null; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.13-bin.zip' -OutFile '%DIST%\gradle.zip'; Expand-Archive -Path '%DIST%\gradle.zip' -DestinationPath '%DIST%' -Force; Remove-Item '%DIST%\gradle.zip'"
  if errorlevel 1 exit /b 1
)
call "%DIST%\gradle-8.13\bin\gradle.bat" -p "%ROOT%" %*
