import AdminOnly from "@/components/AdminOnly";
import PromptDebugPanel from "@/components/PromptDebugPanel";

export default function ConsultDebugPage() {
  return (
    <AdminOnly>
      <main className="container container--wide">
        <h1>상담하기 — 프롬프트 디버그</h1>
        <PromptDebugPanel
          promptKey="consult"
          title="consult"
          variables={[
            "today",
            "currentYear",
            "currentMonth",
            "name",
            "gender",
            "birthDate",
            "birthTime",
            "calendar",
            "profileContext",
            "basisLabel",
            "contextBlock",
            "question",
          ]}
        />
      </main>
    </AdminOnly>
  );
}
