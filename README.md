# sajulife

AI 사주 리포트 결과를 효과적으로 조절(프롬프트 튜닝)하기 위한 프로토타입.

현재 단계: `Explore`

## 무엇을 하는가

게스트로 로그인 → 사주 정보 입력 → 3가지 시나리오에서 AI 리포트와 프롬프트를 짝지어 실험한다.

1. **기질 검사** — 7차원 35문항 설문 + AI 기질 리포트
2. **개인 사주** — 사주 정보 기반 AI 리포트
3. **가족 사주** — 가족 구성원 추가 후 관계 풀이 AI 리포트

각 시나리오마다 프롬프트 디버그 화면이 있고, 거기서 수정한 값은 Upstash KV(Redis)에 영속된다(앱 재시작 후에도 유지).

## 실행

```bash
# Vercel 프로젝트에 link된 상태라면 env 자동 동기화
vercel env pull .env.local
npm install
npm run dev                  # http://localhost:3000
# 또는 vercel dev (serverless 런타임 에뮬레이션 + env 자동 주입)
```

env 직접 세팅 시: `.env.example` 참고하여 `GEMINI_API_KEY` + KV 관련 4종 (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, ...) 채운다.

- Gemini API 키: https://aistudio.google.com/apikey (무료 발급)
- KV: Vercel 대시보드 > Storage > Upstash KV 통합 연결 시 자동 주입

## 디렉토리

```
app/
  page.tsx               # 게스트 로그인 진입
  onboarding/            # 사주 정보 입력
  dashboard/             # 메인 허브
  tci/, saju/, family/   # 시나리오별 리포트 + debug
  api/                   # guest / profile / tci / saju / family / prompts
lib/
  ai/                    # AIProvider 추상화 + Gemini 구현
  store/                 # Upstash KV(Redis) 기반 영속
    kv.ts                # @upstash/redis 클라이언트 + readJson/writeJson
    keys.ts              # KV key 네임스페이스 (prompts, guest:{id}:{kind})
    guest.ts             # profile / tci / family 저장
    types.ts
  prompts/               # 기본 프롬프트 + 템플릿 렌더 + KV 저장
  tci/                   # 자체 7차원 문항 + 채점
  guest.ts               # 게스트 쿠키 관리
components/
  PromptDebugPanel.tsx   # 3개 debug 화면 공통 UI
```

KV 네임스페이스:
- `prompts` — 4종 프롬프트 설정(`PromptsStore`)
- `guest:{guestId}:profile` — 사주 입력
- `guest:{guestId}:tci` — TCI 응답
- `guest:{guestId}:family` — 가족 구성원

## AI 공급자 교체

기본은 Gemini. 다른 모델로 교체하려면 `lib/ai/`에 새 Provider 클래스를 추가하고 `index.ts`의 팩토리에 분기를 더한 뒤 `AI_PROVIDER` 환경변수를 바꾼다.

## 프로젝트 매니저 메모

로컬 전용 (repo 외부):

- `~/Projects/project-manager/projects/sajulife.md`
- `~/Projects/project-manager/PROJECT_PRIORITIES.md`

상세 문서는 [docs/README.md](docs/README.md), 의사결정 기록은 [docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md).
