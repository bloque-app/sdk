import { type BloqueConfig, HttpClient } from '@bloque/sdk-core';

import { getConfig, setConfig } from './config.js';
import { setHttpClient } from './http.js';

export function init(config: BloqueConfig) {
  setConfig(config);

  setHttpClient(new HttpClient(getConfig()));
}
