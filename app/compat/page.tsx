"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReportView from "@/components/ReportView";
import ActionPlanRegister from "@/components/ActionPlanRegister";
import GenerateLoading from "@/components/GenerateLoading";
import PersonSwitcher from "@/components/PersonSwitcher";
import { ProfileDatePicker, ProfileTimePicker } from "@/components/ProfileDateTimePicker";
import ShareButton from "@/components/ShareButton";
import CompatReportBody from "@/components/report/CompatReportBody";
import { calculateSaju, type SajuResult } from "@/lib/saju/calculator";
import { buildFamilyCircleMembers } from "@/lib/saju/familyCircle";
import {
  COMPAT_RELATIONS,
  compatReportBasisSignature,
  selectedCompatPartner,
} from "@/lib/saju/compatReport";
import { parseFamilyReport } from "@/lib/report/types";
import type { CompatPartner, CompatStore, SajuProfile, SuggestedAction } from "@/lib/store/types";
import {
  ensureNotifyPermission,
  isGenerating,
  startGeneration,
  subscribeGenerations,
} from "@/lib/generation/tracker";

const COMPAT_MESSAGES = [
  "두 사람 사주를 나란히 놓는 중이야…",
  "어디서 맞물리고 어디서 어긋나는지 보는 중이야…",
  "실제로 벌어질 장면들을 그려보는 중이야…",
  "마지막으로, 너한테 건넬 첫 한마디를 고민하는 중이야…",
];

type SavedShape = {
  report: string;
  generatedAt: string;
  provider: string;
  model: string;
  meta?: { compatSignature?: string; relation?: string };
  actions?: SuggestedAction[];
};

const EMPTY_PROFILE: SajuProfile = { name: "", birthDate: "", birthTime: "", gender: "female", calendar: "solar", occupation: "" };

export default function CompatPage() {
  const [compat, setCompat] = useState<CompatStore>({ partners: [] });
  // 계정 주인(본인) 사주 — 관계도에서 중심으로 표시하기 위해 불러온다.
  const [self, setSelf] = useState<{ saju: SajuResult; name: string; occupation?: string } | null>(null);
  const [selfProfile, setSelfProfile] = useState<SajuProfile | null>(null);
  const [relation, setRelation] = useState<string>(COMPAT_RELATIONS[0]);
  const [profile, setProfile] = useState<SajuProfile>(EMPTY_PROFILE);
  const [unknownTime, setUnknownTime] = useState(false);
  const [addErr, setAddErr] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [saved, setSaved] = useState<SavedShape | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportErr, setReportErr] = useState<string | null>(null);
  const [reportBasisDirty, setReportBasisDirty] = useState(false);
  const [savingSelection, setSavingSelection] = useState(false);
  const prevGenerating = useRef(false);

  const currentYear = new Date().getFullYear();
  const partnerCharts = useMemo(() => {
    const map: Record<string, SajuResult | null> = {};
    for (const p of compat.partners) {
      try {
        map[p.id] = calculateSaju(p.profile);
      } catch {
        map[p.id] = null;
      }
    }
    return map;
  }, [compat.partners]);

  useEffect(() => {
    void loadCompat();
    void loadSelf();
    void loadSavedReport();
  }, []);

  // 전역 생성 추적을 화면에 반영하고, 완료되는 순간 최신 저장본을 다시 읽어온다.
  useEffect(() => {
    const sync = async () => {
      const nowGen = isGenerating("compat");
      setGenerating(nowGen);
      if (prevGenerating.current && !nowGen) {
        try {
          const r = await fetch("/api/compat/report", { cache: "no-store" }).then((x) => x.json());
          if (r.saved) { setSaved(r.saved); setReportBasisDirty(false); }
          if (r.status === "error" && r.error) setReportErr(r.error);
          else setReportErr(null);
        } catch {
          /* 무시 — 다음 방문 시 초기 로드가 복구 */
        }
      }
      prevGenerating.current = nowGen;
    };
    void sync();
    return subscribeGenerations(() => { void sync(); });
  }, []);

  async function loadCompat() {
    const res = await fetch("/api/compat");
    const d = await res.json();
    if (d.compat) setCompat(d.compat);
  }

  async function loadSelf() {
    try {
      const res = await fetch("/api/profile");
      const d = await res.json();
      if (d?.profile) {
        setSelfProfile(d.profile);
        setSelf({ saju: calculateSaju(d.profile), name: d.profile.name || "나", occupation: d.profile.occupation });
      }
    } catch { /* noop — 본인 프로필이 없으면 상대만 그린다 */ }
  }

  async function loadSavedReport() {
    try {
      const res = await fetch("/api/compat/report", { cache: "no-store" });
      const d = await res.json();
      if (d.saved) setSaved(d.saved);
      if (d.status === "generating") {
        startGeneration({ kind: "compat", label: "궁합 풀이", href: "/compat" });
      } else if (d.status === "error" && d.error) {
        setReportErr(d.error);
      }
    } catch { /* noop */ }
  }

  function set<K extends keyof SajuProfile>(key: K, value: SajuProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function submitPartner(e: React.FormEvent) {
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
    const res = await fetch("/api/compat", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editingId, relation, profile: payload } : { relation, profile: payload }),
    });
    const d = await res.json();
    if (!res.ok) { setAddErr(d.error ?? (isEdit ? "수정 실패" : "추가 실패")); return; }
    setCompat(d.compat);
    setReportBasisDirty(true);
    resetForm();
  }

  function resetForm() {
    setRelation(COMPAT_RELATIONS[0]);
    setProfile(EMPTY_PROFILE);
    setUnknownTime(false);
    setEditingId(null);
    setAddErr(null);
    setShowForm(false);
  }

  function openForm() {
    resetForm();
    setShowForm(true);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.querySelector("[data-compat-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function startEdit(p: CompatPartner) {
    setEditingId(p.id);
    setRelation(p.relation);
    setProfile({ ...p.profile });
    setUnknownTime(!p.profile.birthTime);
    setAddErr(null);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.querySelector("[data-compat-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  async function removePartner(id: string) {
    if (editingId === id) resetForm();
    const res = await fetch("/api/compat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const d = await res.json();
    setCompat(d.compat);
    setReportBasisDirty(true);
  }

  async function selectPartner(id: string) {
    if (generating || savingSelection || compat.reportPartnerId === id) return;
    const previous = compat;
    setSavingSelection(true);
    setCompat({ ...compat, reportPartnerId: id });
    try {
      const res = await fetch("/api/compat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportPartnerId: id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "상대 선택을 저장하지 못했어요.");
      setCompat(d.compat);
      setReportBasisDirty(true);
    } catch (err) {
      setCompat(previous);
      setReportErr(err instanceof Error ? err.message : "상대 선택을 저장하지 못했어요.");
    } finally {
      setSavingSelection(false);
    }
  }

  async function generateReport() {
    setReportErr(null);
    try {
      const res = await fetch("/api/compat/report", { method: "POST" });
      if (res.status === 202) {
        ensureNotifyPermission();
        startGeneration({ kind: "compat", label: "궁합 풀이", href: "/compat" });
        return;
      }
      const d = await res.json().catch(() => ({} as { error?: string }));
      setReportErr(d.error || `풀이 생성 실패 (HTTP ${res.status})`);
    } catch {
      setReportErr("풀이 생성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  const view = saved
    ? { report: saved.report, actions: saved.actions ?? [], generatedAt: saved.generatedAt }
    : null;
  const reportTitle = view ? parseFamilyReport(view.report)?.title : undefined;
  const currentSignature = selfProfile ? compatReportBasisSignature(selfProfile, compat) : null;
  const savedSignature = typeof saved?.meta?.compatSignature === "string" ? saved.meta.compatSignature : null;
  const reportBasisStale =
    !!view && (reportBasisDirty || (!!savedSignature && !!currentSignature && savedSignature !== currentSignature));

  const picked = selectedCompatPartner(compat);
  const circleMembers = buildFamilyCircleMembers(
    self ? { name: self.name, saju: self.saju, occupation: self.occupation } : null,
    picked
      ? [{
          id: picked.id,
          name: picked.profile.name,
          relation: picked.relation,
          occupation: picked.profile.occupation,
          saju: partnerCharts[picked.id] ?? null,
        }]
      : [],
  );

  const hasPartners = compat.partners.length > 0;
  const formOpen = !hasPartners || showForm || editingId !== null;

  const formCard = (
    <>
      <p className="h-sec mt5" data-compat-form>
        {editingId ? "상대 수정" : "상대 추가"}
      </p>
      <form onSubmit={submitPartner} className="card family-member-form">
        <div className="family-identity-fields">
          <label className="family-identity-field">
            <span>이름</span>
            <input className="input" placeholder="예: 민준" value={profile.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <div className="family-identity-field">
            <span>나와의 관계</span>
            {/* 관계는 자유 입력이 아니라 고정 목록 — 이 값이 풀이의 장면(연애/우정/직장)을 결정한다. */}
            <div className="seg" role="group" aria-label="관계 선택">
              {COMPAT_RELATIONS.map((r) => (
                <button key={r} type="button" className={relation === r ? "on" : ""} onClick={() => setRelation(r)}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="family-identity-field mt3">
          <span>직업 (선택)</span>
          <input
            className="input"
            placeholder="예: 개발자"
            value={profile.occupation ?? ""}
            onChange={(e) => set("occupation", e.target.value)}
          />
        </label>
        <div className="mt3">
          <ProfileDatePicker label="생년월일" value={profile.birthDate} onChange={(value) => set("birthDate", value)} required />
        </div>
        <div className="family-date-time-row mt3">
          <ProfileTimePicker label="출생 시각" value={profile.birthTime} onChange={(value) => set("birthTime", value)} disabled={unknownTime} />
          <div className="family-calendar-field">
            <label className="picker-label">달력</label>
            <div className="seg">
              <button type="button" className={profile.calendar === "solar" ? "on" : ""} onClick={() => set("calendar", "solar")}>양력</button>
              <button type="button" className={profile.calendar === "lunar" ? "on" : ""} onClick={() => set("calendar", "lunar")}>음력</button>
            </div>
          </div>
        </div>
        <div className="family-identity-controls mt3">
          <label className="row gap2" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={unknownTime} onChange={(e) => { setUnknownTime(e.target.checked); if (e.target.checked) set("birthTime", ""); }} />
            <span>시각 모름</span>
          </label>
          <div className="family-gender-field">
            <span className="picker-label">성별</span>
            <div className="seg">
              <button type="button" className={profile.gender === "female" ? "on" : ""} onClick={() => set("gender", "female")}>여성</button>
              <button type="button" className={profile.gender === "male" ? "on" : ""} onClick={() => set("gender", "male")}>남성</button>
            </div>
          </div>
        </div>
        <div
          role="note"
          style={{
            marginTop: 12,
            padding: "10px 12px",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--el-earth)",
            borderRadius: "var(--radius-sm)",
            background: "var(--surface-2)",
            color: "var(--text-sub)",
            fontSize: 12.5,
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: "var(--text)" }}>상대 정보 입력 전 안내</strong>
          <br />
          상대의 출생 정보는 민감할 수 있어요. 본인이 입력·보관할 권한이 있는 정보만 넣어 주세요. 궁합 풀이를 만들면 상대 정보와 관계 맥락이 OpenAI에 전송되고, OpenAI가 일시적으로 불가하면 Gemini에 전송될 수 있어요. 공개 링크를 만들면 링크를 아는 누구나 로그인 없이 볼 수 있어요.
        </div>
        {addErr && <p className="error" style={{ marginTop: 10 }}>{addErr}</p>}
        {editingId ? (
          <div className="row gap2 mt4">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>수정 저장</button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>취소</button>
          </div>
        ) : hasPartners ? (
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

  const partnerList = (
    <>
      <p className="h-sec mt5">궁합 볼 상대</p>
      {!hasPartners && <div className="card muted">아직 추가된 상대가 없습니다.</div>}
      {hasPartners && (
        <section className="family-report-selection" aria-label="궁합 상대 선택">
          <div>
            <p>이번 궁합 풀이</p>
            <strong>{picked ? `나 × ${picked.profile.name}` : "상대를 골라줘"}</strong>
          </div>
          <span>2명</span>
          <small>상대는 여러 명 저장해둘 수 있어. 궁합은 한 번에 한 명씩 봐.</small>
        </section>
      )}
      {compat.partners.map((p: CompatPartner) => {
        const isEditing = editingId === p.id;
        const isPicked = picked?.id === p.id;
        return (
          <div
            key={p.id}
            className="card"
            style={{
              marginBottom: 14,
              padding: "14px 16px 18px",
              boxShadow: isEditing ? "inset 0 0 0 1.5px var(--text)" : undefined,
            }}
          >
            <div className="row between">
              <div className="row gap3">
                <span className="el-dot fire" />
                <div>
                  <b style={{ fontSize: 15 }}>{p.profile.name}</b>{" "}
                  <span className="muted" style={{ fontSize: 13 }}>· {p.relation}</span>
                  <div className="muted mono" style={{ fontSize: 12 }}>
                    {p.profile.birthDate} {p.profile.birthTime || "시각 모름"} · {p.profile.calendar === "lunar" ? "음력" : "양력"} · {p.profile.gender === "male" ? "남성" : "여성"}
                    {p.profile.occupation ? ` · ${p.profile.occupation}` : ""}
                  </div>
                </div>
              </div>
              <div className="row gap2">
                <button className="btn btn-ghost btn-sm" onClick={() => (isEditing ? resetForm() : startEdit(p))}>
                  {isEditing ? "편집 중" : "수정"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => removePartner(p.id)}>삭제</button>
              </div>
            </div>
            <label className={`family-member-report-choice${isPicked ? " is-selected" : ""}`}>
              <input
                type="radio"
                name="compat-partner"
                checked={isPicked}
                disabled={generating || savingSelection}
                onChange={() => void selectPartner(p.id)}
              />
              <span>이번 궁합 풀이 상대</span>
            </label>
            {!partnerCharts[p.id] && (
              <p className="muted mt3" style={{ fontSize: 12 }}>사주 계산 실패 — 출생 정보를 확인해주세요.</p>
            )}
          </div>
        );
      })}
      {hasPartners && !formOpen && (
        <button type="button" className="btn btn-ghost btn-block mt3" onClick={openForm}>
          + 다른 상대 추가
        </button>
      )}
    </>
  );

  return (
    <div className="page">
      <div className="report-person-head">
        <h2 className="h-app">궁합</h2>
        <PersonSwitcher nameOnly />
      </div>
      <p className="lead mt2" style={{ fontSize: 14 }}>상대를 넣으면 둘이 어디서 맞물리고 어디서 어긋나는지 풀어줄게.</p>

      {hasPartners ? (
        <>
          {partnerList}
          {formOpen && formCard}
        </>
      ) : (
        <>
          {formCard}
          {partnerList}
        </>
      )}

      {picked && (
        <CompatReportBody
          circleMembers={circleMembers}
          currentYear={currentYear}
          title={reportTitle}
          relation={picked.relation}
        />
      )}

      {!view && (
        <div className="family-report-generate mt5">
          <div>
            <strong>궁합은 한 번에 한 명씩</strong>
            <p>{picked ? `이번에는 너랑 ${picked.profile.name}(${picked.relation})의 궁합을 볼게.` : "궁합을 볼 상대를 먼저 추가해줘."}</p>
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={generating || !picked}>
            {generating ? "생성 중…" : "궁합 풀이 생성"}
          </button>
        </div>
      )}

      {reportBasisStale && (
        <div className="card report-stale mt3">
          <b>상대 정보가 바뀌었어.</b>
          <p>아래 풀이는 이전 입력 기준일 수 있어. 지금 상대로 다시 생성하면 관계 풀이와 액션이 맞춰져.</p>
        </div>
      )}

      {reportErr && <p className="error mt3">{reportErr}</p>}

      {generating ? (
        <GenerateLoading messages={COMPAT_MESSAGES} note="이제 다른 화면을 봐도 돼 — 다 되면 알림으로 콕 찔러줄게. 굳이 여기서 안 기다려도 괜찮아." />
      ) : view ? (
        <>
          {view.generatedAt && (
            <p className="muted" style={{ marginBottom: 8 }}>저장된 풀이 · {new Date(view.generatedAt).toLocaleString("ko-KR")}</p>
          )}
          <ReportView text={view.report} showFamilyActionPlan={false} />
          <ActionPlanRegister actions={view.actions} source="compat" sourceLabel="궁합" />
          <div className="row gap2 mt4">
            <button className="btn btn-ghost btn-sm" onClick={generateReport}>다시 생성</button>
            <ShareButton kind="compat" />
          </div>
        </>
      ) : null}
    </div>
  );
}
