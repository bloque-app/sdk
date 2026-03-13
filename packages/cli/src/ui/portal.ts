import { stdout } from 'node:process';

const ESC = '\x1b';
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;

const PALETTE = [
  `${ESC}[38;5;53m`,   //  0 — deep magenta
  `${ESC}[38;5;54m`,   //  1 — dark purple
  `${ESC}[38;5;55m`,   //  2 — plum
  `${ESC}[38;5;92m`,   //  3 — muted violet
  `${ESC}[38;5;93m`,   //  4 — violet
  `${ESC}[38;5;129m`,  //  5 — purple
  `${ESC}[38;5;135m`,  //  6 — light purple
  `${ESC}[38;5;141m`,  //  7 — lavender
  `${ESC}[38;5;111m`,  //  8 — soft blue
  `${ESC}[38;5;75m`,   //  9 — sky blue
  `${ESC}[38;5;81m`,   // 10 — cyan
  `${ESC}[38;5;123m`,  // 11 — bright cyan
  `${ESC}[38;5;159m`,  // 12 — ice blue
  `${ESC}[38;5;195m`,  // 13 — pale cyan
  `${ESC}[38;5;231m`,  // 14 — white
];

const SUCCESS_COLOR = `${ESC}[38;5;49m`;
const DIM_STAR = `${ESC}[38;5;236m`;
const MED_STAR = `${ESC}[38;5;240m`;

const MAX_RADIUS = 6;
const WIDTH = 52;
const HEIGHT = MAX_RADIUS * 2 + 3;
const CX = Math.floor(WIDTH / 2);
const CY = Math.floor(HEIGHT / 2);
const ASPECT = 2.1;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function generateStarField(): boolean[][] {
  const field: boolean[][] = [];
  for (let y = 0; y < HEIGHT; y++) {
    field[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      field[y][x] = Math.random() < 0.025;
    }
  }
  return field;
}

function renderFrame(
  radius: number,
  stars: boolean[][],
  shimmer = false,
): string[] {
  const lines: string[] = [];

  for (let y = 0; y < HEIGHT; y++) {
    let line = '';
    for (let x = 0; x < WIDTH; x++) {
      const dx = (x - CX) / ASPECT;
      const dy = y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let char = ' ';
      let color = '';

      for (let r = 0; r <= radius; r++) {
        const hitThreshold = r === 0 ? 0.5 : 0.6;
        if (Math.abs(dist - r) < hitThreshold) {
          const t = 1 - r / MAX_RADIUS;
          const idx = Math.round(t * (PALETTE.length - 1));
          color = PALETTE[idx];

          if (r === 0) {
            char = '✦';
            color = BOLD + PALETTE[PALETTE.length - 1];
          } else if (r <= 2) {
            char = shimmer && Math.random() < 0.3 ? '✧' : '◦';
          } else {
            char = shimmer && Math.random() < 0.15 ? '✧' : '·';
          }
          break;
        }
      }

      if (char === ' ' && stars[y][x]) {
        const twinkle = shimmer && Math.random() < 0.3;
        color = twinkle ? MED_STAR : DIM_STAR;
        char = '.';
      }

      line += char !== ' ' ? color + char + RESET : ' ';
    }
    lines.push(line);
  }

  return lines;
}

function renderSuccess(message: string): string[] {
  const pad = ' '.repeat(Math.max(0, CX - 1));
  return [
    '',
    `${pad}${BOLD}${SUCCESS_COLOR}◆${RESET} ${SUCCESS_COLOR}${message}${RESET}`,
    '',
  ];
}

function writeLines(lines: string[]): void {
  stdout.write(lines.join('\n') + '\n');
}

function clearLines(count: number): void {
  stdout.write(`${ESC}[${count}A${ESC}[0J`);
}

export async function portalAnimation(message: string): Promise<void> {
  if (!stdout.isTTY) {
    console.log(`\n  ◆ ${message}\n`);
    return;
  }

  stdout.write(HIDE_CURSOR);
  const stars = generateStarField();

  try {
    const frame0 = renderFrame(0, stars);
    writeLines(frame0);
    await sleep(120);

    for (let r = 1; r <= MAX_RADIUS; r++) {
      clearLines(frame0.length);
      const frame = renderFrame(r, stars);
      writeLines(frame);
      await sleep(70 + r * 10);
    }

    for (let i = 0; i < 4; i++) {
      clearLines(HEIGHT);
      const frame = renderFrame(MAX_RADIUS, stars, true);
      writeLines(frame);
      await sleep(100);
    }

    for (let r = MAX_RADIUS; r >= 1; r--) {
      clearLines(HEIGHT);
      const frame = renderFrame(r, stars);
      writeLines(frame);
      await sleep(50 + r * 5);
    }

    clearLines(HEIGHT);
    const dotFrame = renderFrame(0, stars);
    writeLines(dotFrame);
    await sleep(150);

    clearLines(HEIGHT);
    const successLines = renderSuccess(message);
    writeLines(successLines);
  } finally {
    stdout.write(SHOW_CURSOR);
  }
}
