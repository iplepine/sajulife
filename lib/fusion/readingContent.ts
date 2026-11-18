/** Hide only known standalone introductions in old saved reports. Never rewrite storage. */
const STANDALONE_HEADINGS = new Set([
  "원래의 너: 사주로 타고난 결",
  "요즘의 너: 기질 검사로 본 지금 상태",
]);

export function integratedReadingContent(text: string): string {
  const blocks = text.split(/(?=^\s*▣\s*)/m);
  const kept = blocks.filter(block => {
    const heading = block.match(/^\s*▣\s*([^\n\r]+)/)?.[1].trim();
    return !heading || !STANDALONE_HEADINGS.has(heading);
  });
  // An unrecognized or introduction-only document must remain readable.
  return kept.some(block => /^\s*▣\s*/m.test(block)) ? kept.join("") : text;
}
