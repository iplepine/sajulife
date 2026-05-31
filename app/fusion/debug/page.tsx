import AdminOnly from "@/components/AdminOnly";
import PromptDebugPanel from "@/components/PromptDebugPanel";

export default function FusionDebugPage() {
  return (
    <AdminOnly>
      <main className="container container--wide">
        <h1>기질+사주 통합 — 프롬프트 디버그</h1>
        <PromptDebugPanel
          promptKey="tci-saju-fusion"
          title="tci-saju-fusion"
          variables={["today", "currentYear", "currentMonth", "name", "birthDate", "birthTime", "gender", "calendar", "sajuTable", "dayMaster", "shengXiao", "tciScores"]}
        />
      </main>
    </AdminOnly>
  );
}
