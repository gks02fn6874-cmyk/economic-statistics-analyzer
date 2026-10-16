export type PeriodKind = "month" | "quarter";

export type Period = {
  year: number;
  /** 월별이면 1~12, 분기별이면 1~4 */
  index: number;
  label: string;
};

export type ParsedInput = {
  kind: PeriodKind;
  periods: Period[];
  items: string[];
  /** values[항목][기간]. 결측은 null */
  values: (number | null)[][];
  /** 항목별 고정 비중(%). null이면 전년동기 값의 합계 대비 비중을 쓴다. */
  weights: number[] | null;
  /** 값의 단위 (원본 표기 그대로) */
  unit?: string;
  /** 통계항목 이름 (예: 수출액) */
  statistic?: string;
};

export type Reason = "기간 부족" | "해당 없음" | "계산 불가";

/** 숫자이거나, 계산하지 못한 이유 */
export type Metric = number | Reason;

export type AnalysisResult = {
  kind: PeriodKind;
  periods: string[];
  items: string[];
  weights: number[] | null;
  unit: string;
  statistic: string;
  /** 원자료 값 [항목][기간]. 결측은 null */
  values: (number | null)[][];
  /** 전년동기대비 증감률(%) [항목][기간] */
  yoy: Metric[][];
  /** 전월대비 증감률(%) [항목][기간] */
  mom: Metric[][];
  /** 3개월 이동평균 [항목][기간] */
  movingAverage: Metric[][];
  /** 성장 기여도(%p) = 비중 × 전년동기대비 증감률 [항목][기간] */
  contribution: Metric[][];
  /** 전년동기대비 증감률 기준 상관계수 [항목][항목]. 항목이 너무 많으면 null */
  correlation: Metric[][] | null;
  correlationNote: string | null;
};

/** KOSIS 원본 엑셀의 행 구분 */
export type KosisLevel = "detail" | "mid" | "major";

export type KosisRow = {
  /** 엑셀 행 번호 */
  id: number;
  level: KosisLevel;
  major: string;
  mid: string;
  name: string;
  /** values[통계항목][기간]. 원본 수치 그대로, 결측은 null */
  values: (number | null)[][];
};

export type KosisStat = { name: string; unit: string; periods: string[] };

export type KosisTable = { stats: KosisStat[]; rows: KosisRow[] };

export type KosisSelection = { stat: number; level: KosisLevel; rowIds: number[] };

export type ApiResponse =
  | { ok: true; kind: "result"; result: AnalysisResult }
  | { ok: true; kind: "preview"; table: KosisTable }
  | { ok: false; problems: string[] };
