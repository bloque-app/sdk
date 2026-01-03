import { type BloqueSDKConfig, HttpClient } from '@bloque/sdk-core';

import { getConfig, setConfig, setHttpClient } from './config.js';

export function init(config: BloqueSDKConfig) {
  setConfig(config);

  setHttpClient(new HttpClient(getConfig()));
}
