@echo off
REM ============================================================
REM Block YouTube at DNS level (Windows)
REM Blocks youtube.com while keeping youtube-nocookie.com for embeds
REM Run as Administrator: right-click > Run as administrator
REM Usage: block-youtube-win.bat [enable|disable|status]
REM ============================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ This script must be run as Administrator
    echo    Right-click the file and select "Run as administrator"
    pause
    exit /b 1
)

set HOSTS=%SystemRoot%\System32\drivers\etc\hosts
set MARKER=CuratedReels YouTube Block
set ACTION=%1
if "%ACTION%"=="" set ACTION=enable

if /i "%ACTION%"=="enable" goto :enable
if /i "%ACTION%"=="disable" goto :disable
if /i "%ACTION%"=="status" goto :status
goto :usage

:enable
REM Remove existing block first
call :disable_silent

REM Add block entries
echo. >> "%HOSTS%"
echo # %MARKER% - START >> "%HOSTS%"
echo # Blocks YouTube browsing while allowing embedded video playback >> "%HOSTS%"
echo # via youtube-nocookie.com (privacy-enhanced mode) >> "%HOSTS%"
echo 127.0.0.1 youtube.com >> "%HOSTS%"
echo 127.0.0.1 www.youtube.com >> "%HOSTS%"
echo 127.0.0.1 m.youtube.com >> "%HOSTS%"
echo 127.0.0.1 music.youtube.com >> "%HOSTS%"
echo 127.0.0.1 gaming.youtube.com >> "%HOSTS%"
echo 127.0.0.1 tv.youtube.com >> "%HOSTS%"
echo 127.0.0.1 kids.youtube.com >> "%HOSTS%"
echo 127.0.0.1 accounts.youtube.com >> "%HOSTS%"
echo ::1 youtube.com >> "%HOSTS%"
echo ::1 www.youtube.com >> "%HOSTS%"
echo ::1 m.youtube.com >> "%HOSTS%"
echo ::1 music.youtube.com >> "%HOSTS%"
echo ::1 gaming.youtube.com >> "%HOSTS%"
echo ::1 tv.youtube.com >> "%HOSTS%"
echo ::1 kids.youtube.com >> "%HOSTS%"
echo ::1 accounts.youtube.com >> "%HOSTS%"
echo # %MARKER% - END >> "%HOSTS%"

REM Flush DNS cache
ipconfig /flushdns > nul

echo.
echo ✅ YouTube blocked successfully!
echo.
echo Blocked domains:
echo   ✗ youtube.com
echo   ✗ www.youtube.com
echo   ✗ m.youtube.com
echo   ✗ music.youtube.com
echo   ✗ gaming.youtube.com
echo   ✗ tv.youtube.com
echo   ✗ kids.youtube.com
echo   ✗ accounts.youtube.com
echo.
echo Still allowed (for video embeds):
echo   ✓ www.youtube-nocookie.com
echo   ✓ *.googlevideo.com (video streams)
echo   ✓ img.youtube.com (thumbnails)
echo.
echo To undo: Run this script with "disable" parameter
pause
goto :eof

:disable
call :disable_silent
echo ✅ YouTube unblocked successfully!
ipconfig /flushdns > nul
pause
goto :eof

:disable_silent
REM Create temp file without block entries
findstr /v /c:"%MARKER%" "%HOSTS%" > "%HOSTS%.tmp" 2>nul
findstr /v /c:"# Blocks YouTube browsing" "%HOSTS%.tmp" > "%HOSTS%.tmp2" 2>nul
findstr /v /c:"# via youtube-nocookie.com" "%HOSTS%.tmp2" > "%HOSTS%.tmp3" 2>nul

REM Filter out blocked youtube domains (only our entries with 127.0.0.1 or ::1)
set "TEMPFILE=%HOSTS%.tmp3"
set "OUTFILE=%HOSTS%.tmp4"

REM Use PowerShell for reliable multiline filtering
powershell -Command ^
    "$content = Get-Content '%TEMPFILE%' | Where-Object { $_ -notmatch '^\s*(127\.0\.0\.1|::1)\s+(youtube\.com|www\.youtube\.com|m\.youtube\.com|music\.youtube\.com|gaming\.youtube\.com|tv\.youtube\.com|kids\.youtube\.com|accounts\.youtube\.com)\s*$' }; $content | Set-Content '%OUTFILE%'"

if exist "%OUTFILE%" (
    copy /y "%OUTFILE%" "%HOSTS%" > nul
)

REM Cleanup temp files
del "%HOSTS%.tmp" 2>nul
del "%HOSTS%.tmp2" 2>nul
del "%HOSTS%.tmp3" 2>nul
del "%HOSTS%.tmp4" 2>nul
goto :eof

:status
findstr /c:"%MARKER%" "%HOSTS%" > nul 2>&1
if %errorlevel% equ 0 (
    echo 🔒 YouTube is currently BLOCKED
    echo.
    echo Blocked entries:
    findstr /c:"127.0.0.1" "%HOSTS%" | findstr /c:"youtube"
) else (
    echo 🔓 YouTube is currently UNBLOCKED
)
pause
goto :eof

:usage
echo Usage: %0 [enable^|disable^|status]
echo.
echo   enable  - Block youtube.com (default)
echo   disable - Unblock youtube.com
echo   status  - Check current status
pause
goto :eof
