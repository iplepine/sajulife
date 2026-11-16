<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `2cd822a0d7f9e17e3dff712cc3dc07185a57655c` (`main`)
> - 최근 커밋: `2cd822a0d7f9` feat: add temperament result tab and visual report studies
> - 커밋 일시: `2026-11-16T12:35:48+09:00`
> - 워킹트리: `dirty (5 files)`
> - 문서 갱신: `2026-11-16 12:36:26 +0900`
<!-- COMMIT_STATUS END -->

# 작업 관리

마지막 갱신일: 2026-11-16

이 폴더는 현재 목표, 로드맵, 실행 task를 관리합니다. 상세 제품 정의는 `docs/product/`, 시장 검증은 `docs/go-to-market/`, 결정 기록은 `docs/decisions/`를 봅니다.

## 현재 집중

현재 active goal: `goals/active/2026-06-consulting-loop-validation.md`

현재 active roadmap: `roadmaps/active/2026-06-thin-slice-validation.md`

현재 active task: `tasks/active/2026-06-beta-readiness.md`

2026-11-10 정리: 10월 홈·모바일 흐름 task 5건(홈 렌즈, 사주 시작 안내, 초상 홈, 모바일 흐름 정리, 인물 중심 A안)은 이미 `main`에 출고되어 `tasks/done/`으로 옮겼다. 남은 active는 베타 검증 준비 하나다.

## 이번 사이클 질문

2026-11-16 제안 완료: [최종 통합 리포트의 시각 요약 4종](tasks/done/2026-11-16-fusion-visual-opening.md). 첫 화면의 긴 본문 앞에 두 관점/흐름/장면/실제 근거를 보여주는 방식을 A/B 각각 비교한다. 04 ‘두 근거 한눈에’를 추천하며 대표 선택 전 실제 리포트는 유지했다. 24개 오프라인 레이아웃·동작 검증, 가상 자료 명시. 후속 요청으로 `2cd822a`의 `origin/main` 푸시 완료. [비교 화면](../../design-previews/fusion-visual-opening/index.html).

2026-11-16 완료: [최종 결과의 기질 검사 탭](tasks/done/2026-11-16-temperament-result-tab.md). 종합 풀이·사주 풀이 옆에서 완료 응답 7축과 설명을 읽고, 과거 기질 해설/당시 점수는 별도로 보존한다. 추가 AI 없이 조회하며 부분 응답·오류 재시도를 구분한다. 101개 단위 테스트·빌드·화면 18건 통과. 후속으로 A 리포트형/B 기질오빠 안내를 구분하고 A/B 각각 모바일 하단 고정·안전 영역과 PC를 포함한 20건을 검증했다. 긴 전체 캡처의 고정 메뉴 혼동은 실제 뷰포트 캡처로 정정했다. 후속 요청으로 `2cd822a`의 `origin/main` 푸시 완료, 실서비스 배포 완료 여부는 미확인.

2026-11-16 완료: [사주언니·기질오빠 직접 반말 복원](tasks/done/2026-11-16-restore-character-voice.md). 과거 커밋에서 화자 변경을 확인하고 7종의 직접 구어체·버전을 정렬했다. 97개 테스트·타입·lint·12건 오프라인 렌더 통과. 후속 대표 요청으로 `28afb73`을 `origin/main`에 푸시 완료. 실제 생성·별도 배포 실행은 미실행. [이력과 검증](reviews/2026-11-16-character-voice-restoration.md).

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
