// 실데이터(data/guests/g_2314ce25) 기준 yongsin-saju 프롬프트 렌더 — AI 호출 0.
// app/api/saju/yongsin/route.ts의 runYongsinGeneration 렌더부와 동일.
// 사용: tsx scripts/eval/render-real-yongsin.ts <출력경로.txt>
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { calculateCurrentAge, getNowVars } from "../../lib/datetime";
import { DEFAULT_PROMPTS } from "../../lib/prompts/defaults";
import { renderTemplate } from "../../lib/prompts/render";
import { currentConcernLabel, occupationLabel, profileContextForPrompt } from "../../lib/profile/context";
import { calculateSaju } from "../../lib/saju/calculator";
import { buildYongsinView, formatYongsinReadingForPrompt } from "../../lib/saju/yongsinView";
import type { SajuProfile } from "../../lib/store/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUEST = join(__dirname, "..", "..", "data", "guests", "g_2314ce25");

function main() {
  const outPath = process.argv[2];
  if (!outPath) {
    console.error("사용: tsx scripts/eval/render-real-yongsin.ts <출력경로.txt>");
    process.exit(1);
  }
  const profile: SajuProfile = JSON.parse(readFileSync(join(GUEST, "profile.json"), "utf8"));
  const saju = calculateSaju(profile);
  const nowVars = getNowVars();
  const currentAge = calculateCurrentAge(profile.birthDate, nowVars.today);
  const view = buildYongsinView(saju, currentAge, Number(nowVars.currentYear));

  const rendered = renderTemplate(DEFAULT_PROMPTS["yongsin-saju"].template, {
    name: profile.name,
    gender: profile.gender === "male" ? "남성" : "여성",
    currentAge: String(currentAge),
    occupation: occupationLabel(profile),
    profileContext: profileContextForPrompt(profile),
    currentConcern: currentConcernLabel(profile),
    yongsinFacts: formatYongsinReadingForPrompt(view),
    ...nowVars,
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, rendered);
  console.log(`렌더 완료: ${rendered.length}자 → ${outPath}`);
  console.log(
    `${profile.name}(${currentAge}세, ${profile.birthTime || "시각 모름"}) · 일간 ${view.ilgan.ko}·세기 ${view.body}`,
  );
  console.log(
    `보약(종합): ${view.primaryYong.join("·") || "—"} / 보조: ${view.helperYong.join("·") || "—"} / 과부하: ${view.gisin.join("·") || "—"}`,
  );
  console.log(`격국 ${view.gyeokguk.name} · 억부 ${view.body} · 조후 ${view.johu.hanYeolLabel}`);
  console.log(`기준일 ${nowVars.today} / 프롬프트 v${DEFAULT_PROMPTS["yongsin-saju"].version}`);
}

main();
