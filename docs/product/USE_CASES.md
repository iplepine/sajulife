<!-- COMMIT_STATUS START -->
> **커밋 상태**
> - 기준 커밋: `4647f941107c9993a6b74cb77fd8debf9753be16` (`main`)
> - 최근 커밋: `4647f94` Refine life period labels
> - 커밋 일시: `2026-06-26T00:58:17+09:00`
> - 워킹트리: `dirty (docs update)`
> - 문서 갱신: `2026-06-26 01:01:50 +0900`
<!-- COMMIT_STATUS END -->

# 유즈케이스

마지막 갱신일: 2026-06-20

우선순위: P0는 핵심 루프, P1은 재방문/복구, P2는 확장 기능이다.

### UC-01. 게스트로 시작하고 프로필 입력하기
- Goal: 사용자가 가입 부담 없이 첫 리포트 생성에 필요한 사주 정보를 저장한다.
- Actor: 신규 사용자
- Preconditions: Supabase anonymous sign-in이 활성화되어 있다.
- Trigger: 사용자가 랜딩에서 `게스트로 시작하기`를 누른다.

Basic Flow:
1. 시스템이 익명 Supabase 세션을 만든다.
2. 사용자를 `/onboarding`으로 보낸다.
3. 사용자가 이름, 생년월일, 달력, 출생 시각 또는 시각 모름, 성별, 선택 메모를 입력한다.
4. 시스템이 `user:{userId}:profile`에 저장한다.
5. 사용자를 대시보드로 보낸다.

Alternate Flow:
- A. 이미 세션이 있으면 기존 세션으로 대시보드 또는 원래 경로에 진입한다.
- B. 출생 시각을 입력하지 않고 `시각 모름`도 선택하지 않으면 저장을 막고 이유를 보여준다.

Postconditions:
- 사용자 프로필이 저장되고 보호 경로에 접근할 수 있다.

Implementation Status:
- 현재 구현

What the user must understand:
- 가입 없이 시작할 수 있지만 기기를 바꾸면 익명 세션이 끊길 수 있다.
- 출생 시각을 모르면 일부 풀이 정밀도가 낮아진다.

What the system must explain:
- 어떤 정보가 리포트에 쓰이는지.
- 시각 모름 선택 시 시주가 생략될 수 있다는 점.

Where to reduce choice fatigue:
- 기본 달력은 양력, 기본 성별은 여성으로 둔다.

Defaults / recommendations to show:
- 출생 시각을 모르겠다면 `시각 모름`을 선택하고 먼저 진행하도록 안내한다.

### UC-02. 개인 사주 리포트 생성하기
- Goal: 사용자가 결정론적으로 계산된 사주 차트와 AI 해석을 얻는다.
- Actor: 프로필을 입력한 사용자
- Preconditions: `user:{userId}:profile`이 존재하고 Gemini API 설정이 유효하다.
- Trigger: 사용자가 `/saju`에서 `AI 풀이 생성하기`를 누른다.

Basic Flow:
1. 시스템이 `lunar-javascript`로 사주 4기둥, 일간, 오행, 대운, 음양/한열 좌표를 계산한다.
2. 시스템이 `personal-saju` 프롬프트를 렌더한다.
3. Gemini가 JSON schema 기반 리포트를 생성한다.
4. 시스템이 리포트, 모델 정보, 사주 meta, 코칭 액션 후보를 `user:{userId}:report:personal`에 저장한다.
5. 시스템이 상담 근거 요약을 갱신한다.
6. 사용자는 리포트, 시각화, 액션 등록, 공유 버튼을 본다.

Alternate Flow:
- A. 저장된 리포트가 있으면 API 호출 없이 저장본을 먼저 보여준다.
- B. AI 호출 실패 시 에러를 보여주고 기존 저장본은 유지한다.
- C. 사용자가 다시 생성하면 같은 종류의 이전 리포트는 덮어쓴다.
- D. 사용자가 `/saju`의 프로필 수정을 누르면 기존 사주 정보가 채워진 `/onboarding` 폼으로 이동하고, 저장 후 `/saju`로 돌아온다.

Postconditions:
- 개인 사주 최신 리포트 1건이 저장된다.

Implementation Status:
- 현재 구현

What the user must understand:
- LLM이 사주를 계산하는 것이 아니라 계산된 표를 해석한다.
- 재생성하면 이전 리포트 히스토리는 남지 않는다.

What the system must explain:
- 리포트가 생성된 시각과 저장본 여부.
- 공유 링크가 누구나 열 수 있는 공개 스냅샷이라는 점.

Where to reduce choice fatigue:
- 사용자가 모델/프롬프트를 고르지 않게 기본 프롬프트와 모델을 사용한다.

Defaults / recommendations to show:
- 첫 사용자는 개인 사주 또는 약식 기질 검사 중 하나를 먼저 하도록 대시보드에서 추천한다.

### UC-03. 기질 검사와 리포트 보기
- Goal: 사용자가 사주와 별개로 자신의 기질 7차원과 유연성 추정값을 이해한다.
- Actor: 프로필을 입력한 사용자
- Preconditions: 사용자 세션이 있고 TCI 문항이 로드된다.
- Trigger: 사용자가 `/tci`에서 약식 또는 정식 검사를 선택한다.

Basic Flow:
1. 시스템이 약식 35문항 또는 정식 140문항을 제시한다.
2. 사용자의 응답을 자동 저장한다.
3. 모든 문항 완료 후 사용자를 `/tci/report`로 보낸다.
4. 시스템이 점수를 계산하고 `tci-report` 프롬프트를 렌더한다.
5. Gemini가 기질 리포트와 `FLEX=NN`, `ACTIONS=[...]` 트레일러를 출력한다.
6. 시스템이 트레일러를 제거하고 유연성/액션을 별도 저장한다.

Alternate Flow:
- A. 정식 140문항 배열이 비어 있으면 운영팀 입력 필요 안내를 보여주고 약식 검사로 유도한다.
- B. 중간 이탈 후 재진입하면 기존 답변 위치에서 이어갈 수 있다.

Postconditions:
- 선택 variant의 응답과 최신 기질 리포트가 저장된다.

Implementation Status:
- 부분 구현

What the user must understand:
- 약식 검사는 자체 문항 기반의 프로토타입이다.
- 유연성은 정식 TCI 점수가 아니라 AI가 7차원 조합에서 추정한 축이다.

What the system must explain:
- 약식과 정식의 차이.
- 정식 검사가 준비되지 않았을 때의 이유.

Where to reduce choice fatigue:
- 기본 추천은 약식 35문항이다.

Defaults / recommendations to show:
- 처음 사용자는 약식 검사로 3~5분 안에 완료하도록 추천한다.

### UC-04. 사주 x 기질 융합 리포트 생성하기
- Goal: 사용자가 사주 해석과 기질 점수의 공명/긴장을 하나의 자기 이해로 통합한다.
- Actor: 프로필과 TCI 응답을 가진 사용자
- Preconditions: 프로필과 TCI 응답이 저장되어 있다.
- Trigger: 사용자가 대시보드 또는 `/fusion`에서 융합 리포트를 연다.

Basic Flow:
1. 시스템이 저장된 프로필과 최신 TCI 응답을 읽는다.
2. 시스템이 사주 차트와 기질 점수를 함께 프롬프트에 주입한다.
3. Gemini가 융합 리포트, 유연성, 코칭 액션 후보를 생성한다.
4. 시스템이 `user:{userId}:report:fusion`에 저장하고 상담 근거 요약을 갱신한다.
5. 사용자는 융합 시각화, 리포트, 액션 등록, 공유를 본다.

Alternate Flow:
- A. TCI가 없으면 기질 검사로 유도한다.
- B. 프로필이 없으면 온보딩으로 유도한다.

Postconditions:
- 융합 최신 리포트가 저장된다.

Implementation Status:
- 현재 구현

What the user must understand:
- 사주와 기질이 다르게 보일 수 있고, 그 차이는 결함이 아니라 융합 해석의 재료다.

What the system must explain:
- 어떤 데이터가 융합 근거로 쓰였는지.
- 기질 검사 완료가 왜 필요한지.

Where to reduce choice fatigue:
- 사용자가 근거 조합을 선택하지 않게 프로필 + 최신 TCI를 자동 사용한다.

Defaults / recommendations to show:
- TCI 완료 후 융합 리포트를 다음 단계로 추천한다.

### UC-05. 가족 사주 리포트 만들기
- Goal: 사용자가 본인과 가족 구성원의 관계 흐름을 이해한다.
- Actor: 프로필을 입력한 사용자
- Preconditions: 본인 프로필이 있고, 가족 구성원 1명 이상을 입력할 수 있다.
- Trigger: 사용자가 `/family`에서 가족 구성원을 추가하고 리포트 생성을 누른다.

Basic Flow:
1. 사용자가 가족 이름, 관계, 생년월일, 출생 시각/시각 모름, 달력, 성별, 직업을 입력한다.
2. 시스템이 가족 구성원을 `user:{userId}:family`에 저장한다.
3. 시스템이 본인과 구성원의 사주를 계산한다.
4. 시스템이 상단에 리포트 기준 정보, 가족 한 문장, 현재 제노그램을 보여준다.
5. Gemini가 가족 사주 리포트의 하단 6개 섹션(기본성향, 가족분위기, 가족건강운, 가족금전운, 가족대운 별 비교, 올해 실행전략)을 JSON schema로 생성한다.
6. 시스템이 `user:{userId}:report:family`에 저장하고 상담 근거 요약을 갱신한다.

Alternate Flow:
- A. 구성원이 없으면 리포트 생성 버튼을 비활성화한다.
- B. 구성원 정보를 수정/삭제하면 가족 목록과 시각화가 갱신된다.

Postconditions:
- 가족 구성원 목록과 최신 가족 리포트가 저장된다.
- 가족 리포트 공유 스냅샷에는 리포트 기준 정보/제노그램 렌더에 필요한 구성원 사주 데이터가 포함된다.

Implementation Status:
- 현재 구현

What the user must understand:
- 가족 구성원의 출생 정보도 민감 데이터다.
- 가족 리포트는 상대를 비난하는 용도가 아니라 관계 이해와 대화 준비용이다.

What the system must explain:
- 공유 전 가족 데이터가 공개 스냅샷에 포함될 수 있다는 점.

Where to reduce choice fatigue:
- 구성원 추가 폼은 기본 1명부터 시작하고, 목록이 있으면 폼을 접어둔다.

Defaults / recommendations to show:
- 첫 구성원은 가장 고민이 큰 관계 1명부터 추가하도록 안내한다.

### UC-06. AI 상담으로 현재 고민 묻기
- Goal: 사용자가 저장된 리포트 맥락을 바탕으로 현재 고민에 대한 맞춤 답변을 받는다.
- Actor: 프로필을 입력한 사용자
- Preconditions: 프로필이 저장되어 있고, 개인/기질/융합/가족 중 리포트가 1개 이상 저장되어 있다.
- Trigger: 사용자가 `/consult`에서 질문을 입력하고 상담 요청을 누른다.

Basic Flow:
1. 시스템이 질문을 최대 1000자로 검증한다.
2. 시스템이 저장된 리포트 요약을 확인하고, 없거나 낡은 요약은 백필한다.
3. 저장된 리포트가 1개 이상 있을 때만 Gemini가 단건 상담 답변과 액션 후보를 생성한다.
4. 시스템이 `user:{userId}:consults` 맨 앞에 저장하고 최근 50개만 유지한다.
5. 사용자는 답변, 근거 라벨, 액션 등록, 히스토리를 본다.

Alternate Flow:
- A. 프로필이 없으면 온보딩 링크를 보여준다.
- B. 질문이 비어 있거나 너무 길면 생성하지 않는다.
- C. 특정 상담 id로 진입하면 저장된 단건 상담을 불러온다.
- D. 저장된 리포트가 하나도 없으면 상담 입력 대신 리포트 생성 안내와 개인 사주/대시보드 링크를 보여준다.

Postconditions:
- 상담 기록이 저장되고 히스토리에서 다시 열 수 있다.

Implementation Status:
- 현재 구현

What the user must understand:
- 상담은 의료/법률/투자 판단이 아니라 자기 이해와 실행 방향 보조다.
- 저장된 리포트가 많을수록 상담 근거가 풍부해진다.

What the system must explain:
- 어떤 리포트가 근거로 쓰였는지.
- 리포트가 없을 때는 상담을 시작하기 전에 리포트를 먼저 생성해야 한다는 점.

Where to reduce choice fatigue:
- 근거 리포트 선택 UI를 두지 않고 존재하는 근거를 모두 합쳐 사용한다.

Defaults / recommendations to show:
- 리포트가 있는 빈 상태에서는 "요즘 가장 마음에 걸리는 일"을 한 문단으로 쓰게 안내한다.
- 리포트가 없는 빈 상태에서는 개인 사주 리포트를 먼저 만들도록 안내한다.

### UC-07. 코칭 액션 플랜 관리하기
- Goal: 사용자가 리포트/상담에서 얻은 행동 제안을 실행 가능한 목록으로 관리한다.
- Actor: 리포트 또는 상담을 본 사용자
- Preconditions: 사용자 세션이 있다.
- Trigger: 사용자가 액션 후보를 등록하거나 `/coaching`에서 직접 추가한다.

Basic Flow:
1. 시스템이 리포트/상담의 액션 후보를 보여준다.
2. 사용자가 일부 또는 전체를 코칭 플랜에 등록한다.
3. 시스템이 `user:{userId}:actions`에 추가하되 같은 source + title은 중복 등록하지 않는다.
4. 사용자가 액션을 완료 처리하거나 삭제한다.
5. 시스템이 완료율과 그룹을 갱신한다.

Alternate Flow:
- A. 사용자가 직접 액션을 추가하면 source는 `manual`로 저장한다.
- B. 등록할 액션이 없으면 등록 UI를 렌더하지 않는다.
- C. 한 번에 20개 초과 등록은 API에서 거절한다.

Postconditions:
- 최신 200개 액션이 유지되고 완료 상태가 저장된다.

Implementation Status:
- 현재 구현

What the user must understand:
- 액션은 리포트 본문과 별개로 실행 추적 대상이다.

What the system must explain:
- 오늘/이번 주/이번 달 그룹의 의미.
- 직접 추가와 리포트 출처 액션의 차이.

Where to reduce choice fatigue:
- 시점 선택은 오늘, 이번 주, 이번 달, 기타로 제한한다.

Defaults / recommendations to show:
- 리포트마다 전체 등록보다 "바로 할 액션만 골라 등록"을 기본 메시지로 둔다.

### UC-08. 리포트 공유하기
- Goal: 사용자가 생성된 리포트를 외부 사람에게 보여줄 수 있는 공개 링크를 만든다.
- Actor: 저장된 리포트를 가진 사용자
- Preconditions: 공유할 리포트가 저장되어 있다.
- Trigger: 사용자가 리포트 화면에서 `공유하기`를 누른다.

Basic Flow:
1. 시스템이 리포트 종류를 검증한다.
2. 시스템이 저장된 리포트와 시각화에 필요한 meta를 읽는다.
3. 시스템이 `share:{token}` 공개 스냅샷을 만들거나 갱신한다.
4. 사용자에게 링크 복사, 네이티브 공유, 카카오 공유 옵션을 보여준다.
5. 비로그인 사용자는 `/share/{token}`에서 스냅샷을 본다.

Alternate Flow:
- A. 카카오 키가 없으면 카카오 버튼을 숨긴다.
- B. 클립보드 API가 막히면 주소 선택 후 수동 복사를 안내한다.
- C. 리포트 meta가 손상됐으면 재생성을 요구한다.

Postconditions:
- 같은 사용자/리포트 종류의 공유 링크는 같은 토큰을 재사용하고 최신 스냅샷으로 갱신된다.

Implementation Status:
- 현재 구현

What the user must understand:
- 링크를 아는 사람은 로그인 없이 리포트를 볼 수 있다.
- 현재 revoke UI는 없다.

What the system must explain:
- 공유 모달에서 공개 링크임을 명확히 고지한다.

Where to reduce choice fatigue:
- 공유 방식은 링크 복사를 기본으로 두고 카카오/더보기를 보조로 둔다.

Defaults / recommendations to show:
- 민감한 가족 리포트는 공유 전 한 번 더 주의 문구를 보여주는 것이 권장된다.
