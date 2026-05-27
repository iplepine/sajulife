# sajulife 문서 홈

이 폴더는 sajulife 제품, 수익화, 운영, 의사결정, 작업 문서를 모아 관리한다.
새 문서와 기존 문서는 아래 표준 구조에 맞춰 둔다.

## 표준 구조

| 폴더 | 역할 |
|------|------|
| `product/` | 제품 정의, 유즈케이스, 기능 맵, 컨설팅/신뢰 원칙 |
| `go-to-market/` | 수익 모델, 퍼널 지표, 성장 가설 |
| `operations/` | 출시 준비, 아키텍처, 배포, 외부 서비스(사주 엔진, LLM) |
| `decisions/` | 주요 의사결정과 보류 사항 |
| `work/` | 현재 goal, roadmap, active task |
| `archive/` | 더 이상 표준 문서가 아니지만 보존할 자료 |

## 우선 생성할 문서

상위 프로젝트 메모(`~/Projects/project-manager/projects/sajulife.md`, 로컬 전용)의 "우선 생성/갱신할 문서"를 따른다.

1. `product/PRODUCT_BRIEF.md`: 단순 사주 풀이가 아니라 "생애 문제 컨설팅"으로 포지셔닝.
2. `product/MVP_SCOPE.md`: 한 가지 문제 카테고리(예: 진로 또는 이직)부터 thin-slice.
3. `product/RESEARCH_LOG.md`: 기존 사주앱/운세앱 결제 사용자 5-10명 인터뷰.
4. `go-to-market/REVENUE_MODEL.md`: 단건 풀이 / 구독 / 심층 리포트 가설.
5. `decisions/DECISIONS.md`: 웹 서버 스택, 사주 엔진, LLM 사용 범위 결정 기록.

## 템플릿

문서를 새로 만들 때는 `~/Projects/project-manager/templates/`(로컬 전용)의 템플릿을 사용한다.
