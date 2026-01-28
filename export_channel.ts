#!/usr/bin/env node
import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import fs from 'fs';

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  console.error('Set SLACK_BOT_TOKEN in your .env file');
  process.exit(1);
}

const client = new WebClient(token);

interface SlackMessage {
  ts?: string;
  user?: string;
  username?: string;
  text?: string;
}

interface UsersInfoResponseUser {
  real_name?: string;
  name?: string;
}

async function exportMessages(
  channel: string,
  oldestDateStr: string,
  latestDateStr: string,
  outPath: string
): Promise<void> {
  const oldestTs = Date.parse(oldestDateStr) / 1000;
  const latestTs = (Date.parse(latestDateStr) + 24 * 60 * 60 * 1000 - 1) / 1000; // include entire end day

  let cursor: string | undefined;
  const messages: SlackMessage[] = [];

  do {
    const res = await client.conversations.history({
      channel,
      oldest: oldestTs.toString(),
      latest: latestTs.toString(),
      inclusive: true,
      limit: 200,
      cursor,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const batch = (res.messages || []) as any[];
    for (const m of batch) {
      messages.push({
        ts: m.ts,
        user: m.user,
        username: m.username,
        text: m.text,
      });
    }

    cursor =
      res.response_metadata && res.response_metadata.next_cursor
        ? res.response_metadata.next_cursor
        : undefined;
  } while (cursor);

  // Order chronologically
  messages.sort((a, b) => Number(a.ts ?? 0) - Number(b.ts ?? 0));

  // Build user ID → name map
  const userIds = [...new Set(messages.map((m) => m.user).filter(Boolean))] as string[];
  const userNames: Record<string, string> = {};

  for (const userId of userIds) {
    try {
      const res = await client.users.info({ user: userId });
      const u = (res.user || {}) as UsersInfoResponseUser;
      userNames[userId] = u.real_name || u.name || userId;
    } catch {
      userNames[userId] = userId;
    }
  }

  // Build Markdown lines
  const lines = messages.map((m) => {
    const tsSeconds = Number((m.ts || '0').split('.')[0]);
    const dateIso = new Date(tsSeconds * 1000).toISOString();
    const author = userNames[m.user ?? ''] || m.username || 'Unknown';
    const text = (m.text || '').replace(/\n/g, '  \n'); // preserve line breaks in Markdown
    return `- **${dateIso}** — _${author}_: ${text}`;
  });

  const header = `# Export of <#${channel}> from ${oldestDateStr} to ${latestDateStr}`;
  const body = lines.join('\n');
  const md = `${header}\n\n${body}\n`;

  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`Wrote ${messages.length} messages to ${outPath}`);
}

async function main(): Promise<void> {
  const [, , channel, oldest, latest, out] = process.argv;

  if (!channel || !oldest || !latest) {
    console.error('Usage: export_channel CHANNEL_ID YYYY-MM-DD YYYY-MM-DD [output.md]');
    process.exit(1);
  }

  const outPath = out || `export-${channel}-${oldest}-to-${latest}.md`;
  await exportMessages(channel, oldest, latest, outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
