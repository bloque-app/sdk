import type { BloqueConfig } from '@bloque/sdk-core';

import { setConfig } from './config.js';

export function init(config: BloqueConfig) {
  setConfig(config);
}
