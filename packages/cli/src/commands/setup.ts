import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Command } from 'commander';
import { SDK } from '@bloque/sdk';
import { checkbox, confirm, input, password, select } from '@inquirer/prompts';

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

interface AgentDef {
  id: string;
  name: string;
  configPath: string;
  skillAgent?: string;
  detect: () => boolean;
}

const PLATFORM = process.platform;
const HOME = os.homedir();
const APPDATA = process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming');
const LOCAL_APPDATA = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local');

function hasCommand(bin: string): boolean {
  try {
    const cmd = PLATFORM === 'win32' ? `where ${bin} 2>nul` : `which ${bin} 2>/dev/null`;
    execSync(cmd, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function hasMacApp(bundleId: string): boolean {
  if (PLATFORM !== 'darwin') return false;
  try {
    const result = execSync(
      `mdfind "kMDItemCFBundleIdentifier == '${bundleId}'" 2>/dev/null`,
      { stdio: 'pipe', encoding: 'utf-8' },
    );
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

function hasWindowsApp(...relativePaths: string[]): boolean {
  if (PLATFORM !== 'win32') return false;
  return relativePaths.some((p) => fs.existsSync(path.join(LOCAL_APPDATA, p)));
}

function hasLinuxDesktop(desktopName: string): boolean {
  if (PLATFORM !== 'linux') return false;
  const dirs = [
    '/usr/share/applications',
    path.join(HOME, '.local', 'share', 'applications'),
    '/var/lib/snapd/desktop/applications',
  ];
  return dirs.some((d) => fs.existsSync(path.join(d, desktopName)));
}

function claudeDesktopConfigPath(): string {
  if (PLATFORM === 'win32')
    return path.join(APPDATA, 'Claude', 'claude_desktop_config.json');
  if (PLATFORM === 'linux')
    return path.join(HOME, '.config', 'Claude', 'claude_desktop_config.json');
  return path.join(HOME, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
}

const AGENTS: AgentDef[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    configPath: path.join(HOME, '.cursor', 'mcp.json'),
    skillAgent: 'cursor',
    detect: () =>
      hasMacApp('com.todesktop.230313mzl4w4u92') ||
      hasWindowsApp('Programs\\cursor\\Cursor.exe') ||
      hasLinuxDesktop('cursor.desktop') ||
      hasCommand('cursor') ||
      fs.existsSync(path.join(HOME, '.cursor')),
  },
  {
    id: 'claude-desktop',
    name: 'Claude Desktop',
    configPath: claudeDesktopConfigPath(),
    detect: () =>
      hasMacApp('com.anthropic.claudefordesktop') ||
      hasWindowsApp('AnthropicClaude\\Claude.exe', 'Programs\\Claude\\Claude.exe') ||
      hasLinuxDesktop('claude-desktop.desktop') ||
      hasCommand('claude-desktop'),
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    configPath: path.join(HOME, '.claude.json'),
    skillAgent: 'claude-code',
    detect: () => hasCommand('claude'),
  },
  {
    id: 'antigravity',
    name: 'Antigravity (Google)',
    configPath: path.join(HOME, '.gemini', 'antigravity', 'mcp_config.json'),
    skillAgent: 'gemini-cli',
    detect: () => hasCommand('gemini'),
  },
];

const MCP_ENTRY = {
  command: 'npx',
  args: ['-y', '@bloque/cli', 'mcp'],
};

function detectInstalled(): AgentDef[] {
  return AGENTS.filter((agent) => {
    try {
      return agent.detect();
    } catch {
      return false;
    }
  });
}

function readJsonFile(filePath: string): Record<string, any> {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeJsonFile(filePath: string, data: Record<string, any>): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function injectMcpConfig(agent: AgentDef): { action: string } {
  const config = readJsonFile(agent.configPath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  if (config.mcpServers.bloque) {
    return { action: 'exists' };
  }

  config.mcpServers.bloque = MCP_ENTRY;
  writeJsonFile(agent.configPath, config);
  return { action: 'added' };
}

function installSkills(agents: AgentDef[]): boolean {
  const skillAgents = agents.filter((a) => a.skillAgent).map((a) => a.skillAgent!);
  if (skillAgents.length === 0) return false;

  const agentFlags = skillAgents.map((a) => `-a ${a}`).join(' ');
  try {
    execSync(
      `npx -y skills add bloque-app/skills --skill bloque-sdk-ts -g ${agentFlags} -y`,
      { stdio: 'pipe', timeout: 120_000 },
    );
    return true;
  } catch {
    return false;
  }
}

async function runOtpLogin(mode: 'production' | 'sandbox'): Promise<void> {
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
}

export const setupCommand = new Command('setup')
  .description('Set up Bloque MCP in your AI code agents')
  .option('--jwt <token>', 'JWT token for authentication (skips OTP)')
  .option('--sandbox', 'Use sandbox environment instead of production')
  .action(async (opts) => {
    const { jwt, sandbox } = opts as { jwt?: string; sandbox?: boolean };
    const mode = sandbox ? 'sandbox' : 'production';

    console.log('\n  Bloque Setup Wizard\n');

    // --- Step 1: Authenticate ---
    if (jwt) {
      store.save({
        accessToken: jwt,
        urn: '',
        origin: 'cli',
        mode,
        authType: 'jwt',
        createdAt: new Date().toISOString(),
      });
      console.log('  Session saved from JWT token.\n');
    } else if (store.exists()) {
      const session = store.load()!;
      console.log(`  Already logged in (${session.alias || session.urn || 'session found'}).`);
      const reuse = await confirm({ message: 'Use existing session?', default: true });
      if (!reuse) {
        await runOtpLogin(mode);
      } else {
        console.log();
      }
    } else {
      console.log('  No session found. Let\'s log in first.\n');
      await runOtpLogin(mode);
    }

    // --- Step 2: Detect agents ---
    const detected = detectInstalled();
    const detectedIds = new Set(detected.map((a) => a.id));

    if (AGENTS.length === 0) {
      console.log('  No supported AI agents found on this system.');
      return;
    }

    const choices = AGENTS.map((agent) => ({
      name: detectedIds.has(agent.id)
        ? `${agent.name} (detected)`
        : `${agent.name}`,
      value: agent.id,
      checked: detectedIds.has(agent.id),
    }));

    const selectedIds = await checkbox({
      message: 'Which agents should Bloque be installed in?',
      choices,
    });

    if (selectedIds.length === 0) {
      console.log('\n  No agents selected. Setup complete.\n');
      return;
    }

    const selectedAgents = AGENTS.filter((a) => selectedIds.includes(a.id));

    // --- Step 3: Install MCP config ---
    console.log('\n  Installing MCP server config...\n');

    const mcpResults: { agent: string; result: string }[] = [];

    for (const agent of selectedAgents) {
      const { action } = injectMcpConfig(agent);

      if (action === 'exists') {
        const overwrite = await confirm({
          message: `  ${agent.name}: bloque MCP already configured. Overwrite?`,
          default: false,
        });
        if (overwrite) {
          const config = readJsonFile(agent.configPath);
          config.mcpServers.bloque = MCP_ENTRY;
          writeJsonFile(agent.configPath, config);
          mcpResults.push({ agent: agent.name, result: 'overwritten' });
        } else {
          mcpResults.push({ agent: agent.name, result: 'skipped (already configured)' });
        }
      } else {
        mcpResults.push({ agent: agent.name, result: 'added' });
      }
    }

    for (const r of mcpResults) {
      console.log(`    ${r.agent}: ${r.result}`);
    }

    // --- Step 4: Install skill ---
    const agentsWithSkill = selectedAgents.filter((a) => a.skillAgent);

    if (agentsWithSkill.length > 0) {
      const names = agentsWithSkill.map((a) => a.name).join(', ');
      process.stdout.write(`\n  Installing Bloque SDK skill globally for ${names}...`);
      const ok = installSkills(agentsWithSkill);
      console.log(ok ? ' done\n' : ' failed (you can install manually later)\n');
    }

    // --- Summary ---
    await portalAnimation('Setup complete');

    console.log('  What was configured:\n');
    for (const r of mcpResults) {
      console.log(`    \x1b[38;5;75m▸\x1b[0m ${r.agent}: MCP server ${r.result}`);
    }
    if (agentsWithSkill.length > 0) {
      console.log(`    \x1b[38;5;75m▸\x1b[0m Bloque SDK skill: ${agentsWithSkill.map((a) => a.name).join(', ')}`);
    }

    console.log('\n  Next steps:\n');
    console.log('    1. Restart your AI agent(s) for changes to take effect');
    console.log('    2. Ask your agent to use the Bloque tools');
    console.log('    3. Run `bloque mcp --http` if you need HTTP transport\n');
  });
