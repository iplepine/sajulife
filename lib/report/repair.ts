// JSON 리포트 자가교정 프롬프트 — 품질 검증 실패 시 같은 스키마로 1회 다시 뽑게 한다.
// 융합(텍스트)의 buildFusionRepairPrompt와 대칭. JSON 리포트(개인·가족·기질)용.

export function buildStructuredRepairPrompt(basePrompt: string, errors: string[]): string {
  const list = errors.map((e) => `- ${e}`).join("\n");
  return `${basePrompt}

[재생성 지시 — 이전 출력 품질 검증 실패]
아래 문제를 모두 고친 최종본만 ★같은 JSON 스키마 그대로★ 다시 출력해라.
사과·설명·코드블록·마크다운 없이 JSON만 출력한다. 각 섹션 본문을 빈 채로 두지 말고 충분히 채워라.
${list}`;
}
