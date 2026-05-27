# sajulife

AI 사주 리포트 결과를 효과적으로 조절(프롬프트 튜닝)하기 위한 프로토타입.

현재 단계: `Explore`

## 무엇을 하는가

게스트로 로그인 → 사주 정보 입력 → 3가지 시나리오에서 AI 리포트와 프롬프트를 짝지어 실험한다.

1. **기질 검사** — 7차원 35문항 설문 + AI 기질 리포트
2. **개인 사주** — 사주 정보 기반 AI 리포트
3. **가족 사주** — 가족 구성원 추가 후 관계 풀이 AI 리포트

각 시나리오마다 프롬프트 디버그 화면이 있고, 거기서 수정한 값은 `data/prompts.json`에 영속된다(앱 재시작 후에도 유지).

## 실행

```bash
cp .env.example .env.local   # GEMINI_API_KEY 채우기
npm install
npm run dev                  # http://localhost:3000
```

Gemini API 키는 https://aistudio.google.com/apikey 에서 무료 발급.

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
  store/                 # 파일 기반 영속 (data/)
  prompts/               # 기본 프롬프트 + 템플릿 렌더
  tci/                   # 자체 7차원 문항 + 채점
  guest.ts               # 게스트 쿠키 관리
components/
  PromptDebugPanel.tsx   # 3개 debug 화면 공통 UI
data/                    # 런타임 생성, .gitignore
  prompts.json
  guests/{guestId}/profile.json, tci.json, family.json
```

## AI 공급자 교체

기본은 Gemini. 다른 모델로 교체하려면 `lib/ai/`에 새 Provider 클래스를 추가하고 `index.ts`의 팩토리에 분기를 더한 뒤 `AI_PROVIDER` 환경변수를 바꾼다.

## 프로젝트 매니저 메모

로컬 전용 (repo 외부):

- `~/Projects/project-manager/projects/sajulife.md`
- `~/Projects/project-manager/PROJECT_PRIORITIES.md`

상세 문서는 [docs/README.md](docs/README.md), 의사결정 기록은 [docs/decisions/DECISIONS.md](docs/decisions/DECISIONS.md).
