<!-- COMMON_RULE START -->
# 공통 AI 에이전트 운영 룰

이 repo의 AI 작업은 **모든 프로젝트 공통 운영 룰**(정본·단일 소스)을 따릅니다:

- 정본: `/Users/basil/Projects/project-manager/ai_agent_rule.md`

핵심 요약(자세한 건 정본):
- **작업 크기에 맞춰 절차 조절** — Trivial/Small은 fast-path(문서 통독·커밋상태 하네스·핸드오프 게이트 생략/축소), 큰 작업만 풀코스.
- **낭비 제거** — 커밋상태 스탬프는 세션/PR 끝 1회 + 바뀐 문서만(`--file`), 검증은 슬라이스마다가 아니라 커밋 직전 1회.
- **병렬** — 문서 갱신은 서로 다른 파일로 팬아웃, 빌드는 백그라운드, git 커밋 꼬리는 직렬.
- 커밋/푸시는 사용자가 요청할 때만.

--- 아래는 이 repo 고유 규칙 ---
<!-- COMMON_RULE END -->

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

- 모든 사용자 노출 텍스트는 **한국어**.
- ★모든 AI 리포트(개인사주·기질·융합·가족·상담)는 '입 거친 친언니/형' 반말 팩폭 톤으로 통일★ — 2026-06 전환:
  - 반말(너/네·~야·~거든). **존댓말·"님" 안 씀.** 슬랭·밈(만렙·존버·현타·찐) + 과장 비유 + 시기·기질마다 찰진 '별명' 캐릭터화. 직설 '팩폭'하되 끝은 응원으로 닫음. 비속어는 강조용 1~2회 이하. 강한 단정(100%·무조건·딱) OK — 겁주기 아닌 "내가 보증한다" 톤.
  - 한자·명리 용어 **써도 됨 — 단 반드시 옆 괄호에 일상어 풀이**: `식신(食神 - 깊게 파고드는 연구 능력)`. (가족·융합은 한자 전면 금지 유지 — 자연어 메타포로.)
  - ★가족 리포트만 예외 처리★: 반말·팩폭은 **'너'에게만**, 가족 구성원(부모·배우자·자녀)은 반말·비난 금지하고 'OO 어머니'처럼 **존중 묘사**.
- **리포트 화면 설명문구**(레이더 캡션·LifeCircle/FamilyCircle 안내·로딩 메시지 등)도 반말. **순수 UI 칩(버튼·메뉴·온보딩·인증·에러/검증 메시지)은 존댓말 유지.**
- 사주 jargon → 일상어 풀이 (반말 톤에선 괄호 안 번역으로, 그 외엔 본문 치환으로):
  - 일간 → "○○ 같은 사람" / 월지·타고난 자리 → "타고난 결·내 뿌리" / 대운 → "10년 단위 흐름" / 음양·한열 → "따뜻한 편·약한 음"

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

## 기질(TCI) 용어 체계 — 2026-06 재명명

- 사용자 노출 라벨은 7차원을 **추진성(NS)·안정성(HA)·공감성(RD)·지속성(PS)·주도성(SD)·연결성(CO)·통찰성(ST)** 로 쓴다. 코드(NS 등)는 [lib/tci/questions.ts](lib/tci/questions.ts)·[scoring.ts](lib/tci/scoring.ts)의 **내부 채점 키**로만 유지, 본문 노출 금지. 옛 임상용어(자극추구·위험회피·인내력·연대감 등)도 금지.
- **유연성**은 8번째 축(새로 추가). TCI에 대응 데이터가 없어 **AI가 추정** — 기질 리포트가 본문 끝 `FLEX=NN` 한 줄로 내보내면 [api/tci/report](app/api/tci/report/route.ts)가 떼어내 `flexibility`로 저장/반환.
- **8축 레이더** = [components/TciRadar.tsx](components/TciRadar.tsx). 중앙=낮음, 바깥 돌출=강조, 점선=균형선(50%). `deficitKeys`로 부족한 오행과 묶인 축을 빨강 '움푹' 표시(융합 화면).
- **오행 ↔ 축 매핑**: 목→추진성·유연성 / 화→주도성·공감성 / 토→안정성·지속성 / 금→연결성 / 수→통찰성·공감성. 융합 프롬프트([defaults.ts](lib/prompts/defaults.ts) `tci-saju-fusion`)와 [app/fusion/page.tsx](app/fusion/page.tsx) `WUXING_AXIS`가 같은 출처.
- **개인 리포트 섹션 순서**는 만 나이대 우선순위로 재정렬([format.ts](lib/saju/format.ts) `ageBandPriority` 주입). '기본 성향'은 맨 앞 고정, 나머지는 나이대 관심사 순.

## 데이터 / 계산

- 사주(만세력)는 lunar-javascript로 정확히 계산되어 LLM에 주입됨. **LLM이 직접 만세력 계산 못 하게 막을 것**.
- 음양·한열 좌표는 [lib/saju/balance.ts](lib/saju/balance.ts) — 같은 수치를 LifeCircle과 AI 프롬프트가 공유.
- 일간 메타포, 12지지 계절 풀이는 [lib/saju/seasonClock.ts](lib/saju/seasonClock.ts)의 `STEM_META` / `BRANCH_META`. 일관성 위해 LifeCircle과 프롬프트가 같은 출처 사용.

## 테스트

- 단위 테스트 프레임워크는 아직 없음. 변경은 dev 서버에서 시각 확인이 1차 검증.
- AI 호출 비용·시간이 큰 변경은 사용자가 직접 검증하도록 안내. Claude가 자체적으로 generate 트리거하지 말 것.
