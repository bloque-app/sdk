import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';

import { getConfig, setConfig, setHttpClient } from './config.js';

export function init(config: BloqueConfig) {
  setConfig(config);

  setHttpClient(new HttpClient(getConfig()));
}
