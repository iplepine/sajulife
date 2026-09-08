import type { Metadata } from "next";
import PolicyPage, { PolicySection } from "@/components/PolicyPage";

export const metadata: Metadata = {
  title: "개인정보 처리방침 · SAJULIFE",
  description: "SAJULIFE가 어떤 정보를 받아 어디에 저장하고 어디로 보내는지 정리한 초안.",
};

/**
 * 개인정보 처리방침 — ★베타 기준 초안★.
 * 근거: docs/product/TRUST_AND_PRIVACY.md의 '다루는 데이터 / 저장 위치 / LLM 전송 범위 / 공개 공유 정책'.
 * ★여기 적은 항목과 실제 구현이 어긋나면 문서가 아니라 구현을 먼저 확인한다.★
 */
export default function PrivacyPage() {
  return (
    <PolicyPage
      title="개인정보 처리방침"
      effectiveDate="확정 전 (베타 초안)"
      intro="어떤 정보를 받고, 어디에 두고, 어디로 보내는지 실제 동작 그대로 적었어요. 읽고 나면 '내 생년월일이 어디까지 가는지'를 알 수 있게 쓰는 걸 목표로 합니다."
    >
      <PolicySection title="1. 받는 정보">
        <ul>
          <li>계정 식별자와 이메일 주소.</li>
          <li>이름 또는 별명.</li>
          <li>생년월일, 출생 시각, 양력·음력 구분, 성별.</li>
          <li>직접 남긴 메모와 상담 질문.</li>
          <li>기질 설문 응답과 채점 결과.</li>
          <li>가족·궁합 기능에 입력한 상대의 이름, 관계, 생년월일, 출생 시각, 양력·음력 구분, 성별.</li>
          <li>생성된 풀이 본문, 상담 답변, 저장한 실천 액션.</li>
          <li>공개 공유 링크를 만들었다면 그 시점의 풀이 스냅샷.</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. 쓰는 목적">
        <ul>
          <li>사주 계산과 풀이·상담 생성.</li>
          <li>저장한 풀이·액션·상담을 다시 보여주기.</li>
          <li>중복 생성 방지와 이용량 제한 등 서비스 보호.</li>
        </ul>
        <p>광고 목적의 프로파일링이나 제3자 판매에는 쓰지 않습니다.</p>
      </PolicySection>

      <PolicySection title="3. 저장하는 곳">
        <ul>
          <li>로그인 세션과 이메일 계정: Supabase Auth.</li>
          <li>프로필·풀이·상담·액션 등 서비스 데이터: Upstash Redis 저장소.</li>
          <li>공개 공유 링크: 발급·만료·폐기 시각과 함께 별도 키에 보관.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. 외부로 보내는 범위">
        <p>
          풀이를 만들 때 아래 정보가 AI 제공자에게 전송됩니다. 기본은 OpenAI이며, OpenAI가
          일시적으로 응답하지 못하는 경우(시간 초과·과부하·서버 오류)에만 같은 입력이 Gemini로 한 번 전송될 수 있어요.
          잘못된 요청이나 안전 정책에 따른 거절은 다시 보내지 않습니다.
        </p>
        <ul>
          <li>개인 사주 풀이: 프로필, 계산된 사주표, 흐름·기운 수치, 메모.</li>
          <li>기질 풀이: 이름, 성별, 기질 설문 점수.</li>
          <li>사주+기질 융합 풀이: 프로필, 계산된 사주표, 기질 점수.</li>
          <li>가족·궁합 풀이: 본인과 선택한 상대의 프로필·사주표·관계 맥락.</li>
          <li>상담: 질문과 저장된 풀이 요약.</li>
        </ul>
        <p>
          AI 요청에는 원래 계정 식별자 대신 해시된 값만 함께 보내고, 제공자 쪽 대화 저장 옵션은 꺼서 요청합니다.
        </p>
      </PolicySection>

      <PolicySection title="5. 공개 공유 링크">
        <p>
          공유 링크는 이용자가 직접 만들 때만 생깁니다. <strong>링크를 아는 사람은 로그인 없이 볼 수 있고</strong>,
          기본 30일 뒤 만료합니다. 언제든 폐기하거나 새로 발급할 수 있으며, 재발급하면 이전 주소는 즉시 무효가 됩니다.
        </p>
      </PolicySection>

      <PolicySection title="6. 보관 기간">
        <ul>
          <li>계정이 살아 있는 동안 서비스 데이터를 보관합니다.</li>
          <li>이용자가 인물·가족·풀이를 지우면 해당 데이터도 함께 지웁니다.</li>
          <li>만료·폐기된 공유 스냅샷은 없는 링크와 똑같이 처리합니다.</li>
        </ul>
      </PolicySection>

      <PolicySection title="7. 내 정보에 대해 할 수 있는 것">
        <ul>
          <li>입력한 프로필과 가족 정보를 화면에서 직접 수정·삭제할 수 있어요.</li>
          <li>공유 링크는 만든 화면에서 바로 폐기할 수 있어요.</li>
          <li>계정 전체 삭제나 사본 요청은 <a href="mailto:hello@sajulife.kr">hello@sajulife.kr</a>로 알려주시면 처리해 드릴게요.</li>
        </ul>
      </PolicySection>

      <PolicySection title="8. 민감한 정보에 대한 부탁">
        <p>
          가족·궁합 기능에는 다른 사람의 출생 정보가 들어갑니다. 본인이 입력·보관할 권한이 있는 정보만 넣어 주세요.
          당사자가 원하지 않으면 해당 인물을 삭제하고, 관련 공유 링크도 함께 폐기해 주세요.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
