"use client";

import { useEffect, useState } from "react";
import type { PromptConfig, PromptKey } from "@/lib/store/types";

type Props = {
  promptKey: PromptKey;
  title: string;
  variables: string[];
};

type AiInfo = { provider: string; model: string; hasKey: boolean };

export default function PromptDebugPanel({ promptKey, title, variables }: Props) {
  const [prompt, setPrompt] = useState<PromptConfig | null>(null);
  const [draft, setDraft] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiInfo, setAiInfo] = useState<AiInfo | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptKey]);

  useEffect(() => {
    fetch("/api/ai-info").then((r) => r.json()).then(setAiInfo);
  }, []);

  async function load() {
    const res = await fetch(`/api/prompts/${promptKey}`);
    const data = await res.json();
    setPrompt(data.prompt);
    setDraft(data.prompt.template);
    setTemperature(data.prompt.temperature);
  }

  async function save() {
    setLoading(true);
    setStatus(null);
    const res = await fetch(`/api/prompts/${promptKey}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: draft, temperature }),
    });
    setLoading(false);
    if (!res.ok) {
      setStatus("저장 실패");
      return;
    }
    setStatus("저장됨 (KV에 영속)");
    void load();
  }

  async function reset() {
    if (!confirm("이 프롬프트를 기본값으로 되돌릴까요?")) return;
    setLoading(true);
    await fetch(`/api/prompts/${promptKey}`, { method: "DELETE" });
    setLoading(false);
    setStatus("기본값으로 리셋됨");
    void load();
  }

  return (
    <section className="card stack" style={{ marginTop: 16 }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div className="muted" style={{ fontSize: 13 }}>
          {aiInfo
            ? <>현재 모델: <code>{aiInfo.provider}/{aiInfo.model}</code>{!aiInfo.hasKey && <span className="error" style={{ marginLeft: 8 }}>· API 키 없음</span>}</>
            : "모델 정보 불러오는 중..."}
        </div>
      </div>
      <div className="muted">
        수정 후 저장하면 Upstash KV의 <code>prompts</code> 키에 즉시 반영되며, 앱 재시작 후에도 유지됩니다.
        모델은 <code>.env.local</code>의 <code>GEMINI_MODEL</code> 환경변수로 바꾸고 dev 서버 재시작.
      </div>
      <div className="muted">
        사용 가능한 변수: {variables.map((v) => <code key={v} style={{ marginRight: 8 }}>{`{{${v}}}`}</code>)}
      </div>

      <label><span>템플릿</span>
        <textarea
          rows={18}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ width: "100%" }}
        />
      </label>

      <label><span>Temperature: {temperature.toFixed(2)}</span>
        <input
          type="range" min={0} max={1} step={0.05}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </label>

      <div className="row">
        <button className="btn--primary" onClick={save} disabled={loading}>저장</button>
        <button className="btn--ghost" onClick={reset} disabled={loading}>기본값 리셋</button>
        {status && <span className="muted">{status}</span>}
      </div>

      {prompt && (
        <div className="muted">마지막 갱신: {new Date(prompt.updatedAt).toLocaleString()}</div>
      )}
    </section>
  );
}
