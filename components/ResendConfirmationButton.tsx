"use client";

import { useEffect, useState } from "react";
import type { ConfirmationEmailType } from "@/lib/auth-client-utils";
import { getAuthErrorMessage } from "@/lib/auth-client-utils";
import { createClient } from "@/lib/supabase/client";

const COOLDOWN_SECONDS = 60;

type Props = {
  email: string;
  confirmationType: ConfirmationEmailType;
  next?: string;
  className?: string;
};

/** 이메일 인증 재전송의 짧은 클라이언트 쿨다운 UI. 서버의 Supabase 제한은 별도로 적용된다. */
export default function ResendConfirmationButton({
  email,
  confirmationType,
  next = "/dashboard",
  className = "btn btn-ghost btn-block mt3",
}: Props) {
  const supabase = createClient();
  const [remaining, setRemaining] = useState(0);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  async function handleResend() {
    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const emailRedirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`;
      const { error: resendError } = await supabase.auth.resend({
        type: confirmationType,
        email,
        options: { emailRedirectTo },
      });
      if (resendError) throw resendError;

      setRemaining(COOLDOWN_SECONDS);
      setMessage("인증 메일을 다시 보냈어요. 받은편지함과 스팸함을 확인해주세요.");
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError));
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button type="button" className={className} onClick={handleResend} disabled={sending || remaining > 0}>
        {sending ? "인증 메일 보내는 중…" : remaining > 0 ? `다시 보내기 (${remaining}초)` : "인증 메일 다시 보내기"}
      </button>
      {message && <p className="hint" role="status">{message}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
