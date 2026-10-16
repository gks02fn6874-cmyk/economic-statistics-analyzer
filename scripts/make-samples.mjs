// 샘플 엑셀 3종(가상 숫자)을 public/samples에 만든다.  실행: node scripts/make-samples.mjs
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";

const OUT = new URL("../public/samples/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** 시작값에서 월/분기마다 추세 + 계절 + 잡음으로 움직이는 가상 계열 */
function series(random, n, start, trend, cycle) {
  const out = [];
  let v = start;
  for (let t = 0; t < n; t++) {
    v = v * (1 + trend + (random() - 0.5) * 0.04);
    out.push(Math.round(v * (1 + 0.03 * Math.sin((2 * Math.PI * t) / cycle)) * 10) / 10);
  }
  return out;
}

async function write(file, { header, labels, items, weights }) {
  const wb = new ExcelJS.Workbook();
  const data = wb.addWorksheet("데이터");
  data.addRow([header, ...items.map((i) => i.name)]);
  labels.forEach((label, t) => data.addRow([label, ...items.map((i) => i.values[t])]));
  data.getColumn(1).width = 22;
  const w = wb.addWorksheet("비중");
  w.addRow(["항목", "비중(%)"]);
  items.forEach((i, k) => w.addRow([i.name, weights[k]]));
  w.getColumn(1).width = 16;
  await wb.xlsx.writeFile(OUT + file);
  console.log("만듦:", file);
}

const months = (y0, n) =>
  Array.from({ length: n }, (_, t) => {
    const total = y0 * 12 + t;
    return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
  });
const quarters = (y0, n) =>
  Array.from({ length: n }, (_, t) => `${y0 + Math.floor(t / 4)}-Q${(t % 4) + 1}`);

const r1 = rng(11);
await write("샘플_월별1_산업생산(가상).xlsx", {
  header: "월 (가상 자료)",
  labels: months(2022, 36),
  items: [
    { name: "반도체", values: series(r1, 36, 100, 0.012, 12) },
    { name: "자동차", values: series(r1, 36, 100, 0.004, 12) },
    { name: "철강", values: series(r1, 36, 100, 0.001, 12) },
    { name: "석유화학", values: series(r1, 36, 100, 0.002, 12) },
  ],
  weights: [30, 35, 20, 15],
});

// 월별2: 날짜를 엑셀 날짜 셀로 넣어 두 가지 표기를 모두 시험한다.
const r2 = rng(23);
{
  const labels = months(2023, 30).map((m) => new Date(`${m}-01T00:00:00Z`));
  await write("샘플_월별2_내수지표(가상).xlsx", {
    header: "월 (가상 자료)",
    labels,
    items: [
      { name: "소매판매", values: series(r2, 30, 100, 0.003, 12) },
      { name: "설비투자", values: series(r2, 30, 100, 0.002, 12) },
      { name: "수출", values: series(r2, 30, 100, 0.006, 12) },
    ],
    weights: [40, 25, 35],
  });
}

const r3 = rng(37);
await write("샘플_분기별_분기지표(가상).xlsx", {
  header: "분기 (가상 자료)",
  labels: quarters(2022, 12),
  items: [
    { name: "민간소비", values: series(r3, 12, 100, 0.006, 4) },
    { name: "설비투자", values: series(r3, 12, 100, 0.008, 4) },
    { name: "건설투자", values: series(r3, 12, 100, 0.002, 4) },
    { name: "수출", values: series(r3, 12, 100, 0.01, 4) },
  ],
  weights: [45, 20, 15, 20],
});
