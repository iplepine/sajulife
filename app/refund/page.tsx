import type { Metadata } from "next";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "환불 정책 · SAJULIFE",
  description: "베타 기간의 요금·환불 기준 초안.",
};

/**
 * 환불 정책 — ★베타 기준 초안★.
 * ★지금 사실만 적는다★: 베타는 무료다(app/tickets/page.tsx). 아직 없는 유료 정책의
 * 구체 기준(기간·비율·수단)을 지어내지 않는다. 확정은 운영 담당자 승인 사항이다.
 */
export default function RefundPage() {
  return (
    <PolicyPage
      title="환불 정책"
      effectiveDate="확정 전 (베타 초안)"
      intro="지금 무엇이 유료이고 무엇이 아닌지부터 분명히 해둘게요. 결제가 시작되기 전에는 환불할 거래 자체가 없습니다."
    >
      <PolicySection title="1. 베타 기간의 요금">
        <p>
          현재 베타 기간에는 풀이 이용에 <strong>결제가 발생하지 않습니다.</strong>
          티켓을 사거나 차감하지 않으며, 결제 수단을 등록받지도 않아요.
        </p>
      </PolicySection>

      <PolicySection title="2. 그래서 지금 환불은">
        <p>
          결제가 없으므로 환불 대상 거래도 없습니다. 결제가 된 것처럼 보이는 화면이나 청구를 발견하면
          바로 <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 알려주세요. 확인 후 조치해 드릴게요.
        </p>
      </PolicySection>

      <PolicySection title="3. 유료 전환 시">
        <ul>
          <li>가격, 결제 수단, 환불 기준을 <strong>결제를 받기 전에</strong> 이 페이지와 서비스 화면에 먼저 공지합니다.</li>
          <li>기준은 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 맞춰 정합니다.</li>
          <li>공지 없이 소급해서 적용하지 않습니다.</li>
        </ul>
        <p className="policy-pending">
          구체적인 환불 기간·비율·처리 절차는 아직 확정되지 않았어요. 확정되면 이 조항을 실제 기준으로 바꾸고
          적용일을 적을게요.
        </p>
      </PolicySection>

      <PolicySection title="4. 문의">
        <p>
          요금이나 환불에 대해 물어볼 게 있으면 <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 보내주세요.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
