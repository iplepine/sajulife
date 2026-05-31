import AdminOnly from "@/components/AdminOnly";
import PromptDebugPanel from "@/components/PromptDebugPanel";

export default function FamilySajuDebugPage() {
  return (
    <AdminOnly>
      <main className="container container--wide">
        <h1>가족 사주 — 프롬프트 디버그</h1>
        <PromptDebugPanel
          promptKey="family-saju"
          title="family-saju"
          variables={["today", "currentYear", "currentMonth", "name", "birthDate", "birthTime", "gender", "calendar", "sajuTable", "dayMaster", "familyTable"]}
        />
      </main>
    </AdminOnly>
  );
}
