import { SDK } from '../../packages/sdk/src/index';
import { requireEnv } from './env';

/**
 * SDK instance for the checks, using `originKey` auth (the only auth
 * strategy that supports `register()`, which every check needs to create
 * an isolated fresh identity per run) against the sandbox environment.
 */
export function createSdk(): SDK {
  return new SDK({
    origin: requireEnv('ORIGIN'),
    auth: {
      type: 'originKey',
      originKey: requireEnv('ORIGIN_KEY'),
    },
    mode: 'sandbox',
    platform: 'node',
  });
}
