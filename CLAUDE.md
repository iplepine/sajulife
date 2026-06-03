# CLAUDE.md — sajulife에서 Claude가 지켜야 할 것

## Git 워크플로우

- **변경 후 커밋까지만** 진행한다. `git push`는 사용자가 로컬에서 검증한 뒤 명시적으로 지시할 때만.
- 커밋 단위는 **한 가지 의도 = 한 커밋**. 여러 작업이 섞이면 분리.
- 커밋 메시지는 한국어로, "왜" 중심.
- `git status`로 untracked까지 확인하고 의도한 파일만 add.

## AI 모델 / 비용

- 기본 모델: **Gemini 2.5 Pro** ([lib/ai/index.ts](lib/ai/index.ts)). ₩10k 품질 기준에 맞춤.
- 무료 티어 API 키는 Pro 호출 불가 → 결제 활성화 필요. 결제 안 됐으면 `.env.local`에서 Flash로 임시 fallback.
- AI 비용 발생 작업(`/api/saju/personal` POST 등)은 사용자가 명시할 때만 호출. 검증 목적의 호출 자체 자제.
- AI 호출 없는 미리보기는 `/api/saju/preview-prompt` (defaults.ts 기준 렌더만).

## 프롬프트 관리

- 운영 프롬프트는 [lib/prompts/defaults.ts](lib/prompts/defaults.ts)가 source of truth.
- KV(`prompts` key)에 저장된 옛 버전이 defaults를 덮을 수 있음. 새 프롬프트 검증 시 `/api/saju/preview-prompt`가 KV 우회.
- 외부 Gem 테스트 흐름은 [docs/gem-prompt.md](docs/gem-prompt.md) 참조.

## 언어 / 톤

- 모든 사용자 노출 텍스트는 **한국어**. 한자는 사주 기둥·일간 표기 외엔 거의 안 씀.
- 사주 jargon(일간/월지/타고난 자리 등) → 일반인 표현으로 풀어쓸 것:
  - 일간 → "○○ 같은 사람" (캐릭터 본성)
  - 월지 / 타고난 자리 → "타고난 결" 또는 "내 뿌리" (본바탕·환경)
  - 대운 → "10년 단위 인생 흐름" / 단순히 "흐름"
  - 음양·한열 같은 추상어 → "따뜻한 편 / 약한 음" 같은 자연어 라벨
- 존댓말 유지. "님" 호칭.

## 디자인 원칙

- 한지 + 먹 톤. 그레인은 `body::before`에 `var(--grain)`(0.04/0.06) opacity로 미묘하게.
- 본문(`.report`)은 깨끗한 surface 카드 위에. 그레인이 본문에 침투하면 가독성 안 좋음.
- 모바일 우선. 데스크탑 사이드바는 보조.
- 색은 신호로만 — 오행 5색은 의미 있을 때만, 알록달록 금지.
- 한자 라벨은 일반인 안 보이게. 시각화엔 emoji + 한국어 메타포.

## 사주 시각화 (LifeCircle 계절 시계)

- 시계 4분면: 위=여름, 우=봄, 아래=겨울, 좌=가을 (열↔한, 양↔음 축이 회전)
- 큰 점(natal) = 월지의 결, 평생 변하지 않는 본바탕
- 9 대운 점 = 라이프라인. 첫 점·마지막 점은 실제 startAge 라벨 ("5세" / "85세").
- 대운 진행 방향은 [lib/saju/seasonClock.ts](lib/saju/seasonClock.ts)의 `dayunDirection`이 자동 감지 (calculator 출력 배열 순서 기준).
- 본바탕("타고난 결")과 본성("○○ 같은 사람")이 헷갈리지 않게 라벨링 주의.

## 데이터 / 계산

- 사주(만세력)는 lunar-javascript로 정확히 계산되어 LLM에 주입됨. **LLM이 직접 만세력 계산 못 하게 막을 것**.
- 음양·한열 좌표는 [lib/saju/balance.ts](lib/saju/balance.ts) — 같은 수치를 LifeCircle과 AI 프롬프트가 공유.
- 일간 메타포, 12지지 계절 풀이는 [lib/saju/seasonClock.ts](lib/saju/seasonClock.ts)의 `STEM_META` / `BRANCH_META`. 일관성 위해 LifeCircle과 프롬프트가 같은 출처 사용.

## 테스트

- 단위 테스트 프레임워크는 아직 없음. 변경은 dev 서버에서 시각 확인이 1차 검증.
- AI 호출 비용·시간이 큰 변경은 사용자가 직접 검증하도록 안내. Claude가 자체적으로 generate 트리거하지 말 것.
