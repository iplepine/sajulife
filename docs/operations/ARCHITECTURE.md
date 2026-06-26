<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `4647f941107c9993a6b74cb77fd8debf9753be16` (`main`)
> - 최근 커밋: `4647f94` Refine life period labels
> - 커밋 일시: `2026-06-26T00:58:17+09:00`
> - 워킹트리: `dirty (docs update)`
> - 문서 갱신: `2026-06-26 01:01:50 +0900`
<!-- COMMIT_STATUS END -->

# 아키텍처

마지막 갱신일: 2026-06-23

## 스택

- Framework: Next.js 15 App Router, React 19, TypeScript.
- 배포 가정: Vercel.
- Auth: Supabase Auth, anonymous sign-in + email/password.
- 저장소: Upstash Redis KV.
- AI: Gemini provider abstraction. 기본 모델은 `gemini-2.5-pro`, 상담 근거 요약 기본은 `gemini-2.5-flash`.
- 사주 계산: `lunar-javascript`.
- Analytics: Vercel Analytics.

## 라우트 구조

주요 페이지:

- `/`: 랜딩, 게스트 시작, 이메일 로그인/회원가입 링크.
- `/onboarding`: 사주 프로필 입력.
- `/dashboard`: 홈. 현재 고민 입력, 추천 질문, 최근 상담, 오늘 액션, 기준 정보 요약.
- `/materials`: 내 자료. 사주/기질/융합/가족 분석 항목 관리.
- `/history`: 기록. 상담 히스토리와 저장 액션 확인.
- `/tci`: 기질 검사 variant 선택/응답.
- `/tci/report`: 기질 리포트.
- `/saju`: 개인 사주 리포트.
- `/fusion`: 사주 x 기질 융합 리포트.
- `/family`: 가족 구성원과 가족 리포트.
- `/consult`: AI 상담 상세/legacy 입력 경로.
- `/coaching`: 코칭 액션 플랜 상세/legacy 관리 경로.
- `/account`: 계정 상태와 로그아웃.
- `/share/{token}`: 공개 공유 리포트.
- `/{saju,tci,fusion,family,consult}/debug`: 관리자 프롬프트 조정 화면.

주요 API:

- `/api/profile`
- `/api/tci/answers`
- `/api/tci/report`
- `/api/saju/chart`
- `/api/saju/personal`
- `/api/fusion/report`
- `/api/family`
- `/api/family/report`
- `/api/consult`
- `/api/consult/{id}`
- `/api/coaching`
- `/api/coaching/{id}`
- `/api/share`
- `/api/prompts/{key}`
- `/api/ai-info`

## 인증

Middleware는 정적 자원, `/`, `/api/*`, `/auth/*`, `/share/*`를 제외한 경로를 보호한다. 미인증 사용자는 `/`로 보내고 원래 경로를 `redirectedFrom`으로 보존한다.

API는 middleware에서 리다이렉트하지 않고 각 API가 401 JSON을 반환한다.

게스트 사용자는 Supabase 익명 사용자다. 이메일 회원 전환은 새 계정 생성 후 데이터 이관이 아니라 기존 익명 user에 `updateUser({ email, password })`를 수행해 같은 `auth.uid()`를 유지한다.

## KV 네임스페이스

| 키 | 값 | 비고 |
|---|---|---|
| `prompts` | `PromptsStore` | 전역 프롬프트 override |
| `user:{userId}:profile` | `SajuProfile` | 본인 사주 정보 + 선택 맥락(직업, 관계 상태, 자녀 여부, 현재 관심/고민) |
| `user:{userId}:tci:{short|full}` | `TciAnswers` | variant별 TCI 응답 |
| `user:{userId}:tci` | legacy `TciAnswers` | 약식 응답 fallback |
| `user:{userId}:family` | `FamilyStore` | 가족 구성원 |
| `user:{userId}:report:{kind}` | `SavedReport` | 리포트 종류별 최신본 |
| `user:{userId}:consults` | `SavedConsult[]` | 최근 50개 |
| `user:{userId}:actions` | `ActionItem[]` | 최근 200개 |
| `user:{userId}:consult-basis` | `ConsultBasisDoc` | 상담용 리포트 요약 |
| `share:{token}` | `ShareSnapshot` | 공개 공유 스냅샷 |
| `user:{userId}:share:{kind}` | token | 리포트별 공유 토큰 재사용 |

`userId`는 Supabase `auth.uid()`다.

## 리포트 저장 정책

- `personal`, `tci`, `fusion`, `family` 리포트는 종류별 1건만 저장한다.
- 같은 종류를 재생성하면 이전 리포트는 덮어쓴다.
- 상담은 개별 히스토리로 저장하고 최근 50개만 유지한다.
- 코칭 액션은 최근 200개만 유지하며 `source + title` 중복 등록을 막는다.

## 프롬프트 정책

`lib/prompts/defaults.ts`가 source of truth다. KV에 저장된 override가 있어도 default의 `version`이 더 높으면 default를 우선한다.

현재 prompt key:

- `tci-report`
- `personal-saju`
- `family-saju`
- `tci-saju-fusion`
- `consult`
- `consult-basis`

`/api/prompts/{key}`는 GET은 열려 있고, PUT/DELETE는 `ADMIN_EMAILS`에 포함된 이메일 사용자만 가능하다.

## AI 호출 구조

- `getAIProvider()`는 현재 Gemini만 지원한다.
- 기본 모델: `GEMINI_MODEL || gemini-2.5-pro`.
- 상담 근거 요약 모델: `GEMINI_SUMMARY_MODEL || gemini-2.5-flash`.
- 개인/가족 리포트는 Gemini JSON schema를 사용한다.
- 기질/융합/상담은 텍스트 응답 끝의 `FLEX=NN` 또는 `ACTIONS=[...]` 트레일러를 서버에서 파싱한다.

## 결정론적 계산

사주 계산은 `lib/saju/calculator.ts`에서 수행한다. LLM은 만세력 계산을 하지 않고, 계산된 표/좌표/대운을 해석만 한다.

출생 시각을 모르는 경우 시간 pillar는 생략되며 내부 계산 폴백은 prototype 수준이다. 출생 시각이 있으면 `lib/saju/koreanTime.ts`에서 한국 출생 기준으로 역사 표준시/서머타임 기록 시각을 현재 한국 표준시(UTC+9) 기준으로 먼저 정규화하고, KST 기준 경도 동경 135도와 국내 평균 경도 동경 127.5도의 차이(-30분)를 추가 적용한 계산 시각을 `lunar-javascript`에 전달한다.

TODO: 출생지 기반 가변 경도/진태양시 보정, 해외 출생 타임존, 23시대 야자시 적용 여부는 아직 구현하지 않는다.
