import type { Metadata } from "next";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "이용약관 · SAJULIFE",
  description: "SAJULIFE 베타 서비스 이용약관 초안.",
};

/**
 * 이용약관 — ★베타 기준 초안★.
 * 근거: docs/product/TRUST_AND_PRIVACY.md와 현재 구현 동작(app/tickets, lib/ai, /share).
 * 법률 검토 전이므로 PolicyPage가 상단에 '검토 중' 고지를 단다.
 */
export default function TermsPage() {
  return (
    <PolicyPage
      title="이용약관"
      effectiveDate="확정 전 (베타 초안)"
      intro="SAJULIFE는 사주와 기질 응답을 바탕으로 나를 이해하는 참고 자료를 만들어 주는 서비스예요. 이 약관은 서비스를 쓰는 동안 서로 지킬 것을 정리한 문서입니다."
    >
      <PolicySection title="1. 서비스의 성격">
        <p>
          SAJULIFE가 제공하는 풀이·상담·액션 제안은 <strong>자기 이해와 선택 정리를 돕는 참고 자료</strong>입니다.
          의료·법률·금융·안전에 대한 전문가 판단을 대신하지 않으며, 그런 판단이 필요한 일은 해당 전문가에게 확인해 주세요.
        </p>
      </PolicySection>

      <PolicySection title="2. 계정">
        <ul>
          <li>이메일 계정 또는 게스트 세션으로 서비스를 이용할 수 있어요.</li>
          <li>게스트 데이터는 사용 중인 브라우저 세션에 연결돼 있어, 기기를 바꾸거나 브라우저 데이터를 지우면 복구하지 못할 수 있어요.</li>
          <li>계정 정보와 로그인 수단은 이용자가 관리하며, 타인에게 넘기거나 공유하지 말아주세요.</li>
        </ul>
      </PolicySection>

      <PolicySection title="3. 입력하는 정보">
        <ul>
          <li>본인의 생년월일·출생 시각·성별 등 사주 계산에 필요한 정보를 직접 입력합니다.</li>
          <li>가족·궁합 기능에 다른 사람의 출생 정보를 넣을 때는 <strong>본인이 입력·보관할 권한이 있는 정보만</strong> 넣어 주세요.</li>
          <li>입력한 정보가 사실과 다르면 계산과 풀이도 그만큼 달라집니다.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. 풀이 생성과 외부 전송">
        <p>
          풀이를 만들 때 입력 정보와 계산된 사주표가 AI 제공자에게 전송됩니다. 기본은 OpenAI이며,
          OpenAI가 일시적으로 응답하지 못할 때만 같은 입력이 Gemini로 한 번 더 전송될 수 있어요.
          어떤 데이터가 어디로 가는지는 <a href="/privacy">개인정보 처리방침</a>에 자세히 적어 두었습니다.
        </p>
      </PolicySection>

      <PolicySection title="5. 공개 공유 링크">
        <ul>
          <li>풀이는 이용자가 직접 만들 때에만 공개 링크가 생성됩니다.</li>
          <li><strong>링크를 아는 사람은 로그인 없이 그 풀이를 볼 수 있어요.</strong></li>
          <li>링크는 기본 30일 뒤 만료하며, 이용자가 만료 없음을 고를 수도 있습니다.</li>
          <li>이용자는 언제든 링크를 폐기하거나 새로 발급할 수 있고, 재발급하면 이전 주소는 즉시 무효가 됩니다.</li>
          <li>가족 풀이 공유에는 다른 사람의 출생 정보와 관계 해석이 포함될 수 있어 별도 경고를 보여드립니다.</li>
        </ul>
      </PolicySection>

      <PolicySection title="6. 요금">
        <p>
          현재 베타 기간에는 풀이 이용에 결제가 발생하지 않습니다. 유료 전환 시점과 가격·환불 기준은
          미리 안내한 뒤 적용하며, 자세한 내용은 <a href="/refund">환불 정책</a>에 정리합니다.
        </p>
      </PolicySection>

      <PolicySection title="7. 하지 말아야 할 것">
        <ul>
          <li>서비스나 다른 이용자에게 피해를 주는 자동화·과도한 요청.</li>
          <li>권한 없는 타인의 개인정보 입력.</li>
          <li>풀이 내용을 타인을 비방하거나 차별하는 근거로 쓰는 일.</li>
        </ul>
      </PolicySection>

      <PolicySection title="8. 서비스 변경과 중단">
        <p>
          베타 기간에는 기능·화면·풀이 구성이 자주 바뀔 수 있어요. 서비스 전체를 중단해야 할 때는
          미리 공지하고, 이용자가 저장한 데이터를 내려받거나 삭제할 수 있는 방법을 함께 안내할게요.
        </p>
      </PolicySection>

      <PolicySection title="9. 책임의 한계">
        <p>
          풀이는 참고 자료이며, 그 내용을 바탕으로 한 이용자의 결정과 결과에 대해 서비스가 법적 책임을 지지 않습니다.
          다만 서비스의 고의나 중대한 과실로 생긴 손해는 이 조항으로 면책되지 않습니다.
        </p>
      </PolicySection>

      <PolicySection title="10. 약관 변경">
        <p>
          약관이 바뀌면 적용일과 함께 이 페이지에 올리고, 중요한 변경은 서비스 화면으로 따로 알려드릴게요.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
