# 리포트 검증 하니스 (AI API 비용 0)

Gemini를 호출하지 않고, **프롬프트 렌더 → Claude가 직접 리포트 생성 → 페르소나 평가**를
반복하기 위한 오프라인 환경. 프롬프트를 고친 뒤 결과 품질을 빠르게 확인하는 용도다.

운영 경로(`/api/saju/personal` 등)는 Gemini를 호출해 비용이 들지만, 이 하니스는
- 프롬프트를 `lib/prompts/defaults.ts`(코드 기준, **KV 우회**)에서 렌더하고,
- 리포트 생성을 **Claude(이 세션)** 가 대신하며,
- 평가도 Claude의 서브에이전트(페르소나)가 한다.

`docs/gem-prompt.md`의 "Gem에 붙여넣기" 흐름과 같은 발상이되, 사람이 복붙하는 대신
Claude가 루프를 돌린다.

> **채점 기준은 [검증조건.md](./검증조건.md)가 source of truth다.** 이 README는
> "어떻게 돌리나"(실행 메커니즘), 검증조건.md는 "무엇을 좋은 리포트로 보는가"(정답지·앵커).
> 리포트 종류마다 정답이 다르다 — 특히 사주를 TCI 결과와 일치하는지로 평가하지 말 것.

## 디렉토리

```
scripts/eval/
  personas.ts   # 검증용 페르소나 5종 (사주 프로필 + TCI 목표 + 응답 합성)
  render.ts     # 프롬프트 렌더 CLI (AI 호출 0)
  out/          # 생성물 (git 추적 안 함)
    prompts/    # {persona}-{kind}.txt  + {persona}-meta.json
    reports/    # Claude가 생성한 리포트 (2단계)
    reviews/    # 페르소나 평가 결과 (3단계)
```

페르소나는 만세력 경계 케이스(아침/야자시/조자시/시각모름/음력)와
기질 분포(극단/평탄=바넘 테스트)를 일부러 망라한다. 새 케이스가 필요하면
`personas.ts`의 `PERSONAS` 배열에 추가하면 된다.

## 1) 렌더 — 프롬프트 만들기 (사람/스크립트, 비용 0)

```bash
npm run eval:render                  # 전체 페르소나 × {saju, tci, fusion}
npm run eval:render -- saju          # saju만 전체 페르소나
npm run eval:render -- tci p1-jiyu   # 특정 종류·페르소나
```

`scripts/eval/out/prompts/`에 렌더된 프롬프트와 페르소나 메타가 떨어진다.
프롬프트는 항상 **현재 코드의 defaults.ts** 기준이라, 프롬프트를 수정한 뒤
다시 렌더하면 바로 반영된다(KV에 저장된 옛 버전과 무관).

## 2) 생성 — Claude가 리포트 쓰기 (이 세션, 비용 0)

Claude에게 이렇게 지시한다(이 세션에서 그대로 실행 가능):

> `scripts/eval/out/prompts/p1-jiyu-saju.txt`의 프롬프트를 **그 지시문대로 충실히 따라**
> 리포트를 작성하고 `scripts/eval/out/reports/p1-jiyu-saju.txt`에 저장해줘.
> 프롬프트는 작업 지시이지 출력에 포함하지 말 것.

여러 개를 한 번에 돌리려면 Claude가 페르소나/종류별로 서브에이전트를 병렬로 띄워
각 프롬프트를 생성하게 한다. (운영 모델은 Gemini지만, 여기서는 품질 상한을 보기 위해
Claude로 생성한다. 실제 운영 품질을 보려면 한두 개만 골라 사용자가 직접 `/api`로 생성.)

## 3) 평가 — 페르소나가 채점 (이 세션, 비용 0)

Claude에게 5종 독자 페르소나(회의적 합리주의자 / 명리 애호가 / 가성비 실속파 /
심리테스트 마니아 / 콘텐츠 에디터)를 주입한 서브에이전트를 병렬로 띄워
`out/reports/`의 리포트를 동일 루브릭(적중·구체성·깊이·문장·신뢰성, 각 10점)으로
채점하게 한다. 결과는 `out/reviews/`에 저장.

## 빠른 반복 루프

```
프롬프트 수정(defaults.ts) → npm run eval:render → Claude 생성 → 페르소나 평가 → 반복
```

한 사이클 전체가 Gemini 호출 0건이다. 운영 배포 전에 프롬프트 변경의 효과를
이 루프로 먼저 확인하고, 최종 확정본만 사용자가 실모델(Gemini Pro)로 1회 검증한다.

## 주의

- `out/`은 `.gitignore` 대상(생성물). 페르소나/스크립트만 커밋한다.
- `render.ts`는 `getNowVars()`로 기준일을 잡는다 — 실제 오늘 날짜라 매번 달라질 수 있다.
  재현이 필요하면 같은 날 렌더하거나 `getNowVars`를 고정값으로 임시 수정.
- 이 하니스로 만든 리포트는 **Claude 생성물**이라 운영(Gemini) 결과와 문장 결이 다르다.
  목적은 "프롬프트가 좋은 리포트를 끌어낼 구조인가"를 보는 것이지, 운영 출력 그대로의
  재현이 아니다.
