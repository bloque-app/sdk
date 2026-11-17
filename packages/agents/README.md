# `@bloque/sdk-agents`

Hosted personal agent client. One agent per Bloque user.

## Register a user, deploy the agent, generate onboarding, connect an app, link WhatsApp

Origin-key backend registers the identity. User-scoped clients create the hosted
agent (that is the deploy: signup → hosted VM). Apps catalog, recommend, and
connect work while `provisioning`. WhatsApp `link()` still requires `ready`.
Do not log `connectUrl`.

```typescript
import { Bloque } from '@bloque/sdk';

const bloque = new Bloque({
  apiUrl: 'https://api.dev-bloque.app/api',
  origin: 'acme',
  originKey: process.env.BLOQUE_ORIGIN_KEY!,
});

const clients = await bloque.register('user-123', {
  type: 'individual',
  profile: { firstName: 'Ada', lastName: 'Lovelace' },
});
// The identity JWT must include agent.write, agent.read, and api-key.create
// (origin default user scopes). Create mints a `bloque-agent` key from those.

const agent = await clients.agents.create({
  name: 'Ada',
  environment: [{ key: 'FOO', value: 'bar', secret: true }],
  skills: [
    { url: 'https://example.com/skills/plants/SKILL.md' },
    { url: 'https://example.com/skills/travel.zip' },
  ],
});
// agent.status === "provisioning" — the hosted VM is deploying
// Custom skill URLs are fetched on VM boot (.md or .zip).

let onboarding = await clients.agents.apps.recommend({
  about: 'imports coffee and invoices in Gmail',
  name: 'Ada',
});
while (onboarding.status === 'pending') {
  await new Promise((r) => setTimeout(r, 2000));
  onboarding = await clients.agents.onboarding.get(onboarding.id);
}

let current = agent;
while (current.status === 'provisioning') {
  await new Promise((r) => setTimeout(r, 2000));
  current = await clients.agents.get(agent.urn);
}

const channel = await clients.agents.whatsapp.link(agent.urn, {
  phone: '+573001234567',
});
// Hand channel.connectUrl to the owner. Do not log it.

const { data: apps } = await clients.agents.apps.list(agent.urn);
```
