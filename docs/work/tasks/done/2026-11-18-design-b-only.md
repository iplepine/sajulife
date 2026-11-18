# 디자인 B 확정·A 제거

- 상태: Done
- 유형: Build
- 날짜: 2026-11-18 KST
- Goal: ../../goals/active/2026-06-consulting-loop-validation.md
- Roadmap: ../../roadmaps/active/2026-06-thin-slice-validation.md
- 승인: 대표가 "디자인 B로 확정, 디자인 A 정리"를 지시했다(2026-11-18).

## 범위

- 선택 장치 제거: `components/DesignVariantProvider.tsx`(`?design=` 쿼리·`sajulife_design` 쿠키·`html[data-design]`) 삭제, `app/layout.tsx` 래퍼 제거.
- 앱 셸([components/AppShell.tsx](../../../../components/AppShell.tsx)): 로그인 뒤 화면은 항상 `design-b` + CharacterGuide, `/auth/*`는 항상 `design-b-auth`.
- 홈([app/dashboard/page.tsx](../../../../app/dashboard/page.tsx)): A 초상 히어로·`PortraitAnalysis`·`home.module.css`·`public/hero-art/self-portrait-v1*.webp` 삭제. B 히어로만 남김. 단계 '다시 보기' 화살표는 B 셸 CSS(`.design-b .b-home .home-package-state span[aria-hidden]`)가 그린다.
- 기질 결과 패널: 캐릭터 안내 항상 표시, A 머리말(kicker)·`data-design` 제거. `globals.css`의 A 전용 `.home-fusion-action` 규칙 제거.
- 비교 페이지 `/design-review` 삭제, 미들웨어 공개 경로에서 제거.
- 유지: `.design-b` 클래스명(기본 스코프), `ReportVisualSummary`의 `:global(.design-b)` 규칙, 로그인 전 궁서 랜딩(`/`), `design-previews/` 과거 시안 기록.
- e2e: A/B 반복을 B 단일로 접고, A 초상 홈 테스트 삭제, `design-variants.spec.ts` → `design-b.spec.ts`(기본 B·옛 `?design=a` 무시·랜딩 비적용·검토 페이지 닫힘).

## 검증 (2026-11-18 KST)

- 타입 검사 통과(삭제된 `/design-review`의 `.next` 생성 타입 잔재 제외), `npm run lint` 에러 0.
- e2e: 1차 139건 중 109 통과. 실패 원인을 HEAD `1a26044` 워크트리 baseline과 대조했다.
  - A 전제가 남아 있던 테스트(초상 홈 CTA 화살표 마스크, `/design-review` 응답)는 B 기준으로 고쳤다.
  - `studio-consistency` 18건은 B가 진짜로 어긋난 곳이었다: 셸 바깥 `body`가 계절/다크 바탕으로 남아 앱 본문(흰 종이)과 달랐고, 다크 설정에서 B의 흐린 글자(#62656b)가 어두운 바탕에 올라가 대비 2.9였다. `design-b-shell.css`에 `html:has(.design-b) body`를 흰 바탕·라이트로 고정해 해결(B는 라이트 한 벌).
  - 재실행: studio-consistency·dashboard-state·design-b·temperament 55건 중 49 통과.
- 남은 실패(이번 변경과 무관, baseline에서도 동일하게 실패): 기질 결과 탭 `tciGets` 기대보다 1회 많음 6건, `package-intro` 예시 풀이 '조후 분석' 문구 1건, `report-manseryeok` 재시도 연도 조회 3회 1건.
- 화면 확인: 390/1440 홈·설문(라이트 4계절·다크)·로그인 캡처를 직접 열어 B 캐릭터 디자인과 흰 바탕을 확인했다. AI 생성 POST는 호출하지 않았다(`AI_GENERATION_ENABLED=false`).

후속 승인 (2026-11-18 KST): 대표의 "커밋 푸시" 요청으로 `2615b13`·`8ca1c1f`(같은 폴더의 사주 탭 보고서 커밋 `89df7e3`·`792735d` 포함)를 `origin/main`에 푸시했다. 실서비스 배포 완료 여부는 미확인.
