#!/usr/bin/env bun

import { createCli } from '../src/bin.js';

await createCli().parseAsync(process.argv);
