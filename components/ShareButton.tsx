"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReportKind } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

/**
 * 풀이 공유 버튼 — 공개성 확인 뒤 공개 공유 링크를 만들고(POST /api/share) 메뉴를 연다:
 * 카카오톡 공유(키 있을 때) · 링크 복사 · 더보기(navigator.share).
 * 풀이가 존재할 때만(=각 페이지에서 view 있을 때) 렌더한다.
 * NEXT_PUBLIC_KAKAO_JS_KEY가 없으면 카카오 버튼은 숨고 복사/더보기만 동작(graceful fallback).
 */

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: { sendDefault: (opts: unknown) => void };
    };
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

type ShareExpiry = "30d" | "never";
type ShareLinkState = "none" | "active" | "expired" | "revoked";
type ShareInfo = {
  url: string;
  ogUrl: string;
  title: string;
  description: string;
  expiresAt: string | null;
};
type ShareResponse = Partial<ShareInfo> & { state?: ShareLinkState; error?: string };

export default function ShareButton({ kind }: { kind: ReportKind }) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [linkState, setLinkState] = useState<ShareLinkState | null>(null);
  const [expiry, setExpiry] = useState<ShareExpiry>("30d");
  const [open, setOpen] = useState(false);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  function flashCopied() {
    setError(null);
    setNotice(null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function responseInfo(d: ShareResponse): ShareInfo | null {
    if (
      d.state !== "active" ||
      typeof d.url !== "string" ||
      typeof d.ogUrl !== "string" ||
      typeof d.title !== "string" ||
      typeof d.description !== "string" ||
      (d.expiresAt !== null && typeof d.expiresAt !== "string")
    ) {
      return null;
    }
    return { url: d.url, ogUrl: d.ogUrl, title: d.title, description: d.description, expiresAt: d.expiresAt };
  }

  async function loadShareStatus(): Promise<ShareLinkState | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/share?kind=${encodeURIComponent(kind)}`, { cache: "no-store" });
      const d = (await res.json()) as ShareResponse;
      if (!res.ok) {
        setError(d.error || "공유 링크 생성에 실패했어요");
        return null;
      }
      const next = responseInfo(d);
      const state = d.state ?? "none";
      setLinkState(state);
      if (!next) {
        setInfo(null);
        return state;
      }
      setInfo(next);
      return "active";
    } catch {
      setError("네트워크 오류로 공유 링크를 확인하지 못했어요");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createShare(mode: "create" | "reissue"): Promise<ShareInfo | null> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, expiry, mode }),
      });
      const d = (await res.json()) as ShareResponse;
      if (!res.ok) {
        setError(d.error || "공유 링크 생성에 실패했어요");
        return null;
      }
      const next = responseInfo(d);
      if (!next) {
        setError("공유 링크 응답을 확인하지 못했어요");
        return null;
      }
      setInfo(next);
      setLinkState("active");
      setCopied(false);
      trackEvent("share_created", { kind, mode });
      if (mode === "reissue") setNotice("새 링크를 발급했고, 이전 링크는 즉시 폐기했어요.");
      return next;
    } catch {
      setError("네트워크 오류로 공유에 실패했어요");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function ensureShare(): Promise<ShareInfo | null> {
    return info ?? createShare("create");
  }

  async function onShareClick() {
    if (open || preflightOpen) {
      setOpen(false);
      setPreflightOpen(false);
      return;
    }
    setNotice(null);
    if (info) {
      setOpen(true);
      return;
    }
    const state = await loadShareStatus();
    if (state === "active") setOpen(true);
    else if (state) setPreflightOpen(true);
  }

  async function confirmShare() {
    const i = await createShare("create");
    if (!i) return;
    setPreflightOpen(false);
    setOpen(true);
  }

  async function reissueShare() {
    const i = await createShare("reissue");
    if (!i) return;
    setOpen(true);
  }

  async function revokeCurrentShare() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const d = (await res.json()) as ShareResponse;
      if (!res.ok) {
        setError(d.error || "공유 링크 폐기에 실패했어요");
        return;
      }
      setInfo(null);
      setLinkState(d.state ?? "revoked");
      setOpen(false);
      setNotice("공유 링크를 폐기했어요. 이전 주소는 더 이상 열리지 않아요.");
    } catch {
      setError("네트워크 오류로 공유 링크를 폐기하지 못했어요");
    } finally {
      setBusy(false);
    }
  }

  function ensureKakao(): boolean {
    if (!KAKAO_KEY || typeof window === "undefined" || !window.Kakao) return false;
    if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_KEY);
    return true;
  }

  async function shareKakao() {
    const i = info ?? (await ensureShare());
    if (!i) return;
    if (!ensureKakao()) { setError("카카오 공유를 사용할 수 없어요"); return; }
    window.Kakao!.Share.sendDefault({
      objectType: "feed",
      content: {
        title: i.title,
        description: i.description,
        imageUrl: i.ogUrl,
        link: { mobileWebUrl: i.url, webUrl: i.url },
      },
      buttons: [{ title: "풀이 열기", link: { mobileWebUrl: i.url, webUrl: i.url } }],
    });
  }

  async function copyLink() {
    const i = info ?? (await ensureShare());
    if (!i) return;
    // 1) 모던 클립보드 API (https·localhost 등 보안 컨텍스트)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(i.url);
        flashCopied();
        return;
      }
    } catch {
      /* 권한·비보안 컨텍스트 — 아래 폴백 */
    }
    // 2) 레거시 execCommand 폴백 (인앱 브라우저·비보안 컨텍스트)
    try {
      const el = urlRef.current;
      if (el) {
        el.focus();
        el.select();
        el.setSelectionRange(0, i.url.length);
        if (document.execCommand("copy")) {
          flashCopied();
          return;
        }
      }
    } catch {
      /* 아래 수동 복사 안내 */
    }
    // 3) 둘 다 막힘 — 주소를 선택해 두고 직접 복사 안내
    urlRef.current?.select();
    setError("자동 복사가 안 돼. 위 주소를 길게 눌러 복사해줘.");
  }

  async function nativeShare() {
    const i = info ?? (await ensureShare());
    if (!i) return;
    try {
      await navigator.share?.({ title: i.title, text: i.description, url: i.url });
    } catch {
      /* 사용자 취소 등은 무시 */
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  // ★타인의 출생 정보가 스냅샷에 실리는 풀이★ — 가족·궁합. 공유 전 경고 문구를 따로 준다.
  const sharesOthers = kind === "family" || kind === "compat";
  const othersLabel = kind === "compat" ? "상대" : "가족 구성원";
  const preflightTitle = linkState === "expired"
    ? "만료된 링크 새로 발급하기"
    : linkState === "revoked"
      ? "폐기한 링크 새로 발급하기"
      : sharesOthers
        ? `${kind === "compat" ? "궁합" : "가족"} 풀이 공유 전 확인`
        : "공개 링크 만들기 전 확인";
  const expiryText = info?.expiresAt
    ? `${new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", year: "numeric" }).format(new Date(info.expiresAt))}까지 공개`
    : "만료 없이 공개";

  function closeModal() {
    setOpen(false);
    setPreflightOpen(false);
    setError(null);
  }

  return (
    <span className="share-wrap">
      {KAKAO_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
          crossOrigin="anonymous"
          strategy="afterInteractive"
          onLoad={() => setKakaoReady(ensureKakao())}
        />
      )}
      <button className="btn btn-ghost btn-sm" onClick={onShareClick} disabled={busy}>
        {busy ? "준비 중…" : info ? "공유 관리" : "공유하기"}
      </button>
      {(error || notice) && !open && !preflightOpen && (
        <span className={error ? "error share-error" : "share-error"}>{error ?? notice}</span>
      )}
      {preflightOpen && typeof document !== "undefined" &&
        createPortal(
          <div className="share-overlay" role="presentation" onClick={closeModal}>
            <div
              className="share-modal card"
              role="dialog"
              aria-modal="true"
              aria-label={preflightTitle}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="share-modal-title">{preflightTitle}</p>
              <p className="share-menu-warning">
                {sharesOthers
                  ? `이 링크에는 ${othersLabel}의 출생 정보와 관계 풀이가 공개 스냅샷으로 들어가. 링크를 아는 사람은 로그인 없이 열어볼 수 있어.`
                  : "이 링크는 로그인 없이 열리는 공개 스냅샷이야. 링크를 아는 사람은 누구나 풀이를 볼 수 있어."}
              </p>
              <fieldset style={{ border: 0, margin: "12px 4px", padding: 0 }}>
                <legend style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>공개 기간</legend>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                  <input type="radio" name={`share-expiry-${kind}`} checked={expiry === "30d"} onChange={() => setExpiry("30d")} />
                  {" "}30일 후 자동 만료 (권장)
                </label>
                <label style={{ display: "block", fontSize: 13 }}>
                  <input type="radio" name={`share-expiry-${kind}`} checked={expiry === "never"} onChange={() => setExpiry("never")} />
                  {" "}만료 없이 유지 — 필요할 때 직접 폐기
                </label>
              </fieldset>
              <p className="share-menu-note">발급 뒤에는 이 화면에서 즉시 폐기하거나 새 링크로 재발급할 수 있어.</p>
              <button className="btn btn-primary btn-block" onClick={confirmShare} disabled={busy}>
                {busy ? "링크 만드는 중…" : "이해했어, 링크 만들기"}
              </button>
              <button className="btn btn-ghost btn-block share-modal-close" onClick={closeModal}>취소</button>
              {error && <p className="error" style={{ fontSize: 12, margin: "8px 4px 0" }}>{error}</p>}
            </div>
          </div>,
          document.body,
        )}
      {open && info && typeof document !== "undefined" &&
        createPortal(
          <div className="share-overlay" role="presentation" onClick={closeModal}>
            <div
              className="share-modal card"
              role="dialog"
              aria-modal="true"
              aria-label="공유하기"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="share-modal-title">공유하기</p>
              <input
                ref={urlRef}
                className="share-url"
                readOnly
                value={info.url}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="공유 링크"
              />
              {kakaoReady && (
                <button className="share-menu-item" onClick={shareKakao}>카카오톡으로 공유</button>
              )}
              <button className="share-menu-item" onClick={copyLink}>{copied ? "링크 복사됨!" : "링크 복사"}</button>
              {canNativeShare && (
                <button className="share-menu-item" onClick={nativeShare}>더보기…</button>
              )}
              {error && <p className="error" style={{ fontSize: 12, margin: "4px 4px 0" }}>{error}</p>}
              {notice && <p className="share-menu-note">{notice}</p>}
              <p className="share-menu-note">
                {sharesOthers
                  ? `${othersLabel} 정보가 포함된 공개 링크예요. ${expiryText}. 필요한 사람에게만 보내세요.`
                  : `${expiryText}. 필요한 사람에게만 보내세요.`}
              </p>
              <button className="share-menu-item" onClick={reissueShare} disabled={busy}>
                {busy ? "처리 중…" : "새 링크 발급 (이전 링크 폐기)"}
              </button>
              <button className="share-menu-item" onClick={revokeCurrentShare} disabled={busy}>
                {busy ? "처리 중…" : "공유 링크 폐기"}
              </button>
              <button className="btn btn-ghost btn-block share-modal-close" onClick={closeModal}>닫기</button>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
