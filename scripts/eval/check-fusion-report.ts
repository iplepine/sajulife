// 생성된 융합 *리포트*(프롬프트 아님)에 서버 품질 게이트를 그대로 돌린다 — AI 호출 0.
// 운영 라우트(app/api/fusion/report/route.ts)와 동일한 parseFusionReportOutput을 써서
// FLEX/ACTIONS 트레일러 분리 + validateFusionReportQuality를 재현한다.
//
// 사용:
//   npx tsx scripts/eval/check-fusion-report.ts <리포트.txt> [<리포트2.txt> ...]
//   (인자 없으면 scripts/eval/out/reports/*-fusion*.txt 전부)
//
// 출력: 파일별 공백제외 글자수 · FLEX · ACTIONS 요약 · errors/warnings · PASS/FAIL.
// 위생/저장가능성 축을 LLM 판단이 아니라 코드로 정량화하는 용도.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFusionReportOutput } from "../../lib/fusion/reportOutput";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORTS = join(__dirname, "out", "reports");

function targetFiles(): string[] {
  const args = process.argv.slice(2).filter((a) => a.endsWith(".txt"));
  if (args.length > 0) return args.map((a) => (a.startsWith("/") ? a : join(process.cwd(), a)));
  if (!existsSync(REPORTS)) return [];
  return readdirSync(REPORTS)
    .filter((f) => f.includes("fusion") && f.endsWith(".txt"))
    .sort()
    .map((f) => join(REPORTS, f));
}

function compact(text: string): number {
  return text.replace(/\s/g, "").length;
}

function main() {
  const files = targetFiles();
  if (files.length === 0) {
    console.error("검사할 리포트가 없습니다. 경로를 주거나 out/reports/*-fusion*.txt 를 두세요.");
    process.exit(1);
  }

  let failed = 0;
  const summary: Array<{ file: string; ok: boolean; chars: number; errs: number }> = [];

  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    const parsed = parseFusionReportOutput(raw);
    const chars = compact(parsed.report);
    const ok = parsed.errors.length === 0;
    if (!ok) failed += 1;
    summary.push({ file: basename(file), ok, chars, errs: parsed.errors.length });

    const cats = parsed.actions.map((a) => a.category).filter(Boolean);
    const tfs = parsed.actions.map((a) => a.timeframe).filter(Boolean);
    console.log(`\n${ok ? "✅ PASS" : "❌ FAIL"}  ${basename(file)}`);
    console.log(`  본문 공백제외: ${chars}자 (기준 8000~10000)`);
    console.log(`  FLEX: ${parsed.flexibility ?? "없음"}`);
    console.log(`  ACTIONS: ${parsed.actions.length}개 · category[${cats.join(", ")}] · timeframe[${tfs.join(", ")}]`);
    if (parsed.warnings.length) for (const w of parsed.warnings) console.log(`  ⚠️  ${w}`);
    if (parsed.errors.length) for (const e of parsed.errors) console.log(`  ⛔ ${e}`);
  }

  console.log("\n──────── 요약 ────────");
  for (const s of summary) {
    console.log(`  ${s.ok ? "✅" : "❌"} ${s.file.padEnd(28)} ${String(s.chars).padStart(6)}자  오류 ${s.errs}`);
  }
  console.log(`\n저장가능성 게이트: ${summary.length - failed}/${summary.length} 통과`);
  if (failed > 0) process.exit(1);
}

main();
