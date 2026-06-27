// 가족 상담 프롬프트 품질 점검 — AI 호출 0.
//
// 목적:
// - 여러 합성 페르소나의 가족 상담 질문으로 consult 프롬프트를 렌더한다.
// - 운영 모델 출력이 아니라 "프롬프트가 90점대 가족 상담을 강제하는 구조인가"를
//   정적 루브릭으로 채점한다.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getNowVars } from "../../lib/datetime";
import { DEFAULT_PROMPTS } from "../../lib/prompts/defaults";
import { renderTemplate } from "../../lib/prompts/render";
import type { SajuProfile } from "../../lib/store/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "out", "family-consult");

type FamilyConsultCase = {
  id: string;
  desc: string;
  profile: SajuProfile;
  basisLabel: string;
  contextBlock: string;
  question: string;
};

type RubricItem = {
  id: string;
  label: string;
  points: number;
  pass: (template: string) => boolean;
};

const CASES: FamilyConsultCase[] = [
  {
    id: "fc01-adult-daughter",
    desc: "29세 직장인 딸, 어머니와 동거하며 독립/이직 대화가 계속 터지는 케이스",
    profile: { name: "지유", birthDate: "1996-05-14", birthTime: "07:30", gender: "female", calendar: "solar", occupation: "마케터" },
    basisLabel: "개인 사주·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 지유는 가족 안에서 속도가 빠르고 먼저 결론을 내리는 쪽으로 요약됨.
• 어머니 정순은 안정과 확인을 중시해 말이 길어지고, 지유는 그걸 간섭으로 받아들이기 쉬움.
• 가족 단톡방과 식탁 대화에서 독립·이직 주제가 나오면 감정이 빨리 올라오는 패턴.
• 오늘/이번 주/이번 달 액션은 먼저 듣기, 독립 조건을 숫자로 정리하기, 대화 시간을 짧게 잡기.`,
    question: "엄마랑 이직 얘기만 하면 싸움이 돼. 독립 얘기까지 같이 꺼내려면 어떻게 말해야 해?",
  },
  {
    id: "fc02-spouse-inlaws",
    desc: "36세 기혼 여성, 배우자가 시가와 자기 사이에서 회피한다고 느끼는 케이스",
    profile: { name: "서연", birthDate: "1990-02-23", birthTime: "21:10", gender: "female", calendar: "solar", occupation: "간호사", relationshipStatus: "married" },
    basisLabel: "융합·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 서연은 감정 신호를 빨리 읽고 관계의 온도를 조절하려는 쪽.
• 배우자 민재는 갈등이 커지는 순간 침묵으로 시간을 벌려는 패턴이 강함.
• 시가 방문, 명절 동선, 연락 빈도에서 서연은 혼자 방어하는 느낌을 받기 쉬움.
• 배우자에게는 비난보다 역할 요청 문장과 구체 일정 합의가 더 잘 들어감.`,
    question: "남편이 시가 얘기만 나오면 가만히 있어. 내가 예민한 사람처럼 되지 않으려면 뭐라고 해야 해?",
  },
  {
    id: "fc03-caregiving-son",
    desc: "42세 장남, 부모 돌봄과 형제 생활비 분담을 떠안는 케이스",
    profile: { name: "준호", birthDate: "1984-09-01", birthTime: "10:00", gender: "male", calendar: "solar", occupation: "팀장", childrenStatus: "yes" },
    basisLabel: "개인 사주·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 준호는 가족 안에서 실무자와 결정자 역할을 동시에 떠맡는 흐름.
• 여동생 수진은 감정 부담이 올라오면 답장을 늦추고, 준호는 그 침묵을 책임 회피로 읽기 쉬움.
• 병원 예약, 간병 일정, 생활비 송금 같은 장면에서 역할표가 없으면 갈등이 반복됨.
• 돈과 돌봄은 감정 호소보다 항목표·날짜·최소 기준으로 꺼낼수록 덜 번짐.`,
    question: "부모님 병원 예약이랑 생활비를 거의 내가 하고 있어. 형제랑 어떻게 나눠야 싸움이 덜 날까?",
  },
  {
    id: "fc04-teen-parent",
    desc: "45세 엄마, 중학생 자녀와 공부/진로 대화가 막히는 케이스",
    profile: { name: "미라", birthDate: "1981-12-19", birthTime: "06:40", gender: "female", calendar: "solar", occupation: "자영업", childrenStatus: "yes" },
    basisLabel: "기질·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 미라는 불안해지면 먼저 계획표를 잡아 안정시키려는 쪽.
• 딸 유나는 자기 속도를 침범당한다고 느끼면 문을 닫거나 짧게 받아치는 패턴.
• 자녀 진로, 학원 선택, 스마트폰 사용 시간에서 대화가 지시처럼 들리기 쉬움.
• 질문형 확인, 선택지 두 개, 대화 시간 제한이 충돌을 줄이는 쪽으로 작동함.`,
    question: "중학생 딸이 공부 얘기만 하면 방문을 닫아. 진로 얘기를 어떻게 시작해야 해?",
  },
  {
    id: "fc05-newlywed-origin",
    desc: "33세 신혼 남성, 원가족 방식과 배우자 기준 사이에서 흔들리는 케이스",
    profile: { name: "도윤", birthDate: "1993-08-08", birthTime: "23:20", gender: "male", calendar: "solar", occupation: "개발자", relationshipStatus: "married" },
    basisLabel: "융합·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 도윤은 익숙한 집안 규칙을 유지하려는 마음과 새 가족을 세워야 하는 책임 사이에서 흔들림.
• 배우자 하영은 불분명한 약속을 불안해하고, 도윤의 부모님은 자주 보는 것을 애정으로 느끼는 편.
• 주말 방문, 명절 일정, 부모님 전화 응대에서 도윤이 중간 설명을 미루면 배우자가 혼자 남겨진다고 느낌.
• 부모에게는 통보보다 감사+새 기준 제시, 배우자에게는 먼저 편을 확인하는 말이 필요함.`,
    question: "부모님은 자주 오라 하고 아내는 부담스러워해. 내가 중간에서 어떤 말을 해야 해?",
  },
  {
    id: "fc06-inheritance-money",
    desc: "51세 여성, 부모 재산/상속 이야기를 형제와 꺼내야 하는 케이스",
    profile: { name: "은정", birthDate: "1975-04-05", birthTime: "14:20", gender: "female", calendar: "solar", occupation: "공인중개사" },
    basisLabel: "개인 사주·가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 은정은 불편한 주제라도 현실 문제가 보이면 먼저 꺼내야 마음이 놓이는 편.
• 오빠 성민은 돈 얘기를 정서적 불신으로 받아들이기 쉬워 방어가 빨리 올라옴.
• 상속, 병원비, 부모님 집 관리비는 미루면 더 큰 서운함으로 번질 가능성이 큼.
• 가족 회의는 감정 확인보다 안건·자료·결정 보류 기간을 분리해야 안전함.`,
    question: "부모님 집이랑 상속 얘기를 오빠한테 꺼내야 하는데 돈 밝히는 사람처럼 보일까 봐 걱정돼.",
  },
  {
    id: "fc07-coparenting",
    desc: "39세 이혼 후 공동양육, 전 배우자와 일정/비용 합의가 어려운 케이스",
    profile: { name: "하나", birthDate: "1987-01-29", birthTime: "09:15", gender: "female", calendar: "solar", occupation: "강사", relationshipStatus: "divorced_separated", childrenStatus: "yes" },
    basisLabel: "가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 하나는 아이 일 앞에서 책임감이 강해지고, 전 배우자의 늦은 답장을 무시로 읽기 쉬움.
• 전 배우자 태오는 압박을 느끼면 설명보다 회피로 빠지는 흐름.
• 학교 일정, 병원비, 주말 양육 시간표는 말로 합의하면 매번 기억이 달라질 수 있음.
• 아이 앞에서는 상대 평가를 빼고 일정·비용·안전 기준만 남기는 방식이 중요함.`,
    question: "전 남편이 아이 일정 답장을 늦게 해. 싸우지 않고 공동양육 얘기를 하려면 어떻게 보내야 해?",
  },
  {
    id: "fc08-parent-distance",
    desc: "61세 부모, 성인 자녀와 연락 빈도/거리감 때문에 섭섭한 케이스",
    profile: { name: "영숙", birthDate: "1965-10-11", birthTime: "05:50", gender: "female", calendar: "solar", occupation: "주부", childrenStatus: "yes" },
    basisLabel: "가족 사주 리포트 근거",
    contextBlock: `[가족 사주 리포트 요약]
• 영숙은 챙김을 애정으로 표현하고, 성인 아들 현우는 자율을 존중받을 때 마음을 여는 쪽.
• 연락 빈도, 방문 횟수, 건강 걱정 문자가 서로 다른 언어로 읽힘.
• 영숙이 조언을 길게 하면 현우는 평가받는 느낌으로 물러나기 쉽고, 영숙은 그 거리를 서운함으로 느낌.
• 부담 없는 안부, 답장 압박 없는 요청, 조언 전 허락 구하기가 관계 회복의 첫 단추.`,
    question: "아들이 연락을 잘 안 해. 서운하다고 말하면 더 멀어질까 봐 어떻게 꺼내야 할지 모르겠어.",
  },
];

function includesAll(text: string, patterns: string[]): boolean {
  return patterns.every((p) => text.includes(p));
}

function countIncludes(text: string, patterns: string[]): number {
  return patterns.filter((p) => text.includes(p)).length;
}

const RUBRIC: RubricItem[] = [
  {
    id: "family-mode",
    label: "가족상담 모드 트리거가 명시되어 있다",
    points: 8,
    pass: (t) => includesAll(t, ["가족 상담 모드", "기준 컨텍스트", "질문에"]),
  },
  {
    id: "utility-focus",
    label: "궁합 설명보다 말투·거리·합의 방식에 초점이 있다",
    points: 8,
    pass: (t) => includesAll(t, ["궁합 설명", "말투·거리·합의 방식"]),
  },
  {
    id: "family-role",
    label: "가족 안 반복 역할을 짚도록 강제한다",
    points: 10,
    pass: (t) => includesAll(t, ["반복하는 역할", "중재자", "감정받이", "실무자"]),
  },
  {
    id: "person-specific",
    label: "상대별로 말이 안 통하는 이유와 직접 언급을 요구한다",
    points: 10,
    pass: (t) => includesAll(t, ["상대별로 말이 안 통하는 이유", "직접 언급", "존중"]),
  },
  {
    id: "scene-density",
    label: "가족 실제 장면이 충분히 다양하다",
    points: 12,
    pass: (t) =>
      countIncludes(t, ["가족 단톡방", "명절", "생활비", "병원", "돌봄", "자녀 진로", "집안일", "연락 빈도", "원가족"]) >= 7,
  },
  {
    id: "simulation",
    label: "상대 반응 시뮬레이션 2개 이상을 요구한다",
    points: 12,
    pass: (t) => includesAll(t, ["상대 반응 시뮬레이션", "최소 2개", "시나리오 ②는 선택이 아니라 필수"]),
  },
  {
    id: "copyable-dialogue",
    label: "복사 가능한 말할 문장과 금지 문장을 요구한다",
    points: 12,
    pass: (t) => includesAll(t, ["그대로 복사해 쓸 수 있는", "말할 문장", "금지 문장"]),
  },
  {
    id: "boundary",
    label: "내가 할 일과 상대 몫의 책임선을 분리한다",
    points: 10,
    pass: (t) => includesAll(t, ["책임선", "네가 할 일", "상대 몫"]),
  },
  {
    id: "actions",
    label: "오늘·이번 주·이번 달 가족 액션 역할이 분명하다",
    points: 10,
    pass: (t) => includesAll(t, ["ACTIONS 3개", "오늘 연락", "이번 주 대화", "이번 달 구조 조정"]),
  },
  {
    id: "safety",
    label: "가족 구성원 비난·조롱·낙인 금지와 위생 기준이 있다",
    points: 8,
    pass: (t) => includesAll(t, ["비난", "조롱", "운명 단정", "평가·낙인 금지"]),
  },
];

function scoreTemplate(template: string) {
  const rows = RUBRIC.map((item) => ({
    ...item,
    passed: item.pass(template),
  }));
  const score = rows.reduce((sum, row) => sum + (row.passed ? row.points : 0), 0);
  return { score, rows };
}

function renderCase(c: FamilyConsultCase, nowVars: ReturnType<typeof getNowVars>): string {
  return renderTemplate(DEFAULT_PROMPTS.consult.template, {
    name: c.profile.name,
    birthDate: c.profile.birthDate,
    birthTime: c.profile.birthTime || "(시각 모름)",
    gender: c.profile.gender === "male" ? "남성" : "여성",
    calendar: c.profile.calendar === "lunar" ? "음력" : "양력",
    profileContext: [
      `직업: ${c.profile.occupation ?? "(미입력)"}`,
      `관계 상태: ${c.profile.relationshipStatus ?? "(미입력)"}`,
      `자녀 여부: ${c.profile.childrenStatus ?? "(미입력)"}`,
      `현재 관심/고민: ${c.profile.currentConcern ?? c.question}`,
    ].join("\n"),
    basisLabel: c.basisLabel,
    contextBlock: c.contextBlock,
    question: c.question,
    ...nowVars,
  });
}

function main() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const nowVars = getNowVars();
  const template = DEFAULT_PROMPTS.consult.template;
  const result = scoreTemplate(template);

  const rendered = CASES.map((c) => {
    const prompt = renderCase(c, nowVars);
    writeFileSync(join(OUT, `${c.id}.txt`), prompt, "utf8");
    return { ...c, chars: prompt.length };
  });

  const lines = [
    "# 가족 상담 프롬프트 점검",
    "",
    `기준일: ${nowVars.today}`,
    `프롬프트 버전: ${DEFAULT_PROMPTS.consult.version}`,
    `총점: ${result.score}/100`,
    result.score >= 90 ? "판정: PASS (90점 이상)" : "판정: FAIL (90점 미만)",
    "",
    "## 루브릭",
    "",
    "| 항목 | 배점 | 결과 |",
    "|---|---:|---|",
    ...result.rows.map((r) => `| ${r.label} | ${r.points} | ${r.passed ? "PASS" : "FAIL"} |`),
    "",
    "## 합성 가족 상담 케이스",
    "",
    "| ID | 페르소나 | 질문 | 렌더 글자수 |",
    "|---|---|---|---:|",
    ...rendered.map((c) => `| ${c.id} | ${c.desc} | ${c.question} | ${c.chars} |`),
    "",
    "## 해석",
    "",
    "- 이 점수는 운영 모델 출력 품질 점수가 아니라, 프롬프트가 가족 상담 요구사항을 얼마나 명시적으로 강제하는지 보는 정적 점수다.",
    "- 실제 운영 품질은 같은 케이스 중 1~2개를 Gemini로 생성해 리포트 검증 6축으로 교차 확인해야 한다.",
  ];
  writeFileSync(join(OUT, "score.md"), `${lines.join("\n")}\n`, "utf8");

  console.log(`가족 상담 프롬프트 점수: ${result.score}/100`);
  for (const row of result.rows) {
    console.log(`${row.passed ? "PASS" : "FAIL"} ${row.points}점 · ${row.label}`);
  }
  console.log(`출력: ${OUT}`);
}

main();
