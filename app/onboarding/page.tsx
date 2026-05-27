"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SajuProfile } from "@/lib/store/types";

const EMPTY: SajuProfile = {
  name: "",
  birthDate: "",
  birthTime: "",
  gender: "female",
  calendar: "solar",
  note: "",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SajuProfile>(EMPTY);
  const [unknownTime, setUnknownTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setProfile({ ...EMPTY, ...d.profile });
          setUnknownTime(d.profile.birthTime === "");
        }
      });
  }, []);

  function set<K extends keyof SajuProfile>(key: K, value: SajuProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function toggleUnknownTime(checked: boolean) {
    setUnknownTime(checked);
    if (checked) set("birthTime", "");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!unknownTime && !profile.birthTime) {
      setError("출생 시각을 입력하거나 '출생시각 모름'을 체크하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = { ...profile, birthTime: unknownTime ? "" : profile.birthTime };
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "저장 실패");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="container">
      <h1>사주 정보 입력</h1>
      <p className="muted">AI 리포트의 기본 정보가 됩니다. 언제든 다시 수정할 수 있습니다.</p>

      <form onSubmit={handleSave} className="stack card" style={{ marginTop: 16 }}>
        <label><span>이름 또는 별명</span>
          <input value={profile.name} onChange={(e) => set("name", e.target.value)} required style={{ width: "100%" }} />
        </label>
        <label><span>생년월일</span>
          <input type="date" value={profile.birthDate} onChange={(e) => set("birthDate", e.target.value)} required style={{ width: "100%" }} />
        </label>
        <label><span>달력</span>
          <select value={profile.calendar} onChange={(e) => set("calendar", e.target.value as SajuProfile["calendar"])} style={{ width: "100%" }}>
            <option value="solar">양력</option>
            <option value="lunar">음력</option>
          </select>
        </label>
        <label><span>출생 시각</span>
          <input
            type="time"
            value={profile.birthTime}
            onChange={(e) => set("birthTime", e.target.value)}
            disabled={unknownTime}
            style={{ width: "100%" }}
          />
        </label>
        <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={unknownTime}
            onChange={(e) => toggleUnknownTime(e.target.checked)}
          />
          <span style={{ margin: 0 }}>출생시각 모름 (연·월·일주만으로 풀이)</span>
        </label>
        <label><span>성별</span>
          <select value={profile.gender} onChange={(e) => set("gender", e.target.value as SajuProfile["gender"])} style={{ width: "100%" }}>
            <option value="female">여성</option>
            <option value="male">남성</option>
          </select>
        </label>
        <label><span>메모 (선택)</span>
          <textarea rows={3} value={profile.note ?? ""} onChange={(e) => set("note", e.target.value)} style={{ width: "100%" }} />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn--primary" disabled={loading}>
          {loading ? "저장 중..." : "저장하고 시작"}
        </button>
      </form>
    </main>
  );
}
