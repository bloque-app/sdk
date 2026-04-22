import { expect, test } from 'bun:test';
import type { AssetHubApi, KreivoApi } from '../clients.ts';
import type { ProxyArgs } from './shared.ts';
import type {
  AssetHubTeleportArgs,
  KreivoTeleportArgs,
  TeleportApi,
  TeleportArgs,
} from './teleport-api.ts';
import type {
  AssetHubTransferArgs,
  KreivoTransferArgs,
  TransferApi,
  TransferArgs,
} from './transfer-api.ts';

// These tests are compile-time only — if the file type-checks, both generated
// TypedApis structurally satisfy the unified descriptor shapes. The single
// runtime assertion is a marker so the test runner reports a result.
test('TransferApi accepts kreivo and asset-hub descriptor arg shapes', () => {
  // biome-ignore lint/correctness/noUnusedVariables: compile-time assignability check
  const _kreivoAsTransfer: TransferApi = null as unknown as KreivoApi;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time assignability check
  const _assetHubAsTransfer: TransferApi = null as unknown as AssetHubApi;

  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _kreivoTransferArgs: TransferArgs =
    null as unknown as KreivoTransferArgs;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _assetHubTransferArgs: TransferArgs =
    null as unknown as AssetHubTransferArgs;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _kreivoProxyArgs: ProxyArgs = null as unknown as Parameters<
    KreivoApi['tx']['Proxy']['proxy']
  >[0];
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _assetHubProxyArgs: ProxyArgs = null as unknown as Parameters<
    AssetHubApi['tx']['Proxy']['proxy']
  >[0];

  expect(true).toBe(true);
});

test('TeleportApi accepts kreivo and asset-hub descriptor arg shapes', () => {
  // biome-ignore lint/correctness/noUnusedVariables: compile-time assignability check
  const _kreivoAsTeleport: TeleportApi = null as unknown as KreivoApi;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time assignability check
  const _assetHubAsTeleport: TeleportApi = null as unknown as AssetHubApi;

  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _kreivoTeleportArgs: TeleportArgs =
    null as unknown as KreivoTeleportArgs;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _assetHubTeleportArgs: TeleportArgs =
    null as unknown as AssetHubTeleportArgs;
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _kreivoProxyArgs: ProxyArgs = null as unknown as Parameters<
    KreivoApi['tx']['Proxy']['proxy']
  >[0];
  // biome-ignore lint/correctness/noUnusedVariables: compile-time arg-shape check
  const _assetHubProxyArgs: ProxyArgs = null as unknown as Parameters<
    AssetHubApi['tx']['Proxy']['proxy']
  >[0];

  expect(true).toBe(true);
});
