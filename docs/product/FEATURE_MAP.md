<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `4647f941107c9993a6b74cb77fd8debf9753be16` (`main`)
> - 최근 커밋: `4647f94` Refine life period labels
> - 커밋 일시: `2026-06-26T00:58:17+09:00`
> - 워킹트리: `dirty (docs update)`
> - 문서 갱신: `2026-06-26 01:01:50 +0900`
<!-- COMMIT_STATUS END -->

# 기능 지도

마지막 갱신일: 2026-06-26

상태 기준:

- `현재 구현`: 사용 가능한 경로와 저장 로직이 있다.
- `부분 구현`: 화면/서버 일부는 있으나 운영 준비 또는 검증이 남았다.
- `미구현`: 제품 스펙 또는 필요성만 있다.

| 영역 | 기능 | 상태 | 구현 위치 | 비고 |
|---|---|---|---|---|
| 인증 | Supabase 익명 게스트 | 현재 구현 | `app/page.tsx`, `lib/supabase/*` | 보호 경로 미인증 시 `/` 리다이렉트 |
| 인증 | 이메일 로그인/회원가입 | 현재 구현 | `app/auth/*` | 게스트는 `updateUser`로 정식 회원 전환 |
| 계정 | 계정 상태/입력 정보 관리/로그아웃 | 현재 구현 | `app/account/page.tsx` | 모바일 하단 탭 진입, 익명 사용자 회원 전환 CTA, 개인 사주·가족·기질 입력 수정 링크 |
| 프로필 | 사주 정보 입력/수정 | 현재 구현 | `app/onboarding/page.tsx`, `app/api/profile`, `app/saju/page.tsx` | 개인 사주 화면에서 수정 진입, 시각 모름, 직업, 관계 상태, 자녀 여부, 현재 관심/고민 지원 |
| 대시보드 | 리포트 완료 상태 허브 | 현재 구현 | `app/dashboard/page.tsx` | 개인/TCI/융합/가족 순서로 완료 상태 표시 |
| 사주 | 만세력 계산 | 현재 구현 | `lib/saju/calculator.ts`, `lib/saju/koreanTime.ts` | LLM 계산 금지, `lunar-javascript` 사용, 한국 표준시/서머타임 보정 |
| 사주 | LifeCircle/오행/대운 시각화 | 현재 구현 | `components/LifeCircle.tsx`, `components/report/*` | 프롬프트와 같은 계산값 사용 |
| 리포트 | 개인 사주 리포트 | 현재 구현 | `app/saju/page.tsx`, `app/api/saju/personal`, `components/ReportView.tsx` | JSON schema 응답, 하단 섹션은 의미별 포인트 컬러 적용 예정 |
| 기질 | 약식 TCI 35문항 | 현재 구현 | `app/tci/page.tsx`, `lib/tci/questions.ts` | 자체 문항, 자동 저장 |
| 기질 | 정식 TCI 140문항 | 부분 구현 | `lib/tci/questions-rs.ts` | 라이선스 문항 입력 전까지 운영 불가 |
| 기질 | 8축 레이더/유연성 | 현재 구현 | `components/TciRadar.tsx`, `app/api/tci/report` | `FLEX=NN` 파싱 |
| 리포트 | 사주 x 기질 융합 | 현재 구현 | `app/fusion/page.tsx`, `app/api/fusion/report` | TCI 완료 필요 |
| 가족 | 구성원 CRUD | 현재 구현 | `app/family/page.tsx`, `app/api/family` | 가족 구성원별 직업 입력, 가족 제노그램/오행 흐름 그래프 |
| 가족 | 가족 사주 리포트 | 현재 구현 | `app/api/family/report`, `components/report/FamilyReportBody.tsx` | 리포트 기준 정보 + 가족 한 문장 + 제노그램 + 6개 섹션 JSON 응답 |
| 상담 | 상담 근거 요약 | 현재 구현 | `lib/consult/summarize.ts`, `lib/store/consultBasis.ts` | 리포트 저장 직후 갱신, 상담 시 백필 |
| 상담 | AI 상담 히스토리 | 현재 구현 | `app/consult/page.tsx`, `app/api/consult` | 최근 50개 |
| 코칭 | 액션 후보 등록 | 현재 구현 | `components/ActionPlanRegister.tsx`, `app/api/coaching` | source + title 중복 방지 |
| 코칭 | 직접 추가/완료/삭제 | 현재 구현 | `app/coaching/page.tsx`, `app/api/coaching/[id]` | 최근 200개 |
| 공유 | 공개 스냅샷 링크 | 현재 구현 | `app/api/share`, `app/share/[token]` | revoke UI 없음 |
| 공유 | 카카오 공유 | 부분 구현 | `components/ShareButton.tsx` | `NEXT_PUBLIC_KAKAO_JS_KEY` 필요 |
| 프롬프트 | 기본 프롬프트 | 현재 구현 | `lib/prompts/defaults.ts` | defaults.ts가 source of truth |
| 디자인 | 사주언니 x 기질오빠 UI 기준 | 현재 구현 | `docs/product/DESIGN_SYSTEM.md`, `app/globals.css`, `components/ReportView.tsx` | 캐릭터 반복 노출 제한, 섹션별 톤다운 포인트 컬러 기준 |
| 프롬프트 | KV override/버전 무효화 | 현재 구현 | `lib/prompts/store.ts` | 오래된 KV는 default 우선 |
| 프롬프트 | 관리자 편집 API | 현재 구현 | `app/api/prompts/[key]` | UI는 debug 페이지의 패널 중심 |
| 분석 | Vercel Analytics 전환 이벤트 | 현재 구현 | `lib/analytics.ts` | signup, report_generated, consult_asked, share_created |
| 결제 | 단건/구독/심층 리포트 | 미구현 | 없음 | 수익 가설만 존재 |
| 개인정보 | 삭제/내보내기 UX | 미구현 | 없음 | 제품화 전 필요 |
| 테스트 | 자동 단위/E2E 테스트 | 미구현 | 없음 | 현재 typecheck/build/eval 중심 |

## 다음에 좁혀야 할 기능

1. 베타 사용자 온보딩에서 첫 리포트 생성까지의 이탈 지점.
2. 상담 질문 입력 전 예시/템플릿 제공 여부.
3. 코칭 액션을 등록한 뒤 재방문하게 만드는 알림 또는 회고 UX.
4. 공개 공유 링크 revoke와 민감 정보 경고.
5. 결제 전환용 리포트 깊이/가격 패키지.
6. 출생지 기반 진태양시 보정과 23시대 야자시 정책 확정.
