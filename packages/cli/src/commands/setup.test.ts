import { describe, expect, test } from 'bun:test';
import { isCompiledBinary } from './setup.ts';

describe('isCompiledBinary', () => {
  const originalExecPath = process.execPath;

  function withExecPath(execPath: string, fn: () => void) {
    Object.defineProperty(process, 'execPath', { value: execPath, writable: true, configurable: true });
    try {
      fn();
    } finally {
      Object.defineProperty(process, 'execPath', { value: originalExecPath, writable: true, configurable: true });
    }
  }

  test('detects compiled binary with platform suffix', () => {
    withExecPath('/usr/local/bin/bloque-darwin-arm64', () => {
      expect(isCompiledBinary()).toBe(true);
    });
  });

  test('detects compiled binary without platform suffix', () => {
    withExecPath('/usr/local/bin/bloque', () => {
      expect(isCompiledBinary()).toBe(true);
    });
  });

  test('detects compiled binary with .exe suffix', () => {
    withExecPath('/tmp/bloque-windows-x64.exe', () => {
      expect(isCompiledBinary()).toBe(true);
    });
  });

  test('returns false for node runtime', () => {
    withExecPath('/usr/local/bin/node', () => {
      expect(isCompiledBinary()).toBe(false);
    });
  });

  test('returns false for bun runtime', () => {
    withExecPath('/usr/local/bin/bun', () => {
      expect(isCompiledBinary()).toBe(false);
    });
  });

  test('returns false for npx path', () => {
    withExecPath('/usr/local/lib/node_modules/.bin/npx', () => {
      expect(isCompiledBinary()).toBe(false);
    });
  });
});
