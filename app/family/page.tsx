"use client";

import { useEffect, useState } from "react";
import type { FamilyMember, FamilyStore, SajuProfile } from "@/lib/store/types";

type ReportResponse = {
  report: string;
  debug: { prompt: string; model: string; provider: string };
};

const EMPTY_PROFILE: SajuProfile = {
  name: "",
  birthDate: "",
  birthTime: "",
  gender: "female",
  calendar: "solar",
};

export default function FamilyPage() {
  const [family, setFamily] = useState<FamilyStore>({ members: [] });
  const [relation, setRelation] = useState("");
  const [profile, setProfile] = useState<SajuProfile>(EMPTY_PROFILE);
  const [unknownTime, setUnknownTime] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => { void loadFamily(); }, []);

  async function loadFamily() {
    const res = await fetch("/api/family");
    const d = await res.json();
    setFamily(d.family);
  }

  function set<K extends keyof SajuProfile>(key: K, value: SajuProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!unknownTime && !profile.birthTime) {
      setAddErr("출생 시각을 입력하거나 '출생시각 모름'을 체크하세요.");
      return;
    }
    setAddErr(null);
    const payload = { ...profile, birthTime: unknownTime ? "" : profile.birthTime };
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relation, profile: payload }),
    });
    const d = await res.json();
    if (!res.ok) { setAddErr(d.error ?? "추가 실패"); return; }
    setFamily(d.family);
    setRelation("");
    setProfile(EMPTY_PROFILE);
    setUnknownTime(false);
  }

  async function removeMember(id: string) {
    const res = await fetch("/api/family", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    setFamily(d.family);
  }

  async function generateReport() {
    setLoading(true);
    setReportErr(null);
    try {
      const res = await fetch("/api/family/report", { method: "POST" });
      const text = await res.text();
      let d: ReportResponse | { error?: string } = {};
      try { d = text ? JSON.parse(text) : {}; }
      catch { d = { error: `서버 응답 파싱 실패 (HTTP ${res.status}): ${text.slice(0, 200)}` }; }
      if (!res.ok) { setReportErr(("error" in d && d.error) || `리포트 생성 실패 (HTTP ${res.status})`); return; }
      setReport(d as ReportResponse);
    } catch (err) {
      setReportErr(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>가족 사주</h1>

      <section className="card stack">
        <h3 style={{ margin: 0 }}>가족 구성원</h3>
        {family.members.length === 0 && <div className="muted">아직 추가된 가족이 없습니다.</div>}
        {family.members.map((m: FamilyMember) => (
          <div key={m.id} className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <strong>{m.relation}</strong> {m.profile.name} /{" "}
              {m.profile.gender === "male" ? "남성" : "여성"} /{" "}
              {m.profile.birthDate} {m.profile.birthTime || "(시각 모름)"}{" "}
              ({m.profile.calendar === "lunar" ? "음력" : "양력"})
            </div>
            <button className="btn--ghost" onClick={() => removeMember(m.id)}>삭제</button>
          </div>
        ))}
      </section>

      <form onSubmit={addMember} className="card stack" style={{ marginTop: 16 }}>
        <h3 style={{ margin: 0 }}>가족 추가</h3>
        <label><span>관계 (예: 어머니, 배우자, 첫째)</span>
          <input value={relation} onChange={(e) => setRelation(e.target.value)} required style={{ width: "100%" }} />
        </label>
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
            onChange={(e) => {
              setUnknownTime(e.target.checked);
              if (e.target.checked) set("birthTime", "");
            }}
          />
          <span style={{ margin: 0 }}>출생시각 모름</span>
        </label>
        <label><span>성별</span>
          <select value={profile.gender} onChange={(e) => set("gender", e.target.value as SajuProfile["gender"])} style={{ width: "100%" }}>
            <option value="female">여성</option>
            <option value="male">남성</option>
          </select>
        </label>
        {addErr && <div className="error">{addErr}</div>}
        <button type="submit" className="btn--primary">추가</button>
      </form>

      <div className="row" style={{ marginTop: 24 }}>
        <button className="btn--primary" onClick={generateReport} disabled={loading || family.members.length === 0}>
          {loading ? "생성 중..." : "가족 사주 리포트 생성"}
        </button>
        <button className="btn--ghost" onClick={() => setShowDebug((v) => !v)}>
          {showDebug ? "디버그 숨기기" : "디버그 보기"}
        </button>
      </div>

      {reportErr && <div className="error" style={{ marginTop: 12 }}>{reportErr}</div>}

      {report && (
        <>
          <section className="card" style={{ marginTop: 16 }}>
            <div className="report">{report.report}</div>
          </section>
          {showDebug && (
            <section className="card" style={{ marginTop: 16 }}>
              <div className="muted">model: {report.debug.provider} / {report.debug.model}</div>
              <h4>렌더된 프롬프트</h4>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{report.debug.prompt}</pre>
            </section>
          )}
        </>
      )}
    </main>
  );
}
