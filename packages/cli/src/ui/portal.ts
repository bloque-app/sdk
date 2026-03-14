import { stdout } from 'node:process';

import {
  BOLD,
  RESET,
  HIDE_CURSOR,
  SHOW_CURSOR,
  PALETTE,
  SUCCESS_COLOR,
  DIM_STAR,
  MED_STAR,
  MAX_RADIUS,
  WIDTH,
  HEIGHT,
  CX,
  CY,
  ASPECT,
  sleep,
  generateStarField,
  writeLines,
  clearLines,
} from './shared.ts';

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
          color = PALETTE[idx] ?? '';

          if (r === 0) {
            char = '✦';
            color = BOLD + (PALETTE[PALETTE.length - 1] ?? '');
          } else if (r <= 2) {
            char = shimmer && Math.random() < 0.3 ? '✧' : '◦';
          } else {
            char = shimmer && Math.random() < 0.15 ? '✧' : '·';
          }
          break;
        }
      }

      if (char === ' ' && stars[y]?.[x]) {
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
