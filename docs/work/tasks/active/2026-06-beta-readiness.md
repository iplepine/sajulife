<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `dafca4b4aa0e8b6b278b9ba05bfcedfe596efb0b` (`main`)
> - 최근 커밋: `dafca4b4aa0e` docs: refresh project documentation status
> - 커밋 일시: `2026-06-20T22:38:59+09:00`
> - 워킹트리: `dirty (10 files)`
> - 문서 갱신: `2026-06-20 22:39:28 +0900`
<!-- COMMIT_STATUS END -->

# Task: 베타 검증 준비

상태: active
생성일: 2026-06-20
연결 Roadmap: `docs/work/roadmaps/active/2026-06-thin-slice-validation.md`

## 목표

소수 베타 사용자가 현재 구현된 루프를 실제로 사용해볼 수 있도록 문서, smoke 검증, 최소 고지를 정리한다.

## 범위

포함:

- 스펙 문서 최신화.
- smoke 시나리오와 검증 명령 정리.
- 개인정보/공유/LLM 리스크 명시.
- 리서치 인터뷰 질문 정리.

제외:

- 결제 구현.
- 자동 리마인더.
- 전체 테스트 프레임워크 도입.
- 공개 출시.

## 완료 기준

- `docs/product/*`, `docs/operations/*`, `docs/go-to-market/*`, `docs/work/*`가 현재 구현과 맞다.
- `npm run typecheck`와 `npm run build` 결과를 확인한다.
- 남은 리스크가 최종 보고에 명확히 남는다.

## 테스트 계획

- 문서 링크 확인.
- `npm run typecheck`
- `npm run build`
- 필요 시 `npm run eval:render`
