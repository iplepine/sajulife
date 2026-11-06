import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PROMPTS } from "../prompts/defaults";
import { parsePersonalReport } from "../report/types";
import { parseNewTciReport, TCI_REPORT_SECTION_IDS } from "./reportContract";
import { TCI_REPORT_SCHEMA } from "./reportSchema";

test("temperament prompt, schema and new-report validation agree on the eight sections", () => {
  const headings = [...DEFAULT_PROMPTS["tci-report"].template.matchAll(/^▣ \[(.+?)\]/gm)].map(match => match[1]);
  assert.deepEqual(headings, [...TCI_REPORT_SECTION_IDS]);
  assert.deepEqual(TCI_REPORT_SCHEMA.properties?.sections.items?.properties?.id.enum, headings);

  const sections = headings.map(id => ({ id, summary: `${id}에서 읽은 요약`, body: `${id}을 읽은 본문이야.` }));
  const serialize = (items: typeof sections) => JSON.stringify({ title: "기질 풀이", sections: items, roadmap: {} });
  assert.ok(parseNewTciReport(serialize(sections)));
  assert.equal(parseNewTciReport(serialize(sections.slice(1))), null);
  assert.equal(parseNewTciReport(serialize([...sections.slice(0, -1), sections[0]])), null);
  const empty = serialize(sections.map((section, index) => index === 2 ? { ...section, body: "" } : section));
  assert.equal(parseNewTciReport(empty), null);
  assert.ok(parsePersonalReport(empty));
});
