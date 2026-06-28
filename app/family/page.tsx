"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import { ProfileDatePicker, ProfileTimePicker } from "@/components/ProfileDateTimePicker";
import ShareButton from "@/components/ShareButton";
import FamilyReportBody from "@/components/report/FamilyReportBody";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { buildFamilyCircleMembers, FAMILY_PALETTE } from "@/lib/saju/familyCircle";
import { familyReportBasisSignature } from "@/lib/saju/familyReportBasis";
import { parseFamilyReport } from "@/lib/report/types";
import type { FamilyMember, FamilyStore, SajuProfile, SuggestedAction } from "@/lib/store/types";
import { trackEvent } from "@/lib/analytics";

const FAMILY_MESSAGES = [
  "가족 한 명 한 명 사주를 읽는 중이야…",
  "서로의 결이 어떻게 만나는지 보는 중이야…",
  "관계의 흐름을 풀어쓰는 중이야…",
];

type ReportResponse = { report: string; actions?: SuggestedAction[] };
type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { familySignature?: string };
  actions?: SuggestedAction[];
};

const EMPTY_PROFILE: SajuProfile = { name: "", birthDate: "", birthTime: "", gender: "female", calendar: "solar", occupation: "" };

export default function FamilyPage() {
  const [family, setFamily] = useState<FamilyStore>({ members: [] });
  // 계정 주인(본인) 사주 — 가족 현재 결 관계도에서 중심으로 표시하기 위해 불러온다.
  const [self, setSelf] = useState<{ saju: SajuResult; name: string; birthYear: number; occupation?: string } | null>(null);
  const [selfProfile, setSelfProfile] = useState<SajuProfile | null>(null);
  const [relation, setRelation] = useState("");
  const [profile, setProfile] = useState<SajuProfile>(EMPTY_PROFILE);
  const [unknownTime, setUnknownTime] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // 구성원이 이미 있을 때 추가 폼은 접어두고, '추가' 버튼을 눌러야 펼친다.
  const [showForm, setShowForm] = useState(false);

  const [report, setReport] = useState<ReportResponse | null>(null);
  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const [reportBasisDirty, setReportBasisDirty] = useState(false);

  const currentYear = new Date().getFullYear();
  // 멤버별 사주 캐시. profile이 바뀌지 않는 한 재계산 안 함.
  const memberCharts = useMemo(() => {
    const map: Record<string, { saju: SajuResult; birthYear: number } | null> = {};
    for (const m of family.members) {
      try {
        const saju = calculateSaju(m.profile);
        const birthYear = Number(m.profile.birthDate.split("-")[0]) || 0;
        map[m.id] = { saju, birthYear };
      } catch {
        map[m.id] = null;
      }
    }
    return map;
  }, [family.members]);

  useEffect(() => {
    void loadFamily();
    void loadSelf();
    void loadSavedReport();
  }, []);

  async function loadFamily() {
    const res = await fetch("/api/family");
    const d = await res.json();
    setFamily(d.family);
  }

  async function loadSelf() {
    try {
      const res = await fetch("/api/profile");
      const d = await res.json();
      if (d?.profile) {
        const saju = calculateSaju(d.profile);
        const birthYear = Number(d.profile.birthDate.split("-")[0]) || 0;
        setSelfProfile(d.profile);
        setSelf({ saju, name: d.profile.name || "나", birthYear, occupation: d.profile.occupation });
      }
    } catch { /* noop — 본인 프로필이 없으면 가족만 그린다 */ }
  }

  async function loadSavedReport() {
    try {
      const res = await fetch("/api/family/report");
      const d = await res.json();
      if (d.saved) setSaved(d.saved);
    } catch { /* noop */ }
  }

  function set<K extends keyof SajuProfile>(key: K, value: SajuProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function submitMember(e: React.FormEvent) {
    e.preventDefault();
    if (!profile.birthDate) {
      setAddErr("생년월일을 선택하세요.");
      return;
    }
    if (!unknownTime && !profile.birthTime) {
      setAddErr("출생 시각을 입력하거나 '시각 모름'을 선택하세요.");
      return;
    }
    setAddErr(null);
    const payload = {
      ...profile,
      birthTime: unknownTime ? "" : profile.birthTime,
      occupation: profile.occupation?.trim() || undefined,
    };
    const isEdit = editingId !== null;
    const res = await fetch("/api/family", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEdit
          ? { id: editingId, relation, profile: payload }
          : { relation, profile: payload },
      ),
    });
    const d = await res.json();
    if (!res.ok) { setAddErr(d.error ?? (isEdit ? "수정 실패" : "추가 실패")); return; }
    setFamily(d.family);
    setReportBasisDirty(true);
    resetForm();
  }

  function resetForm() {
    setRelation("");
    setProfile(EMPTY_PROFILE);
    setUnknownTime(false);
    setEditingId(null);
    setAddErr(null);
    setShowForm(false);
  }

  function openForm() {
    resetForm();
    setShowForm(true);
    // 폼이 가족 목록 아래라 모바일에선 안 보일 수 있어 스크롤
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document
          .querySelector("[data-family-form]")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function startEdit(m: FamilyMember) {
    setEditingId(m.id);
    setRelation(m.relation);
    setProfile({ ...m.profile });
    setUnknownTime(!m.profile.birthTime);
    setAddErr(null);
    // 폼이 위쪽이라 모바일에선 안 보일 수 있어 스크롤
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document
          .querySelector("[data-family-form]")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function removeMember(id: string) {
    if (editingId === id) resetForm();
    const res = await fetch("/api/family", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    setFamily(d.family);
    setReportBasisDirty(true);
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
      if (!res.ok) { setReportErr(("error" in d && d.error) || `풀이 생성 실패 (HTTP ${res.status})`); return; }
      setReport(d as ReportResponse);
      setSaved(null);
      setReportBasisDirty(false);
      trackEvent("report_generated", { kind: "family" });
    } catch (err) {
      setReportErr(err instanceof Error ? err.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  const view = report
    ? { report: report.report, actions: report.actions ?? [], generatedAt: null as string | null }
    : saved
    ? { report: saved.report, actions: saved.actions ?? [], generatedAt: saved.generatedAt }
    : null;
  const familyReportTitle = view ? parseFamilyReport(view.report)?.title : undefined;
  const currentFamilySignature = selfProfile
    ? familyReportBasisSignature(selfProfile, family)
    : null;
  const savedFamilySignature = typeof saved?.meta?.familySignature === "string"
    ? saved.meta.familySignature
    : null;
  const reportBasisStale =
    !!view &&
    (reportBasisDirty ||
      (!report && !!savedFamilySignature && !!currentFamilySignature && savedFamilySignature !== currentFamilySignature));

  // 본인 + 구성원을 가족 관계도용 멤버로 — 색/관계/이름은 단일 헬퍼가 매긴다(공유 API와 동일 출력).
  const circleMembers = buildFamilyCircleMembers(
    self ? { name: self.name, saju: self.saju, occupation: self.occupation } : null,
    family.members.map((m) => ({
      id: m.id,
      name: m.profile.name,
      relation: m.relation,
      occupation: m.profile.occupation,
      saju: memberCharts[m.id]?.saju ?? null,
    })),
  );

  const hasMembers = family.members.length > 0;
  // 구성원이 있으면 폼은 접고 '추가' 버튼만 — 편집 중(editingId)이거나 직접 펼쳤을(showForm) 때만 연다.
  const formOpen = !hasMembers || showForm || editingId !== null;
  const primaryFamilyRelation = family.members[0]?.relation || "가족";
  const familyConsultQuestion = `${primaryFamilyRelation}와의 관계에서 지금 제일 신경 쓰이는 장면을 기준으로, 어떻게 말하고 어디까지 내가 책임지면 좋을지 알려줘.`;
  const familyConsultHref = `/consult?from=family&q=${encodeURIComponent(familyConsultQuestion)}`;

  const formCard = (
    <>
      <p className="h-sec mt5" data-family-form>
        {editingId ? "구성원 수정" : "구성원 추가"}
      </p>
      <form onSubmit={submitMember} className="card">
        <div className="row gap2" style={{ flexWrap: "nowrap" }}>
          <input className="input" placeholder="이름" value={profile.name} onChange={(e) => set("name", e.target.value)} required style={{ flex: 1.2 }} />
          <input className="input" placeholder="관계 (예: 어머니)" value={relation} onChange={(e) => setRelation(e.target.value)} required style={{ flex: 1 }} />
        </div>
        <input
          className="input mt3"
          placeholder="직업 (선택)"
          value={profile.occupation ?? ""}
          onChange={(e) => set("occupation", e.target.value)}
        />
        <div className="mt3">
          <ProfileDatePicker
            label="생년월일"
            value={profile.birthDate}
            onChange={(value) => set("birthDate", value)}
            required
          />
        </div>
        <div className="family-date-time-row mt3">
          <ProfileTimePicker
            label="출생 시각"
            value={profile.birthTime}
            onChange={(value) => set("birthTime", value)}
            disabled={unknownTime}
          />
          <div className="family-calendar-field">
            <label className="picker-label">달력</label>
            <div className="seg">
              <button type="button" className={profile.calendar === "solar" ? "on" : ""} onClick={() => set("calendar", "solar")}>양력</button>
              <button type="button" className={profile.calendar === "lunar" ? "on" : ""} onClick={() => set("calendar", "lunar")}>음력</button>
            </div>
          </div>
        </div>
        <div className="row between mt3">
          <label className="row gap2" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={unknownTime} onChange={(e) => { setUnknownTime(e.target.checked); if (e.target.checked) set("birthTime", ""); }} />
            <span>시각 모름</span>
          </label>
          <div className="seg" style={{ width: 160 }}>
            <button type="button" className={profile.gender === "female" ? "on" : ""} onClick={() => set("gender", "female")}>여성</button>
            <button type="button" className={profile.gender === "male" ? "on" : ""} onClick={() => set("gender", "male")}>남성</button>
          </div>
        </div>
        {addErr && <p className="error" style={{ marginTop: 10 }}>{addErr}</p>}
        {editingId ? (
          <div className="row gap2 mt4">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>수정 저장</button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>취소</button>
          </div>
        ) : hasMembers ? (
          <div className="row gap2 mt4">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>추가하기</button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>취소</button>
          </div>
        ) : (
          <button type="submit" className="btn btn-primary btn-block mt4">추가하기</button>
        )}
      </form>
    </>
  );

  const familyList = (
    <>
      <p className="h-sec mt5">우리 가족</p>
      {!hasMembers && <div className="card muted">아직 추가된 가족이 없습니다.</div>}
      {family.members.map((m: FamilyMember, i) => {
        const isEditing = editingId === m.id;
        const chart = memberCharts[m.id];
        return (
          <div
            key={m.id}
            className="card"
            style={{
              marginBottom: 14,
              padding: "14px 16px 18px",
              boxShadow: isEditing ? "inset 0 0 0 1.5px var(--text)" : undefined,
            }}
          >
            <div className="row between">
              <div className="row gap3">
                <span className={`el-dot ${FAMILY_PALETTE[i % FAMILY_PALETTE.length]}`} />
                <div>
                  <b style={{ fontSize: 15 }}>{m.profile.name}</b>{" "}
                  <span className="muted" style={{ fontSize: 13 }}>· {m.relation}</span>
                  <div className="muted mono" style={{ fontSize: 12 }}>
                    {m.profile.birthDate} {m.profile.birthTime || "시각 모름"} · {m.profile.calendar === "lunar" ? "음력" : "양력"} · {m.profile.gender === "male" ? "남성" : "여성"}
                    {m.profile.occupation ? ` · ${m.profile.occupation}` : ""}
                  </div>
                </div>
              </div>
              <div className="row gap2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => (isEditing ? resetForm() : startEdit(m))}
                >
                  {isEditing ? "편집 중" : "수정"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => removeMember(m.id)}>삭제</button>
              </div>
            </div>
            {!chart && (
              <p className="muted mt3" style={{ fontSize: 12 }}>사주 계산 실패 — 출생 정보를 확인해주세요.</p>
            )}
          </div>
        );
      })}
      {hasMembers && !formOpen && (
        <button type="button" className="btn btn-ghost btn-block mt3" onClick={openForm}>
          + 가족 구성원 추가
        </button>
      )}
    </>
  );

  return (
    <div className="page">
      <h2 className="h-app">가족 사주</h2>
      <p className="lead mt2" style={{ fontSize: 14 }}>가족을 더하면 너랑의 관계를 풀어줄게.</p>

      {hasMembers ? (
        <>
          {familyList}
          {formOpen && formCard}
        </>
      ) : (
        <>
          {formCard}
          {familyList}
        </>
      )}

      {family.members.length > 0 && (
        <FamilyReportBody circleMembers={circleMembers} currentYear={currentYear} title={familyReportTitle} />
      )}

      <div className="row gap2 mt5">
        <button className="btn btn-primary" onClick={generateReport} disabled={loading || family.members.length === 0}>
          {loading ? "생성 중…" : view ? "풀이 다시 생성" : "가족 사주 풀이 생성"}
        </button>
      </div>

      {reportBasisStale && (
        <div className="card report-stale mt3">
          <b>가족 정보가 바뀌었어.</b>
          <p>아래 풀이는 이전 입력 기준일 수 있어. 지금 가족 목록으로 다시 생성하면 관계 풀이와 액션이 맞춰져.</p>
        </div>
      )}

      {reportErr && <p className="error mt3">{reportErr}</p>}

      {loading ? (
        <>
          <GenerateLoading messages={FAMILY_MESSAGES} />
        </>
      ) : view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <ReportView text={view.report} showFamilyActionPlan={false} />
          <div className="family-consult-bridge mt4">
            <div>
              <b>가족 상담으로 이어가기</b>
              <p>이 가족 풀이를 근거로, 실제로 어떻게 말하고 어디까지 책임질지 상담할 수 있어.</p>
            </div>
            {reportBasisStale ? (
              <button type="button" className="btn btn-ghost" disabled>
                풀이 다시 생성 후 상담
              </button>
            ) : (
              <Link href={familyConsultHref} className="btn btn-primary" style={{ textDecoration: "none" }}>
                가족 상담 시작
              </Link>
            )}
          </div>
          <ActionPlanRegister actions={view.actions} source="family" sourceLabel="가족 사주" />
          <div className="row gap2 mt4">
            <ShareButton kind="family" />
          </div>
        </>
      ) : null}
    </div>
  );
}
