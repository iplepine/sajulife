"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import {
  finishGeneration,
  getGenerations,
  subscribeGenerations,
  type GenJob,
  type GenKind,
} from "@/lib/generation/tracker";

/**
 * 전역 생성 알림 센터 — 레이아웃에 상주(라우트가 바뀌어도 언마운트되지 않음).
 *
 * tracker에 등록된 각 생성 작업을 폴링해 완료를 감지하고, 끝나면
 *  - 화면 하단에 토스트를 띄우고("보러 가기"),
 *  - 탭이 백그라운드면 OS 알림도 보낸다(권한 있을 때).
 * 사용자가 사주 화면을 떠나 다른 메뉴에 있어도 완료를 알 수 있다.
 */

// 완료 여부 폴링 간격(ms): 30초 후 첫 확인 → 20초 → 10초 → 이후 10초마다.
const POLL_SCHEDULE = [30_000, 20_000, 10_000];
const POLL_INTERVAL = 10_000;
const TOAST_MS = 9_000;

// 종류별 상태 조회 엔드포인트.
const STATUS_URL: Record<GenKind, string> = {
  personal: "/api/saju/personal",
  yongsin: "/api/saju/yongsin",
};

type StatusResponse = {
  status?: "idle" | "generating" | "error";
  error?: string;
  saved?: { generatedAt?: string } | null;
};

type Outcome = { kind: GenKind; label: string; href: string; ok: boolean; error?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchStatus(kind: GenKind): Promise<StatusResponse> {
  const res = await fetch(STATUS_URL[kind], { cache: "no-store" });
  if (!res.ok) throw new Error(`status ${res.status}`);
  return (await res.json()) as StatusResponse;
}

export default function GenerationCenter() {
  const router = useRouter();
  const [jobs, setJobs] = useState<GenJob[]>([]);
  const [toast, setToast] = useState<Outcome | null>(null);
  // 종류별 폴링 루프 중복 방지 플래그.
  const polling = useRef<Set<GenKind>>(new Set());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // tracker 구독
  useEffect(() => {
    const sync = () => setJobs(getGenerations());
    sync();
    return subscribeGenerations(sync);
  }, []);

  // 완료/실패 표시(토스트 + 필요 시 OS 알림)
  const notify = (o: Outcome) => {
    setToast(o);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);

    if (
      o.ok &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      typeof document !== "undefined" &&
      document.hidden
    ) {
      try {
        const n = new Notification("풀이가 다 나왔어", {
          body: `${o.label} 보러 가자`,
          tag: `gen-${o.kind}`,
        });
        n.onclick = () => {
          window.focus();
          router.push(o.href);
          n.close();
        };
      } catch {
        /* 무시 */
      }
    }
  };

  // 활성 작업마다 폴링 루프 보장
  useEffect(() => {
    for (const job of jobs) {
      if (polling.current.has(job.kind)) continue;
      polling.current.add(job.kind);
      void runPoll(job);
    }

    async function runPoll(job: GenJob) {
      let i = 0;
      try {
        while (true) {
          const delay = POLL_SCHEDULE[i] ?? POLL_INTERVAL;
          i += 1;
          await sleep(delay);

          // 다른 경로로 이미 완료 처리됐으면(=tracker에서 사라짐) 종료.
          const still = getGenerations().some((g) => g.kind === job.kind && g.startedAt === job.startedAt);
          if (!still) break;

          let s: StatusResponse;
          try {
            s = await fetchStatus(job.kind);
          } catch {
            continue; // 일시 오류 → 다음 주기 재시도
          }
          if (s.status === "generating") continue;

          const ok = s.status !== "error";
          finishGeneration(job.kind);
          if (ok) trackEvent("report_generated", { kind: job.kind });
          notify({ kind: job.kind, label: job.label, href: job.href, ok, error: s.error });
          break;
        }
      } finally {
        polling.current.delete(job.kind);
      }
    }
  }, [jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  return (
    <div className="gen-toast" role="status" aria-live="polite">
      <span className="gen-toast-dot" data-ok={toast.ok ? "1" : "0"} aria-hidden />
      <div className="gen-toast-body">
        <strong className="gen-toast-title">
          {toast.ok ? "풀이가 다 나왔어" : "풀이 생성에 실패했어요"}
        </strong>
        <span className="gen-toast-msg">
          {toast.ok ? `${toast.label} 보러 가자` : toast.error || "잠시 후 다시 시도해 주세요."}
        </span>
      </div>
      {toast.ok && (
        <button
          type="button"
          className="gen-toast-go"
          onClick={() => {
            router.push(toast.href);
            setToast(null);
          }}
        >
          보러 가기
        </button>
      )}
      <button
        type="button"
        className="gen-toast-x"
        aria-label="닫기"
        onClick={() => setToast(null)}
      >
        ×
      </button>
    </div>
  );
}
