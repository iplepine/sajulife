// 진행 중인 리포트 생성을 전역에서 추적하는 클라이언트 전용 싱글턴.
//
// 생성은 서버 백그라운드(after)에서 돌기 때문에, 클라이언트는 "지금 무엇을 생성 중인지"만
// 알고 있으면 폴링해서 완료를 확인할 수 있다. 이 상태를 모듈 레벨에 두어
//   1) 라우트가 바뀌어도(레이아웃 상주 GenerationCenter가 폴링) 유지되고,
//   2) 새로고침/앱 재진입 후에도 localStorage로 복구된다.
// → "다른 화면으로 가도 완료되면 알림"이 성립한다.

export type GenKind = "personal" | "yongsin" | "tci" | "fusion" | "family";

export type GenJob = {
  kind: GenKind;
  /** 완료 알림·재진입 링크에 쓰는 사람이 읽는 라벨 (예: "개인 사주 풀이"). */
  label: string;
  /** 결과를 볼 수 있는 앱 내부 경로 (예: "/saju"). */
  href: string;
  /** 시작 시각 (epoch ms). */
  startedAt: number;
};

const STORAGE_KEY = "sajulife:gen";
/** 이보다 오래된 잔여 작업은 복구하지 않고 조용히 버린다(닫아둔 사이 이미 끝났을 수 있음). */
const MAX_RESUME_AGE_MS = 15 * 60 * 1000;

const state = new Map<GenKind, GenJob>();
const listeners = new Set<() => void>();
let hydrated = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function persist(): void {
  if (!isBrowser()) return;
  try {
    const arr = [...state.values()];
    if (arr.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* 저장 실패는 무시 */
  }
}

function hydrate(): void {
  if (hydrated || !isBrowser()) return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw) as GenJob[];
    const now = Date.now();
    let changed = false;
    for (const job of arr) {
      if (!job || typeof job.startedAt !== "number" || !job.kind) continue;
      if (now - job.startedAt > MAX_RESUME_AGE_MS) {
        changed = true; // 너무 오래됨 → 버림
        continue;
      }
      state.set(job.kind, job);
    }
    if (changed) persist();
  } catch {
    /* 파싱 실패는 무시 */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

/** 상태 변화 구독. 반환된 함수로 해제. */
export function subscribeGenerations(fn: () => void): () => void {
  hydrate();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getGenerations(): GenJob[] {
  hydrate();
  return [...state.values()];
}

export function isGenerating(kind: GenKind): boolean {
  hydrate();
  return state.has(kind);
}

/** 생성 시작을 등록(멱등 — 이미 추적 중이면 시작 시각을 유지). */
export function startGeneration(job: { kind: GenKind; label: string; href: string }): void {
  hydrate();
  const existing = state.get(job.kind);
  state.set(job.kind, {
    kind: job.kind,
    label: job.label,
    href: job.href,
    startedAt: existing?.startedAt ?? Date.now(),
  });
  persist();
  emit();
}

/** 생성 종료(성공/실패 무관)로 추적에서 제거. */
export function finishGeneration(kind: GenKind): void {
  if (state.delete(kind)) {
    persist();
    emit();
  }
}

/**
 * 브라우저 알림 권한을 확보(있으면 백그라운드 탭에서도 OS 알림 가능).
 * 사용자 제스처(생성 버튼 클릭) 안에서 호출해야 브라우저가 프롬프트를 허용한다.
 */
export function ensureNotifyPermission(): void {
  if (!isBrowser() || typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    try {
      void Notification.requestPermission();
    } catch {
      /* 무시 */
    }
  }
}
