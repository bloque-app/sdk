import { stdout } from 'node:process';

import {
  BOLD,
  RESET,
  HIDE_CURSOR,
  SHOW_CURSOR,
  PALETTE,
  DIM_STAR,
  MED_STAR,
  MAX_RADIUS,
  WIDTH,
  HEIGHT,
  CX,
  CY,
  ASPECT,
  generateStarField,
  writeLines,
  clearLines,
} from './shared.ts';

const FRAME_MS = 80;
const RING_CYCLE = MAX_RADIUS + 3;
const RING_OFFSET = Math.floor(RING_CYCLE / 2);

function renderBeaconFrame(
  frame: number,
  stars: boolean[][],
): string[] {
  const ring1Radius = frame % RING_CYCLE;
  const ring2Radius = (frame + RING_OFFSET) % RING_CYCLE;

  const lines: string[] = [];

  for (let y = 0; y < HEIGHT; y++) {
    let line = '';
    for (let x = 0; x < WIDTH; x++) {
      const dx = (x - CX) / ASPECT;
      const dy = y - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let char = ' ';
      let color = '';

      if (dist < 0.5) {
        char = '✦';
        color = BOLD + PALETTE[PALETTE.length - 1];
      } else {
        for (const ringR of [ring1Radius, ring2Radius]) {
          if (ringR > MAX_RADIUS) continue;

          const hitThreshold = ringR <= 2 ? 0.6 : 0.55;
          if (Math.abs(dist - ringR) < hitThreshold) {
            const fade = ringR / MAX_RADIUS;
            const idx = Math.round(fade * (PALETTE.length - 1));
            const reverseIdx = PALETTE.length - 1 - idx;
            color = PALETTE[reverseIdx];

            if (ringR <= 2) {
              char = Math.random() < 0.25 ? '✧' : '◦';
            } else {
              char = Math.random() < 0.12 ? '✧' : '·';
            }
            break;
          }
        }
      }

      if (char === ' ' && stars[y][x]) {
        const twinkle = Math.random() < 0.15;
        color = twinkle ? MED_STAR : DIM_STAR;
        char = '.';
      }

      line += char !== ' ' ? color + char + RESET : ' ';
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Starts a looping beacon-pulse animation (expanding sonar rings from a central point).
 * Returns a stop function that clears the animation and restores the cursor.
 * On non-TTY terminals, does nothing and returns a no-op.
 */
export function startBeaconAnimation(): () => void {
  if (!stdout.isTTY) {
    return () => {};
  }

  const stars = generateStarField();
  let frame = 0;
  let running = true;

  stdout.write(HIDE_CURSOR);

  const initial = renderBeaconFrame(frame, stars);
  writeLines(initial);
  frame++;

  const interval = setInterval(() => {
    if (!running) return;
    clearLines(HEIGHT);
    const lines = renderBeaconFrame(frame, stars);
    writeLines(lines);
    frame++;
  }, FRAME_MS);

  return () => {
    if (!running) return;
    running = false;
    clearInterval(interval);
    clearLines(HEIGHT);
    stdout.write(SHOW_CURSOR);
  };
}
