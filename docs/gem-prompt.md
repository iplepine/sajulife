<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `dafca4b4aa0e8b6b278b9ba05bfcedfe596efb0b` (`main`)
> - 최근 커밋: `dafca4b4aa0e` docs: refresh project documentation status
> - 커밋 일시: `2026-06-20T22:38:59+09:00`
> - 워킹트리: `dirty (10 files)`
> - 문서 갱신: `2026-06-20 22:39:28 +0900`
<!-- COMMIT_STATUS END -->

# Gemini Gems — 리포트 테스트 가이드

마지막 갱신일: 2026-06-20

운영 프롬프트를 실제 API 비용 없이 먼저 점검하기 위한 수동 테스트 흐름이다. 앱이나 eval 스크립트가 만든 완전 렌더 프롬프트를 Gem에 그대로 붙여넣어 결과물을 본다.

## 전제

- 프롬프트 원본은 `lib/prompts/defaults.ts`다.
- `/api/saju/preview-prompt`는 KV override를 우회하고 defaults 기준 개인 사주 프롬프트를 렌더한다.
- `/saju` 화면의 `Gem 프롬프트 복사`는 현재 사용자 데이터로 렌더된 개인 사주 프롬프트를 클립보드에 넣는다.
- 운영 API로 리포트를 생성하면 Gemini 비용이 발생한다.
- 현재 모든 AI 리포트 톤은 반말 팩폭 친언니/형 톤이다. Gem instructions도 이 톤을 방해하면 안 된다.

## 1회만 — Gem 만들기

1. https://gemini.google.com 접속.
2. 좌측 메뉴에서 Gem 만들기.
3. 이름: `sajulife 리포트 테스터`.
4. Instructions에 아래 내용을 붙여넣는다.

```text
당신은 sajulife의 AI 리포트 테스트 실행기입니다. 사용자가 다음 메시지로 완전 렌더된 프롬프트를 주면, 그 프롬프트 안의 지시, 출력 형식, 말투, 금지사항, 마지막 시스템용 줄까지 그대로 따릅니다. 프롬프트에 없는 데이터를 추가하지 않고, 프롬프트 내용을 해설하지 않으며, 최종 결과물만 출력합니다. 프롬프트가 반말 팩폭 톤을 요구하면 그대로 반말로 씁니다.
```

Instructions에는 사용자 데이터, 출력 형식, 사주 규칙을 따로 넣지 않는다. 그 모든 내용은 앱이 만든 완전 렌더 프롬프트 안에 이미 들어 있다.

## 개인 사주 프롬프트 테스트

1. 로컬 앱에서 프로필을 입력한다.
2. `/saju`에 들어간다.
3. `Gem 프롬프트 복사`를 누른다.
4. Gem 새 채팅에 그대로 붙여넣는다.
5. 결과가 현재 프롬프트 규칙을 지키는지 확인한다.

## 대량/다종 리포트 테스트

여러 페르소나와 리포트 종류를 렌더하려면 eval 하니스를 쓴다.

```bash
npm run eval:render
npm run eval:render -- saju
npm run eval:render -- consult p1-jiyu
```

출력은 `scripts/eval/out/prompts/`에 생성된다. 이 파일을 Gem 또는 Claude 평가 루프에 넣어 확인한다.

현재 지원 kind:

- `saju`
- `tci`
- `fusion`
- `family`
- `consult`

## 평가 체크포인트

- 첫 30초 안에 "이건 내 얘기다" 싶은 구체성이 있는가.
- 사주/기질/가족/상담 각각의 근거를 섞지 말아야 할 곳에서 섞지 않는가.
- 어려운 명리 용어를 쓸 때 일상어 풀이가 붙는가.
- 공포 조장이나 운명 단정으로 흐르지 않는가.
- 미래 표현이 "언젠가"가 아니라 월/분기 단위로 구체적인가.
- 코칭 액션이 `오늘 / 이번 주 / 이번 달`로 실행 가능하게 떨어지는가.
- 기질/융합 리포트에서 `FLEX=NN`과 본문 유연성 값이 일치하는가.
- `ACTIONS=[...]` 트레일러가 JSON 한 줄로 출력되는가.
- 미치환 `{{변수}}`, 프롬프트 지시문 노출, 코드블록 표시가 없는가.

정식 채점 기준은 `scripts/eval/검증조건.md`를 따른다.

## 프롬프트를 손볼 때

1. `lib/prompts/defaults.ts`를 수정한다.
2. 의미 있는 기본 프롬프트 변경이면 해당 prompt의 `version`을 올린다.
3. `npm run eval:render`로 렌더 결과를 확인한다.
4. 필요한 경우 Gem에 붙여 결과물을 확인한다.
5. 운영 KV override가 필요한 경우 debug 페이지의 PromptDebugPanel 또는 `/api/prompts/{key}` 관리자 API를 사용한다.

## 알려진 제약

- Gem 결과는 운영 API 결과와 모델/환경이 다르다. 운영 출력 최종 검증은 실제 Gemini API로 1회 확인해야 한다.
- Pro 모델은 결제 활성화된 API 키가 필요할 수 있다.
- debug UI에서 저장한 프롬프트 override는 Upstash KV `prompts` 키에 저장된다.
