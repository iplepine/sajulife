# sajulife

사주와 기질 데이터를 바탕으로 생애 고민을 해석하고, AI 상담과 코칭 액션으로 이어주는 웹 프로토타입.

현재 단계: `Explore`

## 무엇을 하는가

핵심 루프는 `사주/기질 입력 -> 리포트 생성 -> 현재 고민 상담 -> 코칭 액션 등록 -> 재방문`이다.

현재 구현된 사용자 기능:

1. **게스트/이메일 계정** — Supabase 익명 로그인, 이메일 로그인/회원가입, 게스트 데이터 유지 전환.
2. **개인 사주 리포트** — `lunar-javascript`로 만세력 계산 후 Gemini가 해석.
3. **기질 리포트** — 약식 35문항 TCI 프로토타입, 7차원 + AI 추정 유연성 축.
4. **사주 x 기질 융합 리포트** — 사주와 기질의 공명/긴장을 통합.
5. **가족 사주 리포트** — 가족 구성원 추가, 관계 시각화, 관계 풀이.
6. **AI 상담** — 저장된 리포트 요약을 근거로 단건 고민 답변과 히스토리 저장.
7. **코칭 액션 플랜** — 리포트/상담 액션 후보 등록, 직접 추가, 완료 토글.
8. **공유하기** — 리포트별 공개 스냅샷 링크와 OG 이미지.
9. **프롬프트 디버그** — debug 페이지와 관리자 API로 프롬프트 확인/편집.

## 실행

```bash
npm install
vercel env pull .env.local
npm run dev
```

개발 URL은 `http://localhost:3000`이다. `vercel dev`를 사용하면 Vercel 런타임과 env 주입을 더 가깝게 에뮬레이션할 수 있다.

직접 env를 세팅할 때는 `.env.example`을 따른다.

필수:

- `GEMINI_API_KEY`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

주요 선택/운영:

- `GEMINI_MODEL` — 기본 `gemini-2.5-pro`
- `GEMINI_SUMMARY_MODEL` — 상담 근거 요약 기본 `gemini-2.5-flash`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_KAKAO_JS_KEY`

## 검증

```bash
npm run typecheck
npm run build
npm run eval:render
```

`npm run eval:render`는 Gemini를 호출하지 않고 `lib/prompts/defaults.ts` 기준 프롬프트를 렌더한다.

실제 리포트/상담 생성 API는 Gemini 비용이 발생한다. 자동 검증에서 무심코 호출하지 않는다.

## 디렉토리

```text
app/
  page.tsx                 # 랜딩, 게스트 시작
  auth/                    # 이메일 로그인/회원가입/confirm
  onboarding/              # 사주 프로필 입력
  dashboard/               # 리포트 허브
  tci/, saju/, fusion/     # 기질/개인/융합 리포트
  family/                  # 가족 구성원 + 가족 리포트
  consult/                 # AI 상담
  coaching/                # 코칭 액션 플랜
  share/[token]/           # 공개 공유 리포트
  api/                     # profile, reports, consult, coaching, share, prompts
components/
  report/                  # 리포트 종류별 시각화/본문 컴포넌트
  PromptDebugPanel.tsx     # debug 화면 공통 프롬프트 패널
lib/
  ai/                      # Gemini provider abstraction
  prompts/                 # 기본 프롬프트, 렌더, KV override
  saju/                    # 만세력 계산, 포맷, 시각화 메타
  tci/                     # 문항, 하위척도, 채점
  store/                   # Upstash KV 저장소
  supabase/                # SSR/client/middleware
scripts/eval/              # 비용 0 프롬프트 렌더/eval 하니스
docs/                      # 제품/운영/시장/작업 문서
```

## 저장소 키

제품 데이터는 Supabase `auth.uid()`를 기준으로 Upstash KV에 저장한다.

- `prompts`
- `user:{userId}:profile`
- `user:{userId}:tci:{short|full}`
- `user:{userId}:tci` — legacy short fallback
- `user:{userId}:family`
- `user:{userId}:report:{tci|personal|family|fusion}`
- `user:{userId}:consults`
- `user:{userId}:actions`
- `user:{userId}:consult-basis`
- `share:{token}`
- `user:{userId}:share:{kind}`

리포트 4종은 종류별 최신본만 저장하고 재생성 시 덮어쓴다. 상담은 최근 50개, 액션은 최근 200개를 유지한다.

## 프롬프트

`lib/prompts/defaults.ts`가 source of truth다. KV `prompts`에 저장된 관리자 override가 있어도 default의 `version`이 더 높으면 default가 우선한다.

현재 prompt key는 6개다.

- `tci-report`
- `personal-saju`
- `family-saju`
- `tci-saju-fusion`
- `consult`
- `consult-basis`

## 문서

상세 문서는 [docs/README.md](docs/README.md), 제품 브리프는 [docs/product/PRODUCT_BRIEF.md](docs/product/PRODUCT_BRIEF.md), 아키텍처는 [docs/operations/ARCHITECTURE.md](docs/operations/ARCHITECTURE.md), 의사결정 기록은 [docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md)를 먼저 본다.

로컬 전용 프로젝트 매니저 메모:

- `~/Projects/project-manager/projects/sajulife.md`
- `~/Projects/project-manager/PROJECT_PRIORITIES.md`
