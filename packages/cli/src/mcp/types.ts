import type { SDK } from '@bloque/sdk';

export type BloqueClients = Awaited<ReturnType<SDK['connect']>>;
