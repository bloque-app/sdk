import { stdout } from 'node:process';

export const ESC = '\x1b';
export const RESET = `${ESC}[0m`;
export const BOLD = `${ESC}[1m`;
export const HIDE_CURSOR = `${ESC}[?25l`;
export const SHOW_CURSOR = `${ESC}[?25h`;

export const PALETTE = [
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

export const SUCCESS_COLOR = `${ESC}[38;5;49m`;
export const DIM_STAR = `${ESC}[38;5;236m`;
export const MED_STAR = `${ESC}[38;5;240m`;

export const MAX_RADIUS = 6;
export const WIDTH = 52;
export const HEIGHT = MAX_RADIUS * 2 + 3;
export const CX = Math.floor(WIDTH / 2);
export const CY = Math.floor(HEIGHT / 2);
export const ASPECT = 2.1;

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function generateStarField(): boolean[][] {
  const field: boolean[][] = [];
  for (let y = 0; y < HEIGHT; y++) {
    field[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      field[y][x] = Math.random() < 0.025;
    }
  }
  return field;
}

export function writeLines(lines: string[]): void {
  stdout.write(lines.join('\n') + '\n');
}

export function clearLines(count: number): void {
  stdout.write(`${ESC}[${count}A${ESC}[0J`);
}
