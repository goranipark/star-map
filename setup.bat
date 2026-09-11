@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================
echo  폴라리스의 별자리 - 로컬 실행
echo ==============================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo        https://nodejs.org 에서 LTS 버전을 먼저 설치한 뒤 다시 실행하세요.
    pause
    exit /b 1
)

if not exist node_modules (
    echo [1/2] 필요한 부품 설치 중... 처음 한 번만 오래 걸립니다.
    call npm install
    if %errorlevel% neq 0 (
        echo [오류] 설치에 실패했습니다. 인터넷 연결을 확인해 주세요.
        pause
        exit /b 1
    )
) else (
    echo [1/2] 필요한 부품이 이미 설치되어 있습니다. 건너뜁니다.
)

echo.
echo [2/2] 게임을 실행합니다. 잠시 뒤 브라우저가 자동으로 열립니다.
echo       주소: http://localhost:5173
echo       종료할 때는 이 창에서 Ctrl+C 를 누르거나 창을 닫으세요.
echo.
call npm run dev

pause
