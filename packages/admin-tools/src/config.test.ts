import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { AdminConfigError, loadConfig } from './config.ts';

const VALID = `
[chain.signer]
controller_address = "F3opxRbN5ZavB4LTn"
mnemonic = "word one two three four five six seven eight nine ten eleven"
derivation_path = "//Controller//0"

[chain.endpoints]
kreivo = "wss://kreivo.kippu.rocks"
asset_hub = "wss://kusama-asset-hub-rpc.polkadot.io"

[api]
base_url = "https://api.bloque.app"
jwt = "eyJ.A.B"
treasury_account = "did:bloque:account:polygon:0x123"

[indexer]
api_key = "alchemy-key"
network = "polygon-mainnet"

[server]
host = "127.0.0.1"
port = 3737
mcp_path = "/mcp"
`;

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'admin-tools-test-'));
  });
  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const write = (contents: string) => {
    const p = path.join(tmpDir, 'admin-tools.toml');
    fs.writeFileSync(p, contents);
    return p;
  };

  test('parses a fully-populated config', () => {
    const cfg = loadConfig(write(VALID));
    expect(cfg.chain.signer.controllerAddress).toBe('F3opxRbN5ZavB4LTn');
    expect(cfg.chain.signer.derivationPath).toBe('//Controller//0');
    expect(cfg.chain.endpoints.assetHub).toBe('wss://kusama-asset-hub-rpc.polkadot.io');
    expect(cfg.api.treasuryAccount).toBe('did:bloque:account:polygon:0x123');
    expect(cfg.indexer.network).toBe('polygon-mainnet');
    expect(cfg.server.port).toBe(3737);
    expect(cfg.server.sharedSecret).toBeUndefined();
  });

  test('treats empty shared_secret as absent', () => {
    const cfg = loadConfig(write(`${VALID}\nshared_secret = ""\n`));
    expect(cfg.server.sharedSecret).toBeUndefined();
  });

  test('keeps non-empty shared_secret', () => {
    const cfg = loadConfig(write(`${VALID}\nshared_secret = "super-secret"\n`));
    expect(cfg.server.sharedSecret).toBe('super-secret');
  });

  test('throws AdminConfigError when the file does not exist', () => {
    const missing = path.join(tmpDir, 'does-not-exist.toml');
    expect(() => loadConfig(missing)).toThrow(AdminConfigError);
  });

  test('aggregates every missing key rather than bailing on the first', () => {
    const p = write('[chain.signer]\n');
    try {
      loadConfig(p);
      throw new Error('expected AdminConfigError');
    } catch (err) {
      expect(err).toBeInstanceOf(AdminConfigError);
      const issues = (err as AdminConfigError).issues;
      expect(issues).toContain('missing or invalid `chain.signer.controller_address`');
      expect(issues).toContain('missing or invalid `chain.endpoints.kreivo`');
      expect(issues).toContain('missing or invalid `api.jwt`');
      expect(issues).toContain('missing or invalid `indexer.api_key`');
      expect(issues).toContain('missing or invalid `server.port`');
      expect(issues.length).toBe(13);
    }
  });

  test('rejects a non-numeric server.port', () => {
    const p = write(VALID.replace('port = 3737', 'port = "3737"'));
    try {
      loadConfig(p);
      throw new Error('expected AdminConfigError');
    } catch (err) {
      expect(err).toBeInstanceOf(AdminConfigError);
      expect((err as AdminConfigError).issues).toEqual([
        'missing or invalid `server.port`',
      ]);
    }
  });
});
