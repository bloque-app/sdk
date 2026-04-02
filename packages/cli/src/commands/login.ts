import { Command } from 'commander';
import { SDK } from '@bloque/sdk';
import { input, password, select } from '@inquirer/prompts';

import { SessionStore } from '../session/store.ts';
import { portalAnimation } from '../ui/portal.ts';

const store = new SessionStore();

const OTP_CHANNELS = [
  {
    name: 'WhatsApp',
    value: 'bloque-whatsapp',
    prompt: 'Phone number (e.g. +573001234567):',
    sentMessage: 'OTP sent via WhatsApp — check your phone.',
  },
  {
    name: 'Email',
    value: 'bloque-email',
    prompt: 'Email address:',
    sentMessage: 'OTP sent — check your inbox.',
  },
] as const;

export const loginCommand = new Command('login')
  .description('Authenticate with Bloque')
  .option('--api-key <key>', 'Secret key (sk_) for API key authentication')
  .option('--origin-key <key>', 'Origin key for legacy authentication')
  .option('--origin <origin>', 'Origin (required with --origin-key)')
  .option('--alias <alias>', 'Alias (required with --origin-key)')
  .option('--sandbox', 'Use sandbox environment instead of production')
  .action(async (opts) => {
    const { apiKey, originKey, origin, alias, sandbox } = opts as {
      apiKey?: string;
      originKey?: string;
      origin?: string;
      alias?: string;
      sandbox?: boolean;
    };

    const mode = sandbox ? 'sandbox' : 'production';

    // --- New apiKey (sk_) flow: exchange + /me, no alias needed ---
    if (apiKey) {
      const sdk = new SDK({ auth: { type: 'apiKey', apiKey }, mode });
      const clients = await sdk.connect();

      store.save({
        accessToken: clients.accessToken,
        urn: clients.urn ?? '',
        origin: '',
        mode,
        authType: 'apiKey',
        apiKey,
        createdAt: new Date().toISOString(),
      });

      await portalAnimation(`Connected as ${clients.urn ?? 'API key session'}`);
      return;
    }

    // --- Legacy originKey flow: connect(alias) ---
    if (originKey) {
      if (!alias) {
        console.error('Error: --alias is required when using --origin-key');
        process.exit(1);
      }
      if (!origin) {
        console.error('Error: --origin is required when using --origin-key');
        process.exit(1);
      }

      const sdk = new SDK({ auth: { type: 'originKey', originKey }, mode, origin });
      const clients = await sdk.connect(alias);

      store.save({
        accessToken: clients.accessToken,
        urn: clients.urn ?? '',
        origin,
        mode,
        authType: 'originKey',
        originKey,
        alias,
        createdAt: new Date().toISOString(),
      });

      await portalAnimation(`Connected as ${clients.urn ?? alias}`);
      return;
    }

    // --- Interactive OTP flow ---
    const channel = await select({
      message: 'How would you like to receive your OTP?',
      choices: OTP_CHANNELS.map((c) => ({ name: c.name, value: c.value })),
    });

    const selectedChannel = OTP_CHANNELS.find((c) => c.value === channel)!;
    const userAlias = await input({ message: selectedChannel.prompt });

    let _token: string | null = null;
    const sdk = new SDK({
      auth: { type: 'jwt' },
      mode,
      origin: channel,
      tokenStorage: {
        get: () => _token,
        set: (t: string) => { _token = t; },
        clear: () => { _token = null; },
      },
    });

    await sdk.assert(channel, userAlias);
    console.log(selectedChannel.sentMessage);

    const code = await password({ message: 'Enter OTP code:', mask: '*' });
    const clients = await sdk.connect(channel, userAlias, code);

    store.save({
      accessToken: clients.accessToken,
      urn: clients.urn ?? '',
      origin: channel,
      mode,
      authType: 'jwt',
      alias: userAlias,
      createdAt: new Date().toISOString(),
    });

    await portalAnimation(`Connected as ${clients.urn ?? userAlias}`);
  });
