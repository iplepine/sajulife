import { withGenerateIntent } from "@/lib/generation/intent";

/**
 * 사주+기질 풀이의 진행 단계 — 결제 → 사주 정보 → 사주 풀이 → 기질 검사 → 사주+기질 올해 운세.
 *
 * 홈의 큰 버튼, 결제 직후 이동, 사주 풀이 끝의 안내가 ★모두 이 함수 하나★로 다음 걸음을 정한다.
 * 화면마다 따로 판단하면 같은 사람에게 서로 다른 다음 단계를 권하게 된다.
 * 순수 함수라 서버·클라이언트 어디서나 쓰고, 단위 테스트로 고정한다.
 */

export type ReportProgress = { saved: boolean; status: "idle" | "generating" | "error" };

export type PackageJourneyState = {
  entitled: boolean;
  hasProfile: boolean;
  personal: ReportProgress;
  tci: { complete: boolean; answered: number; total: number };
  fusion: ReportProgress;
};

export type JourneyStepKey =
  | "buy"
  | "profile"
  | "personal"
  | "personal-generating"
  | "personal-retry"
  | "tci"
  | "fusion"
  | "fusion-generating"
  | "fusion-retry"
  | "done";

export type JourneyStep = {
  key: JourneyStepKey;
  /** 지금 서 있는 단계 — 0: 결제 전, 1: 사주, 2: 기질 검사, 3: 올해 운세(완료 포함). */
  stage: 0 | 1 | 2 | 3;
  href: string;
  label: string;
  note: string;
};

/** 기질 검사를 마치면 바로 사주+기질 올해 운세로 이어지게 하는 진입 주소. */
export const TCI_FOR_FUSION_HREF = "/tci?variant=short&next=fusion";

/** 사주 정보 입력이 끝나면 곧바로 사주 풀이를 만들도록 의사를 실어 보낸다. */
export const PROFILE_FOR_PACKAGE_HREF = `/onboarding?next=${encodeURIComponent(withGenerateIntent("/saju"))}`;

export function nextJourneyStep(s: PackageJourneyState): JourneyStep {
  if (!s.entitled) {
    return {
      key: "buy",
      stage: 0,
      href: "/checkout",
      label: "사주+기질 분석하기",
      note: "사주로 타고난 나를, 기질 검사로 요즘의 나를 읽고 둘을 겹쳐 올해 운세를 풀어드려요.",
    };
  }
  if (!s.hasProfile) {
    return {
      key: "profile",
      stage: 1,
      href: PROFILE_FOR_PACKAGE_HREF,
      label: "사주 정보 입력하기",
      note: "생년월일과 태어난 시각만 알려주시면 사주 풀이부터 바로 시작해요.",
    };
  }
  if (s.personal.status === "generating") {
    return {
      key: "personal-generating",
      stage: 1,
      href: "/saju",
      label: "사주 풀이 진행 확인하기",
      note: "사주 풀이를 만들고 있어요. 다 되면 알림으로 알려드릴게요.",
    };
  }
  if (!s.personal.saved) {
    if (s.personal.status === "error") {
      return {
        key: "personal-retry",
        stage: 1,
        href: "/saju",
        label: "사주 풀이 다시 시도하기",
        note: "지난번 사주 풀이를 끝내지 못했어요. 풀이 화면에서 다시 시도할 수 있어요.",
      };
    }
    return {
      key: "personal",
      stage: 1,
      href: withGenerateIntent("/saju"),
      label: "내 사주 풀이 받기",
      note: "먼저 타고난 결과 평생 흐름을 담은 사주 풀이를 만들어요.",
    };
  }
  if (!s.tci.complete) {
    const partial = s.tci.answered > 0 && s.tci.total > 0;
    return {
      key: "tci",
      stage: 2,
      href: TCI_FOR_FUSION_HREF,
      label: partial ? "기질 검사 이어서 하기" : "기질 검사하고 올해 운세 보기",
      note: partial
        ? `기질 검사를 ${s.tci.answered}/${s.tci.total}문항까지 했어요. 마저 하면 올해 운세가 열려요.`
        : "사주 풀이가 나왔어요. 기질 검사(35문항, 약 3분)를 더하면 올해 운세를 훨씬 정확하게 볼 수 있어요.",
    };
  }
  if (s.fusion.status === "generating") {
    return {
      key: "fusion-generating",
      stage: 3,
      href: "/fusion",
      label: "올해 운세 진행 확인하기",
      note: "사주와 기질을 겹쳐 올해 운세를 만들고 있어요. 다 되면 알림으로 알려드릴게요.",
    };
  }
  if (!s.fusion.saved) {
    if (s.fusion.status === "error") {
      return {
        key: "fusion-retry",
        stage: 3,
        href: "/fusion",
        label: "올해 운세 다시 시도하기",
        note: "지난번 올해 운세를 끝내지 못했어요. 풀이 화면에서 다시 시도할 수 있어요.",
      };
    }
    return {
      key: "fusion",
      stage: 3,
      href: withGenerateIntent("/fusion"),
      label: "사주+기질 올해 운세 받기",
      note: "재료가 다 모였어요. 사주와 기질을 겹쳐 올해 운세를 만들어요.",
    };
  }
  return {
    key: "done",
    stage: 3,
    href: "/fusion",
    label: "내 올해 운세 보기",
    note: "올해 운세까지 준비됐어요. 언제든 다시 볼 수 있어요.",
  };
}
