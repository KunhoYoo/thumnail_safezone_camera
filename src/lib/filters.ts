/**
 * 촬영 필터.
 * 프리뷰는 CSS filter(GPU)로, 캡처는 같은 값을 Canvas 에 적용해 결과가 일치하도록 한다.
 * ctx.filter 를 지원하지 않는 구형 브라우저에서는 동일한 색 행렬을 픽셀로 직접 적용한다.
 */

export type FilterParams = {
  brightness: number;
  contrast: number;
  saturate: number;
  sepia: number;
  grayscale: number;
  /** deg */
  hueRotate: number;
};

export type CameraFilter = {
  id: string;
  name: string;
  hint: string;
  params: FilterParams;
};

const IDENTITY: FilterParams = {
  brightness: 1,
  contrast: 1,
  saturate: 1,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
};

export const DEFAULT_FILTER_ID = "none";

/** 필터 칩 미리보기에 쓰는 기준 그라데이션 (피부톤 → 음식톤 → 그림자) */
export const SWATCH_GRADIENT =
  "linear-gradient(135deg, #f8d9b4 0%, #e8944f 28%, #8fb865 55%, #3f7fb0 78%, #2b3550 100%)";

export const FILTERS: CameraFilter[] = [
  { id: "none", name: "원본", hint: "보정 없음", params: { ...IDENTITY } },
  {
    id: "portrait",
    name: "인물",
    hint: "피부톤을 밝고 부드럽게",
    params: { brightness: 1.07, contrast: 0.95, saturate: 1.06, sepia: 0.09, grayscale: 0, hueRotate: 0 },
  },
  {
    id: "food",
    name: "음식",
    hint: "따뜻하고 먹음직스럽게",
    params: { brightness: 1.04, contrast: 1.12, saturate: 1.3, sepia: 0.07, grayscale: 0, hueRotate: -4 },
  },
  {
    id: "product",
    name: "제품",
    hint: "또렷하고 중립적인 색",
    params: { brightness: 1.03, contrast: 1.15, saturate: 1.05, sepia: 0, grayscale: 0, hueRotate: 0 },
  },
  {
    id: "vivid",
    name: "선명",
    hint: "색을 진하게",
    params: { brightness: 1.01, contrast: 1.2, saturate: 1.38, sepia: 0, grayscale: 0, hueRotate: 0 },
  },
  {
    id: "warm",
    name: "따뜻",
    hint: "노을 같은 따뜻한 톤",
    params: { brightness: 1.04, contrast: 1.04, saturate: 1.12, sepia: 0.2, grayscale: 0, hueRotate: -6 },
  },
  {
    id: "cool",
    name: "쿨톤",
    hint: "깨끗하고 시원한 톤",
    params: { brightness: 1.04, contrast: 1.06, saturate: 1.08, sepia: 0, grayscale: 0, hueRotate: 12 },
  },
  {
    id: "film",
    name: "필름",
    hint: "채도를 낮춘 차분한 무드",
    params: { brightness: 1.03, contrast: 1.06, saturate: 0.8, sepia: 0.16, grayscale: 0, hueRotate: 0 },
  },
  {
    id: "mono",
    name: "흑백",
    hint: "대비가 살아있는 흑백",
    params: { brightness: 1.02, contrast: 1.12, saturate: 1, sepia: 0, grayscale: 1, hueRotate: 0 },
  },
];

export function getFilter(filterId: string): CameraFilter {
  return FILTERS.find((filter) => filter.id === filterId) ?? FILTERS[0];
}

/** 강도(0~1)만큼 원본 쪽으로 보간한다. */
export function mixParams(params: FilterParams, strength: number): FilterParams {
  const s = Math.max(0, Math.min(1, strength));
  return {
    brightness: 1 + (params.brightness - 1) * s,
    contrast: 1 + (params.contrast - 1) * s,
    saturate: 1 + (params.saturate - 1) * s,
    sepia: params.sepia * s,
    grayscale: params.grayscale * s,
    hueRotate: params.hueRotate * s,
  };
}

export function isIdentity(params: FilterParams): boolean {
  return (
    near(params.brightness, 1) &&
    near(params.contrast, 1) &&
    near(params.saturate, 1) &&
    near(params.sepia, 0) &&
    near(params.grayscale, 0) &&
    near(params.hueRotate, 0)
  );
}

/** CSS filter 문자열. 순서는 Canvas 적용 순서와 반드시 동일해야 한다. */
export function toCssFilter(params: FilterParams): string {
  if (isIdentity(params)) return "none";
  const parts: string[] = [];
  if (!near(params.brightness, 1)) parts.push("brightness(" + round(params.brightness) + ")");
  if (!near(params.contrast, 1)) parts.push("contrast(" + round(params.contrast) + ")");
  if (!near(params.saturate, 1)) parts.push("saturate(" + round(params.saturate) + ")");
  if (!near(params.sepia, 0)) parts.push("sepia(" + round(params.sepia) + ")");
  if (!near(params.grayscale, 0)) parts.push("grayscale(" + round(params.grayscale) + ")");
  if (!near(params.hueRotate, 0)) parts.push("hue-rotate(" + round(params.hueRotate) + "deg)");
  return parts.length > 0 ? parts.join(" ") : "none";
}

export function getCssFilter(filterId: string, strength: number): string {
  return toCssFilter(mixParams(getFilter(filterId).params, strength));
}

let canvasFilterSupport: boolean | null = null;

/** Canvas 2D 의 filter 지원 여부 (iOS 16 이하 등 미지원 환경 대응) */
export function supportsCanvasFilter(): boolean {
  if (canvasFilterSupport !== null) return canvasFilterSupport;
  if (typeof document === "undefined") return false;
  try {
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      canvasFilterSupport = false;
      return false;
    }
    context.filter = "brightness(1.5)";
    canvasFilterSupport = context.filter !== "none" && context.filter !== "";
  } catch {
    canvasFilterSupport = false;
  }
  return canvasFilterSupport;
}

type Matrix = [number, number, number, number, number, number, number, number, number];

/**
 * CSS filter 함수들을 하나의 색 행렬 + 오프셋으로 합성한다.
 * out = M * rgb + offset (0~1 범위)
 */
function buildColorMatrix(params: FilterParams): { matrix: Matrix; offset: number } {
  let matrix: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  let offset = 0;

  // brightness
  if (!near(params.brightness, 1)) {
    matrix = scaleMatrix(matrix, params.brightness);
    offset *= params.brightness;
  }

  // contrast
  if (!near(params.contrast, 1)) {
    const k = params.contrast;
    matrix = scaleMatrix(matrix, k);
    offset = offset * k + (0.5 - 0.5 * k);
  }

  // saturate
  if (!near(params.saturate, 1)) {
    const s = params.saturate;
    const saturateMatrix: Matrix = [
      0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
      0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
    ];
    matrix = multiply(saturateMatrix, matrix);
    offset = applyRowSum(saturateMatrix, offset);
  }

  // sepia
  if (!near(params.sepia, 0)) {
    const a = params.sepia;
    const sepiaMatrix: Matrix = [
      0.393 + 0.607 * (1 - a), 0.769 - 0.769 * (1 - a), 0.189 - 0.189 * (1 - a),
      0.349 - 0.349 * (1 - a), 0.686 + 0.314 * (1 - a), 0.168 - 0.168 * (1 - a),
      0.272 - 0.272 * (1 - a), 0.534 - 0.534 * (1 - a), 0.131 + 0.869 * (1 - a),
    ];
    matrix = multiply(sepiaMatrix, matrix);
    offset = applyRowSum(sepiaMatrix, offset);
  }

  // grayscale
  if (!near(params.grayscale, 0)) {
    const a = params.grayscale;
    const g: Matrix = [
      0.2126 + 0.7874 * (1 - a), 0.7152 - 0.7152 * (1 - a), 0.0722 - 0.0722 * (1 - a),
      0.2126 - 0.2126 * (1 - a), 0.7152 + 0.2848 * (1 - a), 0.0722 - 0.0722 * (1 - a),
      0.2126 - 0.2126 * (1 - a), 0.7152 - 0.7152 * (1 - a), 0.0722 + 0.9278 * (1 - a),
    ];
    matrix = multiply(g, matrix);
    offset = applyRowSum(g, offset);
  }

  // hue-rotate
  if (!near(params.hueRotate, 0)) {
    const rad = (params.hueRotate * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const h: Matrix = [
      0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928,
      0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.14, 0.072 - cos * 0.072 - sin * 0.283,
      0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072,
    ];
    matrix = multiply(h, matrix);
    offset = applyRowSum(h, offset);
  }

  return { matrix, offset };
}

/**
 * ctx.filter 미지원 환경용 fallback.
 * CSS filter 와 같은 순서·같은 계수를 사용하므로 결과가 사실상 동일하다.
 */
export function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: FilterParams,
): void {
  if (isIdentity(params)) return;
  const { matrix, offset } = buildColorMatrix(params);
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = matrix;
  const shift = offset * 255;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = clamp255(m0 * r + m1 * g + m2 * b + shift);
    data[i + 1] = clamp255(m3 * r + m4 * g + m5 * b + shift);
    data[i + 2] = clamp255(m6 * r + m7 * g + m8 * b + shift);
  }

  ctx.putImageData(image, 0, 0);
}

function multiply(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

function scaleMatrix(matrix: Matrix, factor: number): Matrix {
  return matrix.map((value) => value * factor) as Matrix;
}

/** 모든 채널이 같은 offset 을 가질 때, 행렬 통과 후의 offset (행 합 * offset) */
function applyRowSum(matrix: Matrix, offset: number): number {
  if (offset === 0) return 0;
  return (matrix[0] + matrix[1] + matrix[2]) * offset;
}

function clamp255(value: number): number {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

function near(value: number, target: number): boolean {
  return Math.abs(value - target) < 0.001;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
