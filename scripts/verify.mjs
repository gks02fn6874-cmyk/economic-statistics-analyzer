// 샘플 3종을 앱 계산과 "엑셀 식 그대로 따라 쓴 별도 계산"으로 각각 구해 대조한다.  실행: npm run verify
import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import ExcelJS from "exceljs";

const root = new URL("..", import.meta.url).pathname;
// exceljs를 찾을 수 있도록 프로젝트 안에 잠깐 컴파일하고, 끝나면 지운다.
const out = join(root, ".verify-out");
rmSync(out, { recursive: true, force: true });
execFileSync(
  join(root, "node_modules/.bin/tsc"),
  [
    ...["lib/stats/parse.ts", "lib/stats/compute.ts", "lib/stats/format.ts", "lib/stats/kosis.ts"],
    ...["--outDir", out, "--module", "commonjs", "--target", "es2022"],
    ...["--esModuleInterop", "--skipLibCheck", "--moduleResolution", "node10"],
  ],
  { cwd: root, stdio: "inherit" },
);
const require = createRequire(import.meta.url);
const { parseWorkbook } = require(join(out, "parse.js"));
const { analyze } = require(join(out, "compute.js"));
const { show } = require(join(out, "format.js"));
const { parseKosis, buildInput, isKosisLayout, kosisSheet } = require(join(out, "kosis.js"));
const { readWorkbook } = require(join(out, "parse.js"));

/** 엑셀에서 손으로 식을 쓰는 방식 그대로: 같은 열의 12행(분기는 4행) 위 셀과 비교 */
async function byHand(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ds = wb.getWorksheet("데이터");
  const ws = wb.getWorksheet("비중");
  const lastCol = ds.getRow(1).values.length - 1;
  const rows = [];
  for (let r = 2; r <= ds.rowCount; r++) {
    const row = ds.getRow(r);
    if (row.getCell(1).value === null) continue;
    rows.push(Array.from({ length: lastCol - 1 }, (_, c) => Number(row.getCell(c + 2).value)));
  }
  const quarterly = String(ds.getRow(2).getCell(1).value).includes("Q");
  const lag = quarterly ? 4 : 12;
  const n = rows.length;
  const nItems = lastCol - 1;
  const weights = Array.from({ length: nItems }, (_, i) => Number(ws.getRow(i + 2).getCell(2).value));

  const yoy = (i, t) => (t >= lag ? (rows[t][i] / rows[t - lag][i] - 1) * 100 : null);
  const mom = (i, t) => (!quarterly && t >= 1 ? (rows[t][i] / rows[t - 1][i] - 1) * 100 : null);
  const ma = (i, t) =>
    !quarterly && t >= 2 ? (rows[t][i] + rows[t - 1][i] + rows[t - 2][i]) / 3 : null;
  const contrib = (i, t) => (yoy(i, t) === null ? null : (weights[i] / 100) * yoy(i, t));
  const corr = (a, b) => {
    const xs = [];
    const ys = [];
    for (let t = 0; t < n; t++) {
      if (yoy(a, t) !== null) {
        xs.push(yoy(a, t));
        ys.push(yoy(b, t));
      }
    }
    const avg = (v) => v.reduce((s, x) => s + x, 0) / v.length;
    const mx = avg(xs);
    const my = avg(ys);
    const cov = xs.reduce((s, x, k) => s + (x - mx) * (ys[k] - my), 0);
    const vx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
    const vy = ys.reduce((s, y) => s + (y - my) ** 2, 0);
    return cov / Math.sqrt(vx * vy);
  };
  return { n, nItems, yoy, mom, ma, contrib, corr };
}

const dir = join(root, "public/samples");
let checked = 0;
let mismatched = 0;
for (const name of readdirSync(dir).filter((f) => f.endsWith(".xlsx"))) {
  const path = join(dir, name);
  const buf = await (await import("node:fs/promises")).readFile(path);
  const app = analyze(await parseWorkbook(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length)));
  const hand = await byHand(path);

  const compare = (label, appCell, expected, digits) => {
    checked += 1;
    const appText = show(appCell, digits);
    const handText = expected === null ? null : show(expected, digits);
    // 숫자가 아닌 칸(기간 부족/해당 없음)은 손 계산에서도 값이 없어야 한다.
    const ok = expected === null ? typeof appCell !== "number" : appText === handText;
    if (!ok) {
      mismatched += 1;
      console.log(`  불일치 ${name} ${label}: 앱=${appText} 손계산=${handText}`);
    }
  };

  for (let i = 0; i < hand.nItems; i++) {
    for (let t = 0; t < hand.n; t++) {
      const tag = `${app.items[i]} ${app.periods[t]}`;
      compare(`전년동기 ${tag}`, app.yoy[i][t], hand.yoy(i, t), 1);
      compare(`전월 ${tag}`, app.mom[i][t], hand.mom(i, t), 1);
      compare(`이동평균 ${tag}`, app.movingAverage[i][t], hand.ma(i, t), 1);
      compare(`기여도 ${tag}`, app.contribution[i][t], hand.contrib(i, t), 1);
    }
    for (let j = 0; j < hand.nItems; j++) {
      if (i !== j) compare(`상관 ${app.items[i]}-${app.items[j]}`, app.correlation[i][j], hand.corr(i, j), 2);
    }
  }
  console.log(`${name}: ${app.kind} ${hand.n}기간 × ${hand.nItems}항목 확인`);
}
console.log(`\n비교 ${checked}칸, 불일치 ${mismatched}칸 → 일치율 ${(((checked - mismatched) / checked) * 100).toFixed(1)}%`);

// ---- KOSIS 원본 파일 ----
const kosisDir = join(root, "samples-kosis");
let kosisChecked = 0;
let kosisFailed = 0;
const check = (ok, label) => {
  kosisChecked += 1;
  if (!ok) {
    kosisFailed += 1;
    console.log(`  실패 ${label}`);
  }
};
let kosisFiles = [];
try {
  kosisFiles = readdirSync(kosisDir).filter((f) => f.endsWith(".xlsx"));
} catch {}
for (const name of kosisFiles) {
  const path = join(kosisDir, name);
  const fs = await import("node:fs/promises");
  const buf = await fs.readFile(path);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
  const wb = await readWorkbook(ab);
  check(isKosisLayout(kosisSheet(wb)), `${name}: KOSIS 형식 인식`);
  const table = parseKosis(wb);

  // 원본을 다시 읽어, 변환된 모든 칸이 원본과 같은지 본다.
  const raw = new ExcelJS.Workbook();
  await raw.xlsx.readFile(path);
  const ws = raw.getWorksheet("데이터");
  const txt = (v) => (v === null || v === undefined ? "" : String(v).trim());
  const stat = table.stats[0];
  const unitInRow2 = txt(ws.getCell(2, 4).value);
  check(unitInRow2 === `${stat.name} (${stat.unit})`, `${name}: 통계항목·단위 보존 (${unitInRow2})`);
  check(stat.periods[0] === "2024-01" && stat.periods.length === ws.columnCount - 3, `${name}: 기간 수`);

  const rawRows = [];
  for (let r = 3; r <= ws.rowCount; r++) {
    const c = txt(ws.getCell(r, 3).value);
    const b = txt(ws.getCell(r, 2).value);
    if (!c && !txt(ws.getCell(r, 1).value) && !b) continue;
    rawRows.push({ r, level: c !== "소계" ? "detail" : b === "소계" ? "major" : "mid" });
  }
  check(rawRows.length === table.rows.length, `${name}: 행 수 ${rawRows.length}`);
  const count = (lv) => table.rows.filter((x) => x.level === lv).length;
  console.log(`${name}: 세부 ${count("detail")} / 중분류 소계 ${count("mid")} / 대분류 소계 ${count("major")}`);
  check(rawRows.every((x, i) => x.r === table.rows[i].id && x.level === table.rows[i].level), `${name}: 행 구분 일치`);

  let dashes = 0;
  let cells = 0;
  let same = 0;
  for (const row of table.rows) {
    for (let t = 0; t < stat.periods.length; t++) {
      const v = ws.getCell(row.id, 4 + t).value;
      const got = row.values[0][t];
      cells += 1;
      if (typeof v === "number") same += got === v ? 1 : 0;
      else if (txt(v) === "-" || txt(v) === "") {
        dashes += 1;
        same += got === null ? 1 : 0;
      }
    }
  }
  check(same === cells, `${name}: 원본 수치 ${cells}칸 중 ${same}칸 일치 (결측 ${dashes}칸)`);

  // 소계와 세부 품목이 섞이지 않는지
  const detailIds = table.rows.filter((x) => x.level === "detail").map((x) => x.id);
  const inputDetail = buildInput(table, { stat: 0, level: "detail", rowIds: detailIds });
  check(inputDetail.items.length === detailIds.length && !inputDetail.items.some((n) => n.endsWith("소계")), `${name}: 세부 품목 선택에 소계 없음`);
  let mixed = false;
  try {
    buildInput(table, { stat: 0, level: "detail", rowIds: [...detailIds.slice(0, 2), table.rows.find((x) => x.level === "mid").id] });
  } catch {
    mixed = true;
  }
  check(mixed, `${name}: 소계+세부 혼합 선택은 거부`);

  // 계산 대조: 세부 품목 전체(261개) + 일부 5개 상관관계
  const all = analyze(inputDetail);
  check(all.correlation === null && all.correlationNote !== null, `${name}: 30개 초과 시 상관관계 생략 안내`);
  const vals = inputDetail.values;
  const nT = stat.periods.length;
  const n = vals.length;
  const g = (cur, base) => (cur === null || base === null || base === 0 ? "x" : show((cur / base - 1) * 100, 1));
  let bad = 0;
  let total = 0;
  const cmp = (appCell, want) => {
    total += 1;
    const a = typeof appCell === "number" ? show(appCell, 1) : "x";
    if (a !== want) bad += 1;
  };
  for (let i = 0; i < n; i++) {
    for (let t = 0; t < nT; t++) {
      cmp(all.yoy[i][t], t >= 12 ? g(vals[i][t], vals[i][t - 12]) : "x");
      cmp(all.mom[i][t], t >= 1 ? g(vals[i][t], vals[i][t - 1]) : "x");
      const w = t >= 2 ? [vals[i][t], vals[i][t - 1], vals[i][t - 2]] : null;
      cmp(all.movingAverage[i][t], w && w.every((x) => x !== null) ? show((w[0] + w[1] + w[2]) / 3, 1) : "x");
      let want = "x";
      if (t >= 12 && vals[i][t] !== null && vals[i][t - 12] !== null && vals[i][t - 12] !== 0) {
        const tot = vals.reduce((s, row) => s + (row[t - 12] ?? 0), 0);
        want = show((vals[i][t - 12] / tot) * ((vals[i][t] / vals[i][t - 12] - 1) * 100), 1);
      }
      cmp(all.contribution[i][t], want);
    }
  }
  check(bad === 0, `${name}: 세부 ${n}개 × ${nT}기간 지표 ${total}칸 중 불일치 ${bad}칸`);
  console.log(`  지표 대조 ${total}칸, 불일치 ${bad}칸`);

  const five = buildInput(table, { stat: 0, level: "detail", rowIds: detailIds.slice(0, 5) });
  const r5 = analyze(five);
  const yoyOf = (i, t) => (t >= 12 && five.values[i][t] !== null && five.values[i][t - 12] ? (five.values[i][t] / five.values[i][t - 12] - 1) * 100 : null);
  let corrBad = 0;
  for (let a = 0; a < 5; a++) {
    for (let b = 0; b < 5; b++) {
      if (a === b) continue;
      const xs = [];
      const ys = [];
      for (let t = 0; t < nT; t++) {
        const x = yoyOf(a, t);
        const y = yoyOf(b, t);
        if (x !== null && y !== null) {
          xs.push(x);
          ys.push(y);
        }
      }
      const av = (v) => v.reduce((s, q) => s + q, 0) / v.length;
      const mx = av(xs);
      const my = av(ys);
      const cov = xs.reduce((s, x, k) => s + (x - mx) * (ys[k] - my), 0);
      const want = cov / Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
      if (show(r5.correlation[a][b], 2) !== show(want, 2)) corrBad += 1;
    }
  }
  check(corrBad === 0, `${name}: 상관관계 5개 항목 불일치 ${corrBad}`);
}
if (kosisFiles.length > 0) {
  console.log(`\nKOSIS 확인 ${kosisChecked}항목, 실패 ${kosisFailed}항목`);
  mismatched += kosisFailed;
}


rmSync(out, { recursive: true, force: true });
process.exit(mismatched === 0 ? 0 : 1);
