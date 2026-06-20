"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReportKind } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

/**
 * 리포트 공유 버튼 — 누르면 공개 공유 링크를 만들고(POST /api/share) 메뉴를 연다:
 * 카카오톡 공유(키 있을 때) · 링크 복사 · 더보기(navigator.share).
 * 리포트가 존재할 때만(=각 페이지에서 view 있을 때) 렌더한다.
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

type ShareInfo = { url: string; ogUrl: string; title: string; description: string };

export default function ShareButton({ kind }: { kind: ReportKind }) {
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kakaoReady, setKakaoReady] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  function flashCopied() {
    setError(null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function ensureShare(): Promise<ShareInfo | null> {
    if (info) return info;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error || "공유 링크 생성에 실패했어요");
        return null;
      }
      const next: ShareInfo = { url: d.url, ogUrl: d.ogUrl, title: d.title, description: d.description };
      setInfo(next);
      trackEvent("share_created", { kind });
      return next;
    } catch {
      setError("네트워크 오류로 공유에 실패했어요");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onShareClick() {
    if (open) { setOpen(false); return; }
    const i = await ensureShare();
    if (i) setOpen(true);
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
      buttons: [{ title: "리포트 열기", link: { mobileWebUrl: i.url, webUrl: i.url } }],
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

  function closeModal() {
    setOpen(false);
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
        {busy ? "준비 중…" : "공유하기"}
      </button>
      {error && !open && <span className="error share-error">{error}</span>}
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
              <p className="share-menu-note">이 링크는 누구나 열어볼 수 있어요.</p>
              <button className="btn btn-ghost btn-block share-modal-close" onClick={closeModal}>닫기</button>
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
