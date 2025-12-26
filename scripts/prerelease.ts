#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

const pkg = require(`${cwd()}/package.json`);

const projectRoot = join(cwd(), 'package.json');

Reflect.deleteProperty(pkg, 'scripts');
Reflect.deleteProperty(pkg, 'devDependencies');

writeFileSync(projectRoot, JSON.stringify(pkg, null, '  '));
