import PromptDebugPanel from "@/components/PromptDebugPanel";

export default function PersonalSajuDebugPage() {
  return (
    <main className="container container--wide">
      <h1>개인 사주 — 프롬프트 디버그</h1>
      <PromptDebugPanel
        promptKey="personal-saju"
        title="personal-saju"
        variables={["today", "currentYear", "currentMonth", "name", "birthDate", "birthTime", "gender", "calendar", "note", "sajuTable", "dayMaster", "shengXiao", "dayPillar"]}
      />
    </main>
  );
}
