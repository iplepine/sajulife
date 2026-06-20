<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `dafca4b4aa0e8b6b278b9ba05bfcedfe596efb0b` (`main`)
> - 최근 커밋: `dafca4b4aa0e` docs: refresh project documentation status
> - 커밋 일시: `2026-06-20T22:38:59+09:00`
> - 워킹트리: `dirty (10 files)`
> - 문서 갱신: `2026-06-20 22:39:28 +0900`
<!-- COMMIT_STATUS END -->

# sajulife 문서 홈

마지막 갱신일: 2026-06-20

이 폴더는 sajulife 제품, 수익화, 운영, 의사결정, 작업 문서를 모아 관리한다.
현재 제품 정본은 "사주/기질 기반 생애 문제 컨설팅 루프"다. 단순 프롬프트 튜닝 도구가 아니라, 리포트 -> AI 상담 -> 코칭 액션 -> 재방문을 검증하는 웹 서비스로 문서를 유지한다.

## 표준 구조

| 폴더 | 역할 |
|------|------|
| `product/` | 제품 정의, 유즈케이스, 기능 맵, 컨설팅/신뢰 원칙 |
| `go-to-market/` | 수익 모델, 퍼널 지표, 성장 가설 |
| `operations/` | 출시 준비, 아키텍처, 배포, 외부 서비스(사주 엔진, LLM) |
| `decisions/` | 주요 의사결정과 보류 사항 |
| `work/` | 현재 goal, roadmap, active task |
| `archive/` | 더 이상 표준 문서가 아니지만 보존할 자료 |

## 먼저 읽을 문서

작업을 시작할 때 아래 순서로 읽는다.

1. `product/PRODUCT_BRIEF.md` — 제품 포지셔닝과 핵심 루프.
2. `product/MVP_SCOPE.md` — 현재 MVP 포함/제외 범위.
3. `product/USE_CASES.md` — 구현된 사용자 흐름과 UX 설명 책임.
4. `product/FEATURE_MAP.md` — 기능별 구현 상태.
5. `product/TRUST_AND_PRIVACY.md` — 개인정보, LLM 전송, 공유 신뢰 원칙.
6. `operations/ARCHITECTURE.md` — 스택, 라우트, 저장소, AI 호출 구조.
7. `operations/DEVELOPMENT_WORKFLOW.md` — repo별 개발/검증 명령.
8. `operations/RELEASE_READINESS.md` — 베타/유료 출시 준비 상태.
9. `go-to-market/REVENUE_MODEL.md`와 `go-to-market/RESEARCH_LOG.md` — 수익 가설과 사용자 근거.
10. `work/README.md` — 현재 goal/roadmap/task.
11. `decisions/DECISIONS.md` — 주요 결정 기록.

## 현재 문서 상태

| 문서 | 상태 | 비고 |
|---|---|---|
| `product/PRODUCT_BRIEF.md` | 최신 | 2026-06-20 구현 기준 |
| `product/MVP_SCOPE.md` | 최신 | 현재 포함/제외 범위 |
| `product/USE_CASES.md` | 최신 | 핵심 UC 8개 |
| `product/FEATURE_MAP.md` | 최신 | 기능별 현재 구현 상태 |
| `product/TRUST_AND_PRIVACY.md` | 최신 | 베타 전 리스크 포함 |
| `go-to-market/REVENUE_MODEL.md` | 가설 | 결제 미구현 |
| `go-to-market/RESEARCH_LOG.md` | 대기 | 인터뷰 결과 없음 |
| `operations/ARCHITECTURE.md` | 최신 | Supabase + Upstash + Gemini |
| `operations/DEVELOPMENT_WORKFLOW.md` | 최신 | npm 검증 명령 |
| `operations/RELEASE_READINESS.md` | 최신 | 외부 유료 출시 미준비 |
| `decisions/DECISIONS.md` | 최신 | 주요 결정 기록 |

## 템플릿

문서를 새로 만들 때는 `~/Projects/project-manager/templates/`(로컬 전용)의 템플릿을 사용한다.
