<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `3c596f31478c9720fe4553b0ba8f11ceb8abd224` (`main`)
> - 최근 커밋: `3c596f31478c` docs: 출고된 10월 task를 done으로 옮기고 출시 준비 문서를 현재 상태로
> - 커밋 일시: `2026-11-10T23:36:42+09:00`
> - 워킹트리: `dirty (1 files)`
> - 문서 갱신: `2026-11-10 23:36:48 +0900`
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
