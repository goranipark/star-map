#!/bin/bash
cd "$(dirname "$0")"
echo "=============================="
echo " 폴라리스의 별자리 - 로컬 실행"
echo "=============================="
echo

if ! command -v node &> /dev/null; then
    echo "[오류] Node.js가 설치되어 있지 않습니다."
    echo "       https://nodejs.org 에서 LTS 버전을 먼저 설치한 뒤 다시 실행하세요."
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "[1/2] 필요한 부품 설치 중... 처음 한 번만 오래 걸립니다."
    npm install || { echo "[오류] 설치에 실패했습니다. 인터넷 연결을 확인해 주세요."; exit 1; }
else
    echo "[1/2] 필요한 부품이 이미 설치되어 있습니다. 건너뜁니다."
fi

echo
echo "[2/2] 게임을 실행합니다. 잠시 뒤 브라우저가 자동으로 열립니다."
echo "      주소: http://localhost:5173"
echo "      종료할 때는 이 창에서 Ctrl+C 를 누르세요."
echo
npm run dev
