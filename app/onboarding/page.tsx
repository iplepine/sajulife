"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CHILDREN_STATUS_LABELS,
  RELATIONSHIP_STATUS_LABELS,
} from "@/lib/profile/context";
import { ProfileDatePicker, ProfileTimePicker } from "@/components/ProfileDateTimePicker";
import type { ChildrenStatus, RelationshipStatus, SajuProfile } from "@/lib/store/types";

const EMPTY: SajuProfile = {
  name: "",
  birthDate: "",
  birthTime: "",
  gender: "female",
  calendar: "solar",
  occupation: "",
  currentConcern: "",
  note: "",
};

const RELATIONSHIP_OPTIONS = Object.entries(RELATIONSHIP_STATUS_LABELS) as Array<[RelationshipStatus, string]>;
const CHILDREN_OPTIONS = Object.entries(CHILDREN_STATUS_LABELS) as Array<[ChildrenStatus, string]>;

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SajuProfile>(EMPTY);
  const [unknownTime, setUnknownTime] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNextPath(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setHasExistingProfile(true);
          setProfile({
            ...EMPTY,
            ...d.profile,
            currentConcern: d.profile.currentConcern ?? d.profile.note ?? "",
          });
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
    if (!profile.birthDate) {
      setError("생년월일을 선택하세요.");
      return;
    }
    if (!unknownTime && !profile.birthTime) {
      setError("출생 시각을 입력하거나 '시각 모름'을 선택하세요.");
      return;
    }
    setLoading(true);
    setError(null);
    const payload = {
      ...profile,
      birthTime: unknownTime ? "" : profile.birthTime,
      occupation: profile.occupation?.trim() || undefined,
      currentConcern: profile.currentConcern?.trim() || undefined,
      note: profile.currentConcern?.trim() || undefined,
    };
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
    router.push(nextPath);
  }

  return (
    <div className="page-narrow">
      <h1 className="h-app">{hasExistingProfile ? "사주 정보 수정" : "사주 정보를 알려주세요"}</h1>
      <p className="lead mt2" style={{ fontSize: 14 }}>
        정확한 출생 정보일수록 풀이가 또렷해집니다. 언제든 다시 수정할 수 있어요.
      </p>

      <form onSubmit={handleSave} className="card mt5">
        <div className="field">
          <label>이름 또는 별명</label>
          <input className="input" value={profile.name} onChange={(e) => set("name", e.target.value)} required placeholder="예: 김서연" />
        </div>

        <ProfileDatePicker
          label="생년월일"
          value={profile.birthDate}
          onChange={(value) => set("birthDate", value)}
          required
        />

        <div className="field">
          <label>달력</label>
          <div className="seg">
            <button type="button" className={profile.calendar === "solar" ? "on" : ""} onClick={() => set("calendar", "solar")}>양력</button>
            <button type="button" className={profile.calendar === "lunar" ? "on" : ""} onClick={() => set("calendar", "lunar")}>음력</button>
          </div>
        </div>

        <div className="field">
          <ProfileTimePicker
            label="출생 시각"
            value={profile.birthTime}
            onChange={(value) => set("birthTime", value)}
            disabled={unknownTime}
          />
          <label className="row gap2" style={{ marginTop: 10, fontWeight: 400 }}>
            <input type="checkbox" checked={unknownTime} onChange={(e) => toggleUnknownTime(e.target.checked)} />
            <span>시각 모름 (연·월·일주만으로 풀이)</span>
          </label>
        </div>

        <div className="field">
          <label>성별</label>
          <div className="seg">
            <button type="button" className={profile.gender === "female" ? "on" : ""} onClick={() => set("gender", "female")}>여성</button>
            <button type="button" className={profile.gender === "male" ? "on" : ""} onClick={() => set("gender", "male")}>남성</button>
          </div>
        </div>

        <div className="field">
          <label>직업 (선택)</label>
          <input
            className="input"
            value={profile.occupation ?? ""}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="예: 학생, 직장인, 프리랜서, 사업, 육아 중"
          />
        </div>

        <div className="field">
          <label>관계 상태 (선택)</label>
          <select
            className="input"
            value={profile.relationshipStatus ?? ""}
            onChange={(e) => set("relationshipStatus", (e.target.value || undefined) as SajuProfile["relationshipStatus"])}
          >
            <option value="">선택 안 함</option>
            {RELATIONSHIP_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>자녀 여부 (선택)</label>
          <select
            className="input"
            value={profile.childrenStatus ?? ""}
            onChange={(e) => set("childrenStatus", (e.target.value || undefined) as SajuProfile["childrenStatus"])}
          >
            <option value="">선택 안 함</option>
            {CHILDREN_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>현재 관심/고민 (선택)</label>
          <textarea
            className="input"
            rows={3}
            value={profile.currentConcern ?? ""}
            onChange={(e) => set("currentConcern", e.target.value)}
            placeholder="예: 이직을 고민 중, 돈 관리가 걱정됨, 관계 패턴이 궁금함"
          />
        </div>

        {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}
        <button type="submit" className="btn btn-primary btn-block mt5" disabled={loading}>
          {loading ? "저장 중…" : hasExistingProfile ? "저장하고 돌아가기" : "저장하고 시작"}
        </button>
      </form>
    </div>
  );
}

function safeNextPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/auth/") || value.startsWith("/api/")) return "/dashboard";
  return value;
}
