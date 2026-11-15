import Image from "next/image";
import styles from "./CharacterGuide.module.css";

type Character = "sister" | "brother";
type Guide = { characters: readonly Character[]; role: string; copy: string };

const SISTER = ["sister"] as const;
const BROTHER = ["brother"] as const;
const BOTH = ["sister", "brother"] as const;

const GUIDES: ReadonlyArray<{ paths: readonly string[]; guide: Guide }> = [
  {
    paths: ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/update-password"],
    guide: { characters: BOTH, role: "계정으로 이어보기", copy: "풀이를 이어볼 계정을 확인해줘. 비밀번호는 다른 사람에게 알려주지 마." },
  },
  {
    paths: ["/fusion/start"],
    guide: { characters: BOTH, role: "함께 읽을 사람", copy: "누구의 풀이를 볼지 골라줘. 등록한 사람은 이어서 볼 수 있어." },
  },
  {
    paths: ["/onboarding"],
    guide: { characters: SISTER, role: "태어난 정보", copy: "아는 정보만 정확히 적어줘. 태어난 시각을 모르면 모름으로 골라도 돼." },
  },
  {
    paths: ["/tci/report"],
    guide: { characters: BROTHER, role: "기질 풀이", copy: "네가 고른 응답에서 드러난 반응 경향을 같이 살펴볼게." },
  },
  {
    paths: ["/tci"],
    guide: { characters: BROTHER, role: "기질 검사", copy: "정답 찾지 말고, 평소 네 반응에 가까운 쪽을 골라줘." },
  },
  {
    paths: ["/saju/manseryeok"],
    guide: { characters: SISTER, role: "사주 계산 자료", copy: "풀이의 바탕이 되는 명식이야. 계산된 정보를 차근차근 확인해봐." },
  },
  {
    paths: ["/saju/yongsin", "/saju/yongsin-check", "/explore/yongsin"],
    guide: { characters: SISTER, role: "용신 풀이", copy: "사주에서 균형을 돕는 기운이 뭘 뜻하는지, 생활 언어로 풀어볼게." },
  },
  {
    paths: ["/saju/timing"],
    guide: { characters: SISTER, role: "삶의 흐름", copy: "시기별 흐름을 살펴보자. 실제 선택은 네 상황과 함께 판단해봐." },
  },
  {
    paths: ["/saju", "/explore/personal"],
    guide: { characters: SISTER, role: "사주 풀이", copy: "태어난 정보를 바탕으로, 타고난 특징과 삶의 흐름을 살펴볼게." },
  },
  {
    paths: ["/explore/temperament"],
    guide: { characters: BROTHER, role: "기질을 읽는 방법", copy: "평소 반응을 응답으로 살펴보는 거야. 사람 전체를 단정하는 검사는 아니야." },
  },
  {
    paths: ["/fusion", "/explore/fusion"],
    guide: { characters: BOTH, role: "사주 + 기질 통합 풀이", copy: "사주와 기질을 함께 읽고, 네가 선택할 때 참고할 기준을 정리해볼게." },
  },
  {
    paths: ["/consult", "/explore/consult"],
    guide: { characters: SISTER, role: "용신상담", copy: "지금 고민을 적어줘. 사주에서 읽은 용신 흐름과 함께 살펴볼게." },
  },
  {
    paths: ["/coaching"],
    guide: { characters: BOTH, role: "실천할 한 가지", copy: "한꺼번에 다 바꾸려 하지 말고, 지금 해볼 한 가지부터 정리해봐." },
  },
  {
    paths: ["/family", "/explore/family"],
    guide: { characters: SISTER, role: "가족 사주", copy: "가족의 사주를 나란히 살펴볼게. 서로 다른 점을 이해하는 참고로 읽어줘." },
  },
  {
    paths: ["/compat", "/explore/compat"],
    guide: { characters: SISTER, role: "두 사람의 궁합", copy: "두 사람의 사주를 함께 읽어볼게. 상대 마음까지 단정하진 않을게." },
  },
  {
    paths: ["/materials", "/history"],
    guide: { characters: BOTH, role: "내 풀이", copy: "저장된 풀이와 진행 중인 내용을 여기서 다시 찾아봐." },
  },
  {
    paths: ["/account"],
    guide: { characters: BOTH, role: "나의 계정", copy: "계정과 등록한 정보를 확인하고, 필요한 부분을 정리해봐." },
  },
  {
    paths: ["/notifications"],
    guide: { characters: BOTH, role: "알림", copy: "풀이가 준비됐는지, 새로 확인할 내용이 있는지 살펴봐." },
  },
  {
    paths: ["/checkout", "/tickets"],
    guide: { characters: BOTH, role: "이용 안내", copy: "포함된 풀이와 이용 조건을 확인하고 시작해줘." },
  },
];

const CHARACTER_NAMES: Record<Character, string> = { sister: "사주언니", brother: "기질오빠" };
const CHARACTER_ALTS: Record<Character, string> = {
  sister: "정면을 바라보는 코발트 옷의 사주언니",
  brother: "정면을 바라보는 테라코타 옷의 기질오빠",
};

function matchesPath(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** Route context only: this guide never claims to have read a person's results. */
export default function CharacterGuide({ pathname }: { pathname: string }) {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  if (path === "/dashboard" || path.split("/").includes("debug") || path.endsWith("/graph-test")) return null;
  const guide = GUIDES.find(({ paths }) => paths.some((prefix) => matchesPath(path, prefix)))?.guide;
  if (!guide) return null;

  const names = guide.characters.map((character) => CHARACTER_NAMES[character]).join(" × ");
  return (
    <aside
      className={`${styles.guide} ${guide.characters.length === 2 ? styles.duo : styles.solo}`}
      aria-label={`${names}의 화면 안내`}
      data-character-guide
    >
      <div className={styles.portraits}>
        {guide.characters.map((character) => (
          <span className={`${styles.portrait} ${styles[character]}`} key={character}>
            <Image
              src="/design-b/duo-front.webp"
              width={1440}
              height={722}
              alt={CHARACTER_ALTS[character]}
              className={styles.portraitImage}
              unoptimized
            />
          </span>
        ))}
      </div>
      <div className={styles.content}>
        <p className={styles.byline}><span className={styles.names}>{names}</span><span className={styles.separator} aria-hidden="true">·</span><span>{guide.role}</span></p>
        <p className={styles.copy}>{guide.copy}</p>
      </div>
    </aside>
  );
}
