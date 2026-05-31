import AdminOnly from "@/components/AdminOnly";
import PromptDebugPanel from "@/components/PromptDebugPanel";

export default function TciDebugPage() {
  return (
    <AdminOnly>
      <main className="container container--wide">
        <h1>기질 리포트 — 프롬프트 디버그</h1>
        <PromptDebugPanel
          promptKey="tci-report"
          title="tci-report"
          variables={["today", "currentYear", "currentMonth", "name", "gender", "tciScores"]}
        />
      </main>
    </AdminOnly>
  );
}
