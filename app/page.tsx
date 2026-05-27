"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/guest")
      .then((r) => r.json())
      .then((d) => setGuestId(d.guestId));
  }, []);

  async function handleGuestLogin() {
    const res = await fetch("/api/guest", { method: "POST" });
    const data = await res.json();
    setGuestId(data.guestId);
    router.push("/onboarding");
  }

  return (
    <main className="container">
      <h1>sajulife</h1>
      <p className="muted">
        AI 사주 리포트 프롬프트 튜닝 프로토타입. 로그인 없이 게스트로 시작합니다.
      </p>

      <div className="card stack" style={{ marginTop: 24 }}>
        <div>현재 게스트: {guestId ? <code>{guestId}</code> : "없음"}</div>
        <button className="btn--primary" onClick={handleGuestLogin}>
          {guestId ? "이어서 시작하기" : "게스트로 시작"}
        </button>
        <p className="muted">
          게스트 ID는 브라우저 쿠키에 저장됩니다. 입력한 사주/설문/가족 정보는
          서버의 <code>data/guests/{`{guestId}`}/</code> 폴더에 파일로 보관됩니다.
        </p>
      </div>
    </main>
  );
}
