<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `c096c5e3e99177ea8e41ec04f3f849fcff07c77e` (`main`)
> - 최근 커밋: `c096c5e3e991` docs: 말투·디자인 정합 시안 4종 기록
> - 커밋 일시: `2026-11-15T21:20:28+09:00`
> - 워킹트리: `dirty (22 files)`
> - 문서 갱신: `2026-11-15 23:29:14 +0900`
<!-- COMMIT_STATUS END -->

# 작업 관리

마지막 갱신일: 2026-11-10

이 폴더는 현재 목표, 로드맵, 실행 task를 관리합니다. 상세 제품 정의는 `docs/product/`, 시장 검증은 `docs/go-to-market/`, 결정 기록은 `docs/decisions/`를 봅니다.

## 현재 집중

현재 active goal: `goals/active/2026-06-consulting-loop-validation.md`

현재 active roadmap: `roadmaps/active/2026-06-thin-slice-validation.md`

현재 active task: `tasks/active/2026-06-beta-readiness.md`

2026-11-10 정리: 10월 홈·모바일 흐름 task 5건(홈 렌즈, 사주 시작 안내, 초상 홈, 모바일 흐름 정리, 인물 중심 A안)은 이미 `main`에 출고되어 `tasks/done/`으로 옮겼다. 남은 active는 베타 검증 준비 하나다.

## 이번 사이클 질문

2026-11-15 완료: [A 보존 / 캐릭터 중심 B 전체 화면](tasks/done/2026-11-15-character-design-b.md). A를 기본값으로 보존하고 `/design-review`·`?design=b`로 주요 내부 화면에 B를 유지한다. 공개 궁서 랜딩과 기존 기능/데이터를 유지했다. 검증과 이전 시안 정정은 [작업 기록](reviews/2026-11-15-home-voice-design.md)을 본다.

사용자가 사주/기질 리포트를 받은 뒤 실제 고민을 AI 상담에 입력하고, 코칭 액션을 등록하거나 다음 고민으로 재방문하는가?

## 읽는 순서

1. `goals/active/`에서 지금 왜 이 일을 하는지 확인합니다.
2. `roadmaps/active/`에서 이번 사이클의 순서를 확인합니다.
3. `tasks/active/`에서 지금 실제로 끝낼 작업을 확인합니다.
4. 완료된 작업은 `tasks/done/`으로 옮기고 roadmap 진행률을 갱신합니다.

## 폴더

```text
goals/
  active/
  done/
roadmaps/
  active/
  done/
tasks/
  active/
  backlog/
  done/
reviews/
```

## 운영 규칙

- active task는 최대 3개만 둡니다.
- task는 반드시 roadmap에 연결합니다.
- roadmap은 반드시 goal에 연결합니다.
- 완료 기준이 없는 task는 active에 두지 않습니다.
- 개발 task는 테스트, 빌드/검증, 문서 업데이트 체크를 포함합니다.
