# 폴라리스의 별자리

초등학생이 북극성 주변의 별자리를 직접 이어 보고 신화 이야기를 읽는 React 기반 학습 게임입니다. 모든 진행 기록은 현재 브라우저의 `localStorage`에만 저장됩니다.

## 개발 명령

```sh
npm install
npm run dev
npm test
npm run check:art
npm run build
npm run preview
```

- `npm test`: 카메라, 진행 저장, 별자리 데이터, 좌표 투영, 배경 별밭, 카드 파일명을 네트워크 없이 검사합니다.
- `npm run check:art`: `src/data/constellations.json`에 정의된 29개 삽화와 `public/art`의 실제 파일을 대조합니다. 파일이 덜 만들어진 개발 단계에서는 누락 목록을 출력하고 실패 코드로 끝납니다.
- `npm run build`: `dist`에 정적 배포 파일을 만듭니다. Vite의 상대 `base`를 사용하므로 GitHub Pages의 하위 경로에서도 동작합니다.

## 삽화

삽화 파일은 `public/art/<별자리id>-<컷번호>.png` 규칙으로 넣습니다. PNG, JPG, JPEG, WebP를 지원하며 1024×1024 정사각형을 권장합니다. 자세한 제작 및 마지막 별자리 오버레이 절차는 `public/art/README.md`와 `art-prompts.md`에 있습니다.

현재 저장소에는 작은곰자리 1~5번 JPG만 포함되어 있습니다. 나머지 컷은 앱이 별자리 도형으로 안전하게 대체합니다.

## 소리와 오프라인 사용

배경음과 퍼즐 효과음은 외부 음원 파일 대신 브라우저 Web Audio로 생성합니다. 첫 사용자 입력 뒤 시작하며 상단의 소리 버튼 상태가 진행 설정에 저장됩니다.

프로덕션 빌드는 서비스 워커를 등록합니다. 최초 온라인 접속 뒤에는 앱 셸, 폰트, 방문한 삽화를 캐시해 재방문 시 오프라인에서도 실행할 수 있습니다. 새 버전이 준비되면 화면의 업데이트 안내를 눌러 안전하게 교체합니다.

## GitHub Pages 배포

저장소의 Actions 화면에서 `Deploy to GitHub Pages` 워크플로를 수동 실행합니다. 자동 테스트와 빌드가 성공한 경우에만 `dist`가 Pages에 배포됩니다. 저장소 Settings → Pages의 Source는 GitHub Actions로 설정해야 합니다.
