/**
 * Tiny console-narration helpers for the compliance-gate checks. Not a test
 * framework — these checks run real HTTP against sandbox and are meant to
 * be read like a runbook while they execute, not silently pass/fail.
 */

export function step(title: string): void {
  console.log(`\n▶ ${title}`);
}

export function ok(message: string): void {
  console.log(`  ✓ ${message}`);
}

export function info(message: string): void {
  console.log(`  · ${message}`);
}

export class CheckAssertionError extends Error {}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new CheckAssertionError(message);
  }
}
