import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse as parseToml } from 'smol-toml';

export const DEFAULT_CONFIG_PATH = path.join(
  os.homedir(),
  '.bloque',
  'admin-tools.toml',
);

export interface AdminConfig {
  chain: {
    signer: {
      controllerAddress: string;
      mnemonic: string;
      derivationPath: string;
    };
    endpoints: {
      kreivo: string;
      assetHub: string;
    };
  };
  api: {
    baseUrl: string;
    jwt: string;
    treasuryAccount: string;
  };
  indexer: {
    apiKey: string;
    network: string;
  };
  server: {
    host: string;
    port: number;
    mcpPath: string;
    sharedSecret?: string;
  };
}

export class AdminConfigError extends Error {
  constructor(
    public readonly issues: string[],
    public readonly configPath: string,
  ) {
    super(
      `admin-tools config at ${configPath} is invalid:\n  - ${issues.join('\n  - ')}`,
    );
    this.name = 'AdminConfigError';
  }
}

export function loadConfig(configPath: string = DEFAULT_CONFIG_PATH): AdminConfig {
  if (!fs.existsSync(configPath)) {
    throw new AdminConfigError(
      [`file not found (run \`bloque-admin config init\` to scaffold it)`],
      configPath,
    );
  }

  const raw = parseToml(fs.readFileSync(configPath, 'utf-8')) as Record<
    string,
    unknown
  >;

  const issues: string[] = [];
  const req = <T>(path: string, value: unknown, check: (v: unknown) => v is T): T => {
    if (!check(value)) {
      issues.push(`missing or invalid \`${path}\``);
      return undefined as unknown as T;
    }
    return value;
  };
  const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
  const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

  const chain = (raw.chain ?? {}) as Record<string, unknown>;
  const signer = (chain.signer ?? {}) as Record<string, unknown>;
  const endpoints = (chain.endpoints ?? {}) as Record<string, unknown>;
  const api = (raw.api ?? {}) as Record<string, unknown>;
  const indexer = (raw.indexer ?? {}) as Record<string, unknown>;
  const server = (raw.server ?? {}) as Record<string, unknown>;

  const config: AdminConfig = {
    chain: {
      signer: {
        controllerAddress: req('chain.signer.controller_address', signer.controller_address, str),
        mnemonic: req('chain.signer.mnemonic', signer.mnemonic, str),
        derivationPath: req('chain.signer.derivation_path', signer.derivation_path, str),
      },
      endpoints: {
        kreivo: req('chain.endpoints.kreivo', endpoints.kreivo, str),
        assetHub: req('chain.endpoints.asset_hub', endpoints.asset_hub, str),
      },
    },
    api: {
      baseUrl: req('api.base_url', api.base_url, str),
      jwt: req('api.jwt', api.jwt, str),
      treasuryAccount: req('api.treasury_account', api.treasury_account, str),
    },
    indexer: {
      apiKey: req('indexer.api_key', indexer.api_key, str),
      network: req('indexer.network', indexer.network, str),
    },
    server: {
      host: req('server.host', server.host, str),
      port: req('server.port', server.port, num),
      mcpPath: req('server.mcp_path', server.mcp_path, str),
      sharedSecret: typeof server.shared_secret === 'string' && server.shared_secret.length > 0
        ? server.shared_secret
        : undefined,
    },
  };

  if (issues.length > 0) {
    throw new AdminConfigError(issues, configPath);
  }

  return config;
}
