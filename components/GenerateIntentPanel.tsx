"use client";

/**
 * 생성 시작 패널 — ★풀이는 사용자가 누를 때 만들어진다.★
 *
 * ★왜 있는가★ — 예전엔 결과 화면(/tci/report, /fusion)에 ★들어가기만 해도★ 자동으로
 * 생성이 시작됐다. 화면을 구경하러 들어온 사람도, 저장본을 보러 온 사람도 새 생성이 돌았다.
 * 생성은 시간이 걸리고 비용이 들고 외부 제공자에 데이터를 보낸다 — 사용자가 모르는 채로
 * 일어나서는 안 되는 일이다.
 *
 * 앞 화면에서 이미 "만들기"를 명시적으로 눌렀다면 여기서 같은 의사를 두 번 묻지 않는다
 * (호출부가 주소의 generate 표시를 보고 한 번만 자동 시작한다).
 *
 * ★고정 소요 시간이나 무료 약속을 여기에 적지 않는다★ — 근거 없는 약속이 된다.
 */
export default function GenerateIntentPanel({
  title,
  lead,
  inputs,
  cta,
  onGenerate,
  busy,
  disabled,
  disabledNote,
}: {
  title: string;
  lead: string;
  /** 이 생성에 실제로 쓰이는 입력 — 사용자가 무엇이 나가는지 알 수 있게 나열한다. */
  inputs: string[];
  cta: string;
  onGenerate: () => void;
  busy: boolean;
  disabled?: boolean;
  disabledNote?: string;
}) {
  return (
    <section className="gen-intent card mt5" aria-label="풀이 만들기">
      <p className="gen-intent-title">{title}</p>
      <p className="gen-intent-lead">{lead}</p>

      <p className="gen-intent-h">이번 풀이에 쓰는 것</p>
      <ul className="gen-intent-list">
        {inputs.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <p className="gen-intent-note">
        풀이를 만들면 위 내용이 OpenAI로 전송되고, OpenAI가 일시적으로 불가하면 Gemini로 전송될 수 있어.
        자세한 건 <a href="/privacy">개인정보 처리방침</a>에 적어뒀어.
      </p>

      <button
        type="button"
        className="btn btn-primary btn-block mt4"
        onClick={onGenerate}
        disabled={busy || disabled}
      >
        {busy ? "시작하는 중…" : cta}
      </button>
      {disabled && disabledNote && <p className="gen-intent-note mt3">{disabledNote}</p>}
    </section>
  );
}
