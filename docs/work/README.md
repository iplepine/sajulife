# 작업 관리

마지막 갱신일: 2026-05-26

이 폴더는 현재 목표, 로드맵, 실행 task를 관리합니다. 상세 제품 정의는 `docs/product/`, 시장 검증은 `docs/go-to-market/`, 결정 기록은 `docs/decisions/`를 봅니다.

## 현재 집중

현재 active goal: (없음 — 첫 goal 정의 필요)

현재 active roadmap: (없음)

현재 active task: (없음)

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
