# Yongsin Dragon Assets

이 폴더는 용신 중심 리디자인을 위한 이중섭식 러프 드래곤 에셋팩입니다.

## Source Boards

- `yongsin-dragon-asset-board.png`: 전체 리소스 방향 보드
- `dragon-marks-transparent.png`: 용신 마크 원본 투명 시트
- `brush-ui-parts-transparent.png`: 붓터치 UI 부품 원본 투명 시트
- `rough-icons-transparent.png`: 러프 아이콘 원본 투명 시트
- `background-textures-sheet.png`: 배경 질감 원본 시트
- `report-header-sheet.png`: 리포트 헤더 원본 시트

## Sliced Assets

실제 화면에서는 `sliced/` 아래의 개별 파일을 사용합니다.

- `sliced/dragons/`: 목룡, 화룡, 토룡, 금룡, 수룡, 오행룡 마크
- `sliced/ui/`: CTA 붓터치, 밑줄, 구분선, 태그, 마커, 화살표, 링
- `sliced/icons/`: 홈, 리포트, 상담, 가족, 직업, 관계, 돈, 타이밍 등 소형 아이콘
- `sliced/textures/`: 앱 배경과 카드 배경용 질감
- `sliced/headers/`: 용신 홈/리포트 헤더 배경
- `sliced/manifest.json`: 브라우저에서 바로 쓸 수 있는 `/yongsin-dragon-assets/...` 경로 목록

## Preview

잘린 결과 확인용 프리뷰는 `sliced/previews/`에 있습니다.

## Usage Notes

- 프론트엔드에서는 `public`을 제외한 URL 경로를 사용합니다.
  예: `/yongsin-dragon-assets/sliced/dragons/dragon-water.png`
- 투명 PNG는 배경 위에 오버레이로 사용합니다.
- 텍스처와 헤더는 RGB 배경 이미지라서 섹션 배경으로 사용합니다.
- 원본 시트와 chroma-key 소스는 재커팅/보정용으로 남겨둡니다.
