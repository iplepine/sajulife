<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `7b2ca723e428a472f503e11fdfe9d55977554560` (`main`)
> - 최근 커밋: `7b2ca723e428` Polish report persona voice
> - 커밋 일시: `2026-06-25T22:30:37+09:00`
> - 워킹트리: `dirty (1 files)`
> - 문서 갱신: `2026-06-25 23:02:32 +0900`
<!-- COMMIT_STATUS END -->

# 개발 워크플로우

마지막 갱신일: 2026-06-20

공통 원칙은 `~/Projects/project-manager/PROJECT_WORKFLOW.md`를 따른다. 이 문서는 sajulife repo에서 실제로 쓰는 명령과 예외만 정리한다.

## 시작 전 확인

1. `docs/README.md`
2. `docs/product/PRODUCT_BRIEF.md`
3. `docs/product/MVP_SCOPE.md`
4. 관련 유즈케이스: `docs/product/USE_CASES.md`
5. 관련 결정: `docs/decisions/DECISIONS.md`
6. 현재 작업: `docs/work/README.md`

제품 범위, UX, 데이터, 결제, 개인정보, 신뢰 정책이 바뀌면 먼저 스펙을 갱신하고 사용자 확인을 받는다.

## 로컬 실행

```bash
npm install
vercel env pull .env.local
npm run dev
```

기본 개발 URL은 `http://localhost:3000`이다.

필수 환경변수는 `.env.example`을 따른다.

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ADMIN_EMAILS`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_KAKAO_JS_KEY`

## 검증 명령

```bash
npm run typecheck
npm run build
npm run eval:render
```

`npm run lint` 스크립트는 존재하지만 Next 15/ESLint 설정 상태에 따라 별도 정비가 필요할 수 있다. 실행 실패 시 실패 원인을 최종 보고에 남긴다.

## AI 비용 주의

다음 경로는 실제 Gemini 호출과 비용이 발생한다.

- `POST /api/saju/personal`
- `POST /api/tci/report`
- `POST /api/fusion/report`
- `POST /api/family/report`
- `POST /api/consult`
- 상담 근거 요약 백필/갱신

검증 목적이면 먼저 `npm run eval:render`처럼 AI 호출 없는 경로를 사용한다. 실제 생성은 사용자 확인 후 진행한다.

## 문서 갱신 기준

- 제품 약속/타깃/루프가 바뀌면 `docs/product/PRODUCT_BRIEF.md`.
- 기능 범위가 바뀌면 `docs/product/MVP_SCOPE.md`와 `docs/product/FEATURE_MAP.md`.
- 사용자 흐름이 바뀌면 `docs/product/USE_CASES.md`.
- 개인정보/공유/LLM 데이터 처리 방식이 바뀌면 `docs/product/TRUST_AND_PRIVACY.md`.
- 스택, 저장소, 모델, 인증, 프롬프트 정책이 바뀌면 `docs/operations/ARCHITECTURE.md`와 `docs/decisions/DECISIONS.md`.
- 출시 준비 상태가 바뀌면 `docs/operations/RELEASE_READINESS.md`.
- 시장 신호가 생기면 `docs/go-to-market/RESEARCH_LOG.md`.

## 커밋/푸시

`CLAUDE.md`의 repo 규칙을 따른다. 기본은 변경 후 커밋까지만 진행하고, `git push`는 사용자가 명시할 때만 한다.
