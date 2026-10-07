<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `cad7190c567686db53fca6e65e855ecf00ee77e0` (`main`)
> - 최근 커밋: `cad7190c5676` docs: 사주+기질 대표 상품 결정과 로그인 전 랜딩 디자인 예외를 기록
> - 커밋 일시: `2026-10-08T08:56:43+09:00`
> - 워킹트리: `clean`
> - 문서 갱신: `2026-10-08 08:56:48 +0900`
<!-- COMMIT_STATUS END -->

# 기능 지도

마지막 갱신일: 2026-10-08

상태 기준:

- `현재 구현`: 사용 가능한 경로와 저장 로직이 있다.
- `부분 구현`: 화면/서버 일부는 있으나 운영 준비 또는 검증이 남았다.
- `미구현`: 제품 스펙 또는 필요성만 있다.

| 영역 | 기능 | 상태 | 구현 위치 | 비고 |
|---|---|---|---|---|
| 인증 | Supabase 익명 게스트 | 현재 구현 | `app/page.tsx`, `lib/supabase/*` | 보호 경로 미인증 시 `/` 리다이렉트 |
| 인증 | 이메일 로그인/회원가입·인증·복구 | 현재 구현 | `app/auth/*`, `components/ResendConfirmationButton.tsx` | 게스트는 `updateUser`로 같은 user ID를 유지해 전환하며, 인증 상태·60초 재전송·비밀번호 재설정·만료 링크 안내 제공 |
| 계정 | 계정 상태/입력 정보 관리/로그아웃 | 현재 구현 | `app/account/page.tsx` | 이메일 인증 상태·게스트 데이터 보존 주의·복구 링크, 모바일 하단 탭 진입 |
| 프로필 | 사주 정보 입력/수정 | 현재 구현 | `app/onboarding/page.tsx`, `app/api/profile`, `app/saju/page.tsx` | 처음 입력은 사주 정보(이름·생년월일·달력·시각·성별)만. 직업·관계·자녀·고민은 수정할 때만 보인다 |
| 홈 | 사주+기질 메인 히어로 | 현재 구현 | `app/dashboard/page.tsx`, `lib/package/journey.ts` | 2026-10-08부터 히어로 큰 버튼 하나가 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 올해 운세 순서를 따라간다. 아래 1·2·3 진행 표시와 결제 전 가격. 나머지 풀이(용신·가족·궁합·기질·상담)는 퀵메뉴·추천 레일에서 고른다. |
| 랜딩 | 로그인 전 흰 바탕 + 검은 궁서체 | 현재 구현 | `app/page.tsx`, `app/globals.css`(`.ink-landing`) | 계절 테마 예외(DESIGN_PRINCIPLES §7). 시작 → 게스트 로그인 → 홈. 궁서체 없는 기기는 Song Myung 대체 |
| 내 자료 | 사주/기질/융합/가족 기준 정보 관리 | 현재 구현 | `app/materials/page.tsx`, `app/saju/page.tsx`, `app/tci/*`, `app/fusion/page.tsx`, `app/family/page.tsx` | 리포트/검사 항목은 홈에서 분리 |
| 알림 | 비동기 리포트 생성 완료 알림함 | 현재 구현 | `app/notifications/page.tsx`, `app/api/notifications`, `components/GenerationCenter.tsx` | 개인 사주·용신·기질·융합·가족의 종류별 최신 완료본을 시간순으로 표시, 재생성 전 이력은 저장소 정책상 미보관 |
| 기록 | 상담 히스토리와 저장 액션 | 현재 구현 | `app/history/page.tsx`, `app/consult/page.tsx`, `app/coaching/page.tsx` | `/consult`, `/coaching`은 상세/legacy 경로로 유지 |
| 사주 | 만세력 계산 | 현재 구현 | `lib/saju/calculator.ts`, `lib/saju/koreanTime.ts` | LLM 계산 금지, `lunar-javascript` 사용, 한국 표준시/서머타임 + 국내 기본 경도(-30분) 보정 |
| 사주 | LifeCircle/오행/대운 시각화 | 현재 구현 | `components/LifeCircle.tsx`, `components/report/*` | 프롬프트와 같은 계산값 사용 |
| 리포트 | 개인 사주 리포트(평생) | 현재 구현 | `app/saju/page.tsx`, `app/api/saju/personal`, `components/ReportView.tsx` | 사주+기질 이용권 필요(402). 8번째 섹션 `평생 실행전략`(프롬프트 v20). 끝에 기질 검사 → 올해 운세로 잇는 카드 |
| 기질 | 약식 TCI 35문항 | 현재 구현 | `app/tci/page.tsx`, `lib/tci/questions.ts` | 자체 문항, 자동 저장. `?next=fusion`으로 오면 완료 즉시 올해 운세 생성으로 이동 |
| 기질 | 정식 TCI 140문항 | 부분 구현 | `lib/tci/questions-rs.ts` | 라이선스 문항 입력 전까지 운영 불가 |
| 기질 | 8축 레이더/유연성 | 현재 구현 | `components/TciRadar.tsx`, `app/api/tci/report` | `FLEX=NN` 파싱 |
| 리포트 | 사주+기질 올해 운세 | 현재 구현 | `app/fusion/page.tsx`, `app/api/fusion/report`, `lib/fusion/yearFortune.ts` | 이용권 + 기질 검사 완료 필요. 8섹션(원래의 너 → 요즘의 너 → 올해 흐름 → 남은 달 → 내년 준비, 프롬프트 v30). 올해 남은 달 템포 카드 |
| 가족 | 구성원 CRUD | 현재 구현 | `app/family/page.tsx`, `app/api/family` | 가족 구성원별 직업 입력, 가족 제노그램/오행 흐름 그래프 |
| 가족 | 가족 사주 리포트 | 현재 구현 | `app/family/page.tsx`, `app/api/family/report`, `components/report/FamilyReportBody.tsx`, `components/ReportView.tsx` | 저장 가족 중 리포트 대상 체크, 본인 포함 최대 4명, 리포트 기준 정보 + 가족 한 문장 + 제노그램 + 6개 섹션 JSON 응답, 가족 상담 CTA, 선택/가족 정보 변경 시 재생성 안내 |
| 상담 | 상담 근거 요약 | 현재 구현 | `lib/consult/summarize.ts`, `lib/store/consultBasis.ts` | 리포트 저장 직후 갱신, 상담 시 백필 |
| 상담 | AI 상담 히스토리 | 현재 구현 | `app/dashboard/page.tsx`, `app/history/page.tsx`, `app/consult/page.tsx`, `app/api/consult` | 홈에서 질문 시작, 상세는 `/consult?id=...`, 핵심 진단/패턴/시뮬레이션/행동 섹션형 답변, 최근 50개 |
| 코칭 | 액션 후보 등록 | 현재 구현 | `components/ActionPlanRegister.tsx`, `app/api/coaching` | source + title 중복 방지 |
| 코칭 | 직접 추가/완료/삭제 | 현재 구현 | `app/history/page.tsx`, `app/coaching/page.tsx`, `app/api/coaching/[id]` | 기록에서 체크, `/coaching`은 상세/legacy 경로로 유지, 최근 200개 |
| 공유 | 공개 스냅샷 링크 lifecycle | 현재 구현 | `app/api/share`, `components/ShareButton.tsx`, `app/share/[token]` | 30일 기본 만료, 명시적 무기한, 상태 조회·폐기·재발급, 만료/폐기는 공개·OG 모두 차단 |
| 공유 | 카카오 공유 | 부분 구현 | `components/ShareButton.tsx` | `NEXT_PUBLIC_KAKAO_JS_KEY` 필요 |
| 프롬프트 | 기본 프롬프트 | 현재 구현 | `lib/prompts/defaults.ts` | defaults.ts가 source of truth |
| 디자인 | 개인 흐름 계절 테마 시스템 | 현재 구현 | `components/SeasonThemeProvider.tsx`, `components/AppShell.tsx`, `app/globals.css`, `docs/product/DESIGN_SYSTEM.md` | 현재 대운 지지(대운 없으면 월지)에서 봄·여름·가을·겨울을 정하고, 앱 전역 표면·강조·활성 상태 토큰을 바꾼다. 오행·리포트 데이터 색은 유지한다. |
| 용신 리포트 | 현재 대운 맞춤 실행 전략 | 현재 구현 | `lib/saju/yongsinView.ts`, `lib/prompts/defaults.ts`, `app/api/saju/yongsin/route.ts` | 현재 대운이 종합 용신과 직접 맞물리면 “끌어오기” 대신 90일 집중 목표·사람/자원 연결·반복 시스템·과열 방지선으로 시너지를 설계한다. 그 외에는 다음 순풍을 위한 선행 준비 전략을 제시한다. |
| 프롬프트 | KV override/버전 무효화 | 현재 구현 | `lib/prompts/store.ts` | 오래된 KV는 default 우선 |
| 프롬프트 | 관리자 편집 API | 현재 구현 | `app/api/prompts/[key]` | UI는 debug 페이지의 패널 중심 |
| 분석 | Vercel Analytics 전환 이벤트 | 현재 구현 | `lib/analytics.ts` | signup, profile_saved, report_generated, consult_asked, action_registered, action_completed, share_created |
| 안전 | AI 생성 비용·남용 방어 | 현재 구현 | `lib/ai/generationGuard.ts`, `lib/store/kv.ts`, AI 생성 API | 계정 전체·종류별 UTC 일일 한도, 킬 스위치, 429/Retry-After, 민감 본문 없는 구조화 로그 |
| 결제 | 사주+기질 풀이 4,900원(인물 1명) | 부분 구현 | `app/checkout`, `app/api/package/*`, `lib/package/*`, `lib/store/package.ts` | PortOne V2 결제·서버 검증·멱등 이용권. 키가 없으면 로컬·`PAYMENT_MOCK=1` 프리뷰만 가짜 결제(운영 차단). 운영 키·법무 확인 전 |
| 결제 | 옛 티켓 구매 | 사용 안 함 | `app/tickets`(→ `/checkout`), `app/api/tickets/*` | 티켓 차감 모델 폐기. checkout API는 계속 새 주문을 막는다 |
| 개인정보 | 삭제/내보내기 UX | 미구현 | 없음 | 제품화 전 필요 |
| 테스트 | 핵심 Playwright E2E | 부분 구현 | `playwright.config.ts`, `e2e/*` | 공개/인증 경계는 기본 실행, 전용 스테이징 계정 환경변수 시 로그인·공유 재발급·폐기까지 검사. AI 호출 없음 |

## 다음에 좁혀야 할 기능

1. 베타 사용자 온보딩에서 첫 리포트 생성까지의 이탈 지점.
2. 상담 질문 입력 전 예시/템플릿 제공 여부.
3. 코칭 액션을 등록한 뒤 재방문하게 만드는 알림 또는 회고 UX.
4. 계정 전체 데이터 삭제·내보내기 UX와 지원 처리.
5. 결제 전환용 리포트 깊이/가격 패키지.
6. 출생지 기반 가변 경도/진태양시 보정과 23시대 야자시 정책 확정.
