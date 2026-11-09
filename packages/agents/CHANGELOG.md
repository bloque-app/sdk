# @bloque/sdk-agents

## 0.24.0

### Minor Changes

- 6611b58: Accept optional `skills` URLs on `agents.create()` and add `agents.apps.recommend()`. Catalog and connect work while the agent is still provisioning.

### Patch Changes

- @bloque/sdk-core@0.24.0

## 0.23.0

### Patch Changes

- @bloque/sdk-core@0.23.0

## 0.22.0

### Minor Changes

- 32509cd: Accept optional `environment` extras on `agents.create()`. Provision-owned `BLOQUE_*` keys are rejected with `E_AGENT_ENV_RESERVED`.

### Patch Changes

- @bloque/sdk-core@0.22.0

## 0.21.1

### Patch Changes

- @bloque/sdk-core@0.21.1

## 0.21.0

### Minor Changes

- aa3277c: Add `agents.apps` to list the catalog of connectable apps, list an agent's connections, and start an app connect.

### Patch Changes

- @bloque/sdk-core@0.21.0

## 0.20.0

### Minor Changes

- a6e06e5: Add an `agents` client for the hosted personal agent API: create, list, get, and WhatsApp link.

### Patch Changes

- @bloque/sdk-core@0.20.0
