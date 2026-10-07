import type { Metadata } from "next";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";
import { formatWon, SAJU_TCI_PACKAGE } from "@/lib/package/product";

export const metadata: Metadata = {
  title: "환불 정책 · SAJULIFE",
  description: "사주+기질 풀이의 요금과 환불 기준.",
};

/**
 * 환불 정책 — 2026-10-08 대표 결정 기준(풀이 생성 전 전액 환불).
 * 금액은 상품 정의(lib/package/product.ts) 한 곳에서 가져온다 — 결제 화면과 다른 값을 적지 않는다.
 * ★운영 결제 시작 전 법무 확인이 남아 있다★ — 확인 후 적용일을 확정한다.
 */
export default function RefundPage() {
  const price = formatWon(SAJU_TCI_PACKAGE.price);
  return (
    <PolicyPage
      title="환불 정책"
      effectiveDate="유료 결제 시작일부터 적용 (2026-10-08 초안)"
      intro="결제 전에 무엇을 사는지, 언제 환불되는지부터 분명히 해둘게요."
    >
      <PolicySection title="1. 요금">
        <ul>
          <li>
            <strong>사주+기질 풀이 {price}</strong> — 선택한 인물 한 명 기준으로 한 번 결제해요.
            사주 풀이, 기질 검사, 사주와 기질을 겹친 올해 운세가 들어 있어요.
          </li>
          <li>그 밖의 풀이(용신·가족·궁합·상담 등)는 베타 기간 동안 결제 없이 이용할 수 있어요.</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. 환불 기준">
        <ul>
          <li>
            <strong>첫 풀이가 만들어지기 전</strong>이라면 전액 환불해 드려요. 기질 검사에 답만 한 상태는
            풀이를 받은 것으로 보지 않아요.
          </li>
          <li>
            <strong>첫 풀이(사주 풀이 또는 올해 운세)가 만들어진 뒤</strong>에는 디지털 콘텐츠 제공이 시작된 것이라,
            전자상거래 등에서의 소비자보호에 관한 법률 제17조 제2항에 따라 청약철회가 제한돼요. 이 내용은 결제 화면에서 먼저 안내합니다.
          </li>
          <li>
            다만 <strong>생성 오류</strong>로 풀이가 만들어지지 않거나 내용이 깨져 정상적으로 볼 수 없다면,
            풀이를 만든 뒤라도 환불해 드려요.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="3. 환불 받는 방법">
        <p>
          <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 결제한 날짜와 계정 이메일(가입 전이라면 결제한 시각)을
          보내주세요. 확인 후 3영업일 안에 결제를 취소해 드려요. 카드사 사정에 따라 반영까지 시간이 더 걸릴 수 있어요.
        </p>
      </PolicySection>

      <PolicySection title="4. 문의">
        <p>
          요금이나 환불에 대해 물어볼 게 있으면 <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 보내주세요.
        </p>
        <p className="policy-pending">
          이 기준은 운영 결제를 시작하기 전에 법무 확인을 거쳐 적용일을 확정해요.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
