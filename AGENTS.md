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

# 프로젝트 문서

모든 프로젝트 문서는 [docs/README.md](docs/README.md)를 먼저 참고하세요.

# 공통 개발 워크플로우

모든 AI/Codex 개발 작업은 중앙 워크플로우를 따릅니다.

- 원본: `~/Projects/project-manager/PROJECT_WORKFLOW.md` (로컬 전용)
- 이 repo의 예외/실행 명령: [docs/operations/DEVELOPMENT_WORKFLOW.md](docs/operations/DEVELOPMENT_WORKFLOW.md) (필요해지면 추가)

기본 순서:

1. `docs/README.md`와 관련 제품/운영/결정 문서를 확인합니다.
2. 기능, UX, 데이터, 결제, 개인정보, 제품 범위가 바뀌면 스펙을 정리하고 사용자 확인을 받습니다.
3. 승인된 범위만 thin slice 단위로 구현합니다.
4. 각 slice마다 즉시 검증하고 테스트를 추가/수정합니다.
5. 통합 테스트, 정적 분석, 빌드 또는 smoke 검증을 실행합니다.
6. 관련 문서를 갱신합니다.
7. 사용자 요청에 따라 커밋하고, 원격이 있으면 푸시합니다.

중요한 제품/기술 결정은 `docs/decisions/DECISIONS.md`에 남깁니다.
