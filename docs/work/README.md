<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `4897ae067f23c4035639cb4d0ced8b365a8b5bff` (`main`)
> - 최근 커밋: `4897ae067f23` feat(analytics): Vercel Analytics 도입 — 방문자·전환 퍼널 추적
> - 커밋 일시: `2026-06-20T15:41:55+09:00`
> - 워킹트리: `dirty (20 files)`
> - 문서 갱신: `2026-06-20 22:26:58 +0900`
<!-- COMMIT_STATUS END -->

# 작업 관리

마지막 갱신일: 2026-06-20

이 폴더는 현재 목표, 로드맵, 실행 task를 관리합니다. 상세 제품 정의는 `docs/product/`, 시장 검증은 `docs/go-to-market/`, 결정 기록은 `docs/decisions/`를 봅니다.

## 현재 집중

현재 active goal: `goals/active/2026-06-consulting-loop-validation.md`

현재 active roadmap: `roadmaps/active/2026-06-thin-slice-validation.md`

현재 active task: `tasks/active/2026-06-beta-readiness.md`

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
