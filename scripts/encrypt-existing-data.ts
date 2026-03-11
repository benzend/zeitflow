/**
 * One-time migration script to encrypt existing plain-text secrets in the database.
 *
 * This script:
 * 1. Encrypts user API tokens and computes their SHA-256 hashes
 * 2. Encrypts Slack bot tokens
 * 3. Encrypts workflow webhook secrets
 * 4. Encrypts OAuth access/refresh/id tokens in the accounts table
 * 5. Encrypts sensitive keys in workflow node configs
 *
 * Safe to run multiple times — skips already-encrypted values.
 *
 * Usage:
 *   ENCRYPTION_KEY=<key> npx tsx scripts/encrypt-existing-data.ts
 *
 * IMPORTANT: Set ENCRYPTION_KEY in your environment before running.
 * Generate with: openssl rand -hex 32
 */

import { db } from '../lib/db';
import {
  usersTable,
  slackBotsTable,
  workflowsTable,
  workflowNodesTable,
  accountsTable,
} from '../schema';
import { eq } from 'drizzle-orm';
import { encrypt, hashValue, isEncrypted, encryptConfigSecrets } from '../lib/encryption';

async function encryptUserApiTokens() {
  console.log('Encrypting user API tokens...');
  const users = await db.select().from(usersTable);
  let updated = 0;

  for (const user of users) {
    if (!user.apiToken) continue;
    if (isEncrypted(user.apiToken)) {
      console.log(`  Skipping user ${user.id} — already encrypted`);
      continue;
    }

    const plainToken = user.apiToken;
    await db
      .update(usersTable)
      .set({
        apiToken: encrypt(plainToken),
        apiTokenHash: hashValue(plainToken),
      })
      .where(eq(usersTable.id, user.id));
    updated++;
  }

  console.log(`  Encrypted ${updated} of ${users.length} user API tokens`);
}

async function encryptSlackBotTokens() {
  console.log('Encrypting Slack bot tokens...');
  const bots = await db.select().from(slackBotsTable);
  let updated = 0;

  for (const bot of bots) {
    if (isEncrypted(bot.botToken)) {
      console.log(`  Skipping bot ${bot.id} — already encrypted`);
      continue;
    }

    await db
      .update(slackBotsTable)
      .set({ botToken: encrypt(bot.botToken)! })
      .where(eq(slackBotsTable.id, bot.id));
    updated++;
  }

  console.log(`  Encrypted ${updated} of ${bots.length} Slack bot tokens`);
}

async function encryptWebhookSecrets() {
  console.log('Encrypting workflow webhook secrets...');
  const workflows = await db.select().from(workflowsTable);
  let updated = 0;

  for (const workflow of workflows) {
    if (!workflow.webhookSecret) continue;
    if (isEncrypted(workflow.webhookSecret)) {
      console.log(`  Skipping workflow ${workflow.id} — already encrypted`);
      continue;
    }

    await db
      .update(workflowsTable)
      .set({ webhookSecret: encrypt(workflow.webhookSecret) })
      .where(eq(workflowsTable.id, workflow.id));
    updated++;
  }

  console.log(`  Encrypted ${updated} of ${workflows.length} webhook secrets`);
}

async function encryptOAuthTokens() {
  console.log('Encrypting OAuth tokens...');
  const accounts = await db.select().from(accountsTable);
  let updated = 0;

  for (const account of accounts) {
    const updates: Record<string, string | null> = {};
    let needsUpdate = false;

    if (account.access_token && !isEncrypted(account.access_token)) {
      updates.access_token = encrypt(account.access_token);
      needsUpdate = true;
    }
    if (account.refresh_token && !isEncrypted(account.refresh_token)) {
      updates.refresh_token = encrypt(account.refresh_token);
      needsUpdate = true;
    }
    if (account.id_token && !isEncrypted(account.id_token)) {
      updates.id_token = encrypt(account.id_token);
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db
        .update(accountsTable)
        .set(updates)
        .where(
          eq(account.provider === account.provider
            ? accountsTable.providerAccountId
            : accountsTable.userId,
            account.providerAccountId
          )
        );
      updated++;
    }
  }

  console.log(`  Encrypted ${updated} of ${accounts.length} OAuth accounts`);
}

async function encryptNodeConfigs() {
  console.log('Encrypting workflow node configs...');
  const nodes = await db.select().from(workflowNodesTable);
  let updated = 0;

  for (const node of nodes) {
    if (!node.config) continue;

    try {
      const config = JSON.parse(node.config);
      const encrypted = encryptConfigSecrets(config);
      const encryptedStr = JSON.stringify(encrypted);

      // Only update if something changed
      if (encryptedStr !== node.config) {
        await db
          .update(workflowNodesTable)
          .set({ config: encryptedStr })
          .where(eq(workflowNodesTable.id, node.id));
        updated++;
      }
    } catch (err) {
      console.error(`  Error processing node ${node.id}:`, err);
    }
  }

  console.log(`  Encrypted ${updated} of ${nodes.length} node configs`);
}

async function main() {
  console.log('Starting encryption migration...\n');

  if (!process.env.ENCRYPTION_KEY) {
    console.error('ERROR: ENCRYPTION_KEY environment variable is required.');
    console.error('Generate one with: openssl rand -hex 32');
    process.exit(1);
  }

  try {
    await encryptUserApiTokens();
    await encryptSlackBotTokens();
    await encryptWebhookSecrets();
    await encryptOAuthTokens();
    await encryptNodeConfigs();

    console.log('\nEncryption migration completed successfully.');
  } catch (error) {
    console.error('\nEncryption migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

main();
