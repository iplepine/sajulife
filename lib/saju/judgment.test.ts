import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaju } from "./calculator";
import { computeGyeokguk } from "./gyeokguk";
import { computeJohu } from "./johu";
import { computeYongsin } from "./yongsin";
import { buildYongsinView } from "./yongsinView";
import type { SajuProfile } from "../store/types";

/**
 * 억부·조후·격국 판정 고정 — 2026-10-25 점검.
 * 기준 케이스는 전문가 견본(엑셀 '개선점 정리')의 명식 甲午 丙寅 己未 丁卯(대운 순행)다.
 * 견본 판정: 조후 "火기가 치열하고 水기가 없어 뜨거움이 지배적 — 金운에 편함",
 *           격국 "월지 寅의 지장간 투출 — 정관(용인)", 억부 "木火土 기세가 다 강해 金이 필요".
 * 나머지는 실제 생년월일로 찾은 경계 케이스다. 모두 계산만 한다(AI 호출 없음).
 */

function chart(birthDate: string, birthTime: string, gender: SajuProfile["gender"] = "female") {
  return calculateSaju({ name: "테스트", birthDate, birthTime, gender, calendar: "solar" });
}

function pillarsOf(s: ReturnType<typeof chart>) {
  const p = s.pillars;
  return [p.year, p.month, p.day, p.time!].map((x) => x.gan.hanja + x.zhi.hanja).join(" ");
}

test("전문가 견본 사주(甲午 丙寅 己未 丁卯) — 조후·격국·억부가 견본 판정과 같은 쪽을 가리킨다", () => {
  const s = chart("1954-03-04", "06:30", "male");
  assert.equal(pillarsOf(s), "甲午 丙寅 己未 丁卯");

  const johu = computeJohu(s);
  assert.equal(johu.urgency, "급함", "봄생이라도 불이 몰린 사주는 식힐 물이 급하다");
  assert.deepEqual(johu.johu, ["수", "금"]);

  const eokbu = computeYongsin(s);
  assert.equal(eokbu.body, "신강", "지장간(寅 속 丙, 午·未 속 己)까지 세면 일간이 받쳐진다");
  assert.deepEqual([...eokbu.yongsin].sort(), ["금", "수"].sort());
  assert.ok(!eokbu.yongsin.includes("목"), "인성이 넘쳐 센 사주에 관(목)은 인성을 더 키운다");

  assert.equal(computeGyeokguk(s, eokbu.body).name, "정관격");

  const view = buildYongsinView(s, undefined, 2026);
  assert.deepEqual(view.primaryYong, ["금", "수"]);
  assert.deepEqual([...view.gisin].sort(), ["토", "화"].sort());
});

test("봄생인데 열이 찬 사주는 식힐 물을 곁들인다(예전엔 '온도 무난')", () => {
  const s = chart("1960-03-30", "12:30");
  assert.equal(pillarsOf(s), "庚子 己卯 丁巳 丙午");
  const johu = computeJohu(s);
  assert.equal(johu.season, "봄");
  assert.equal(johu.urgency, "도움");
  assert.deepEqual(johu.johu, ["수"]);
});

test("겨울생이라도 사주 안에 불이 넉넉하면 조후는 이미 채워진 것으로 본다", () => {
  const s = chart("1960-01-07", "06:30");
  assert.equal(pillarsOf(s), "己亥 丁丑 甲午 丁卯");
  const johu = computeJohu(s);
  assert.equal(johu.season, "겨울");
  assert.equal(johu.urgency, "균형");
  assert.deepEqual(johu.johu, []);
});

test("보통 여름생은 그대로 식힐 물이 급하다", () => {
  const s = chart("1960-05-06", "00:30");
  assert.equal(pillarsOf(s), "庚子 辛巳 癸巳 甲子");
  const johu = computeJohu(s);
  assert.equal(johu.urgency, "급함");
  assert.deepEqual(johu.johu, ["수"]);
});

test("물에 잠긴 흙 사주는 신약 — 돕는 불·흙이 용신이다", () => {
  const s = chart("1960-01-01", "00:30");
  assert.equal(pillarsOf(s), "己亥 丙子 戊子 壬子");
  const eokbu = computeYongsin(s);
  assert.equal(eokbu.body, "신약");
  assert.deepEqual(eokbu.yongsin, ["화", "토"]);
  const johu = computeJohu(s);
  assert.equal(johu.urgency, "급함");
  assert.deepEqual(johu.johu, ["화", "목"]);
});

test("근거 문장의 조사가 받침에 맞는다", () => {
  const eokbu = computeYongsin(chart("1954-03-04", "06:30", "male"));
  assert.match(eokbu.reasoning, /수·금이 용신, 토·화는 기신/);
});
