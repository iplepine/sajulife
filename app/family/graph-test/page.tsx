import AdminOnly from "@/components/AdminOnly";
import FamilyCircle from "@/components/FamilyCircle";
import { calculateSaju } from "@/lib/saju/calculator";
import { buildFamilyCircleMembers } from "@/lib/saju/familyCircle";
import type { SajuProfile } from "@/lib/store/types";

type SamplePerson = {
  id: string;
  relation: string;
  profile: SajuProfile;
};

const SAMPLES: SamplePerson[] = [
  {
    id: "self",
    relation: "나",
    profile: {
      name: "박정호",
      birthDate: "1987-10-02",
      birthTime: "09:30",
      gender: "male",
      calendar: "solar",
    },
  },
  {
    id: "spouse",
    relation: "배우자",
    profile: {
      name: "서지민",
      birthDate: "1989-04-12",
      birthTime: "11:10",
      gender: "female",
      calendar: "solar",
    },
  },
  {
    id: "son",
    relation: "아들",
    profile: {
      name: "박재윤",
      birthDate: "2022-08-18",
      birthTime: "15:00",
      gender: "male",
      calendar: "solar",
    },
  },
  {
    id: "mother",
    relation: "어머니",
    profile: {
      name: "김영숙",
      birthDate: "1962-01-22",
      birthTime: "06:40",
      gender: "female",
      calendar: "solar",
    },
  },
  {
    id: "father",
    relation: "아버지",
    profile: {
      name: "박성민",
      birthDate: "1959-11-09",
      birthTime: "20:15",
      gender: "male",
      calendar: "solar",
    },
  },
  {
    id: "sister",
    relation: "누나",
    profile: {
      name: "박유나",
      birthDate: "1984-06-27",
      birthTime: "13:25",
      gender: "female",
      calendar: "solar",
    },
  },
];

const CASE_COUNTS = [2, 3, 4, 5, 6] as const;

export default function FamilyGraphTestPage() {
  const currentYear = new Date().getFullYear();

  return (
    <AdminOnly>
      <main className="container container--wide graph-test-page">
        <div className="graph-test-head">
          <p className="h-sec">가족 오행 흐름 그래프 테스트</p>
          <h1>2명부터 6명까지 배치 확인</h1>
          <p className="muted">
            같은 FamilyCircle 컴포넌트를 샘플 구성원 수만 바꿔 렌더링한다. 화살표 방향, 선 겹침, 노드 위치를 한 번에 비교한다.
          </p>
        </div>

        <div className="graph-test-list">
          {CASE_COUNTS.map((count) => {
            const people = SAMPLES.slice(0, count);
            const members = buildMembers(people);
            return (
              <section key={count} className="graph-test-case">
                <div className="graph-test-case-head">
                  <div>
                    <p className="h-sec">{count}명 케이스</p>
                    <h2>{people.map((p) => p.profile.name).join(" · ")}</h2>
                  </div>
                  <p className="graph-test-meta">
                    {people.map((p) => `${p.relation} ${p.profile.birthDate}`).join(" / ")}
                  </p>
                </div>
                <FamilyCircle members={members} currentYear={currentYear} />
              </section>
            );
          })}
        </div>
      </main>
    </AdminOnly>
  );
}

function buildMembers(people: SamplePerson[]) {
  const [self, ...family] = people;
  if (!self) return [];

  return buildFamilyCircleMembers(
    {
      name: self.profile.name,
      saju: calculateSaju(self.profile),
    },
    family.map((p) => ({
      id: p.id,
      name: p.profile.name,
      relation: p.relation,
      saju: calculateSaju(p.profile),
    })),
  );
}
