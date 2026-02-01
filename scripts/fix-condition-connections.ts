/**
 * Migration script to fix condition node connections missing sourceHandle
 *
 * This script:
 * 1. Finds all workflows with condition nodes
 * 2. Identifies connections from condition nodes without sourceHandle
 * 3. Prompts user to assign 'true' or 'false' to each connection
 * 4. Updates the database
 *
 * Run with: npx ts-node scripts/fix-condition-connections.ts
 */

import { db } from '../lib/db';
import { workflowNodesTable, workflowConnectionsTable } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as readline from 'readline';

async function fixConditionConnections() {
  console.log('🔍 Searching for condition nodes with missing sourceHandle values...\n');

  // Find all condition nodes
  const conditionNodes = await db
    .select()
    .from(workflowNodesTable)
    .where(eq(workflowNodesTable.type, 'condition'));

  console.log(`Found ${conditionNodes.length} condition node(s)\n`);

  if (conditionNodes.length === 0) {
    console.log('✅ No condition nodes found. Nothing to fix.');
    process.exit(0);
  }

  let totalFixed = 0;
  let totalSkipped = 0;

  for (const condNode of conditionNodes) {
    // Find connections from this condition node without sourceHandle
    const brokenConnections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(
        and(
          eq(workflowConnectionsTable.fromNodeId, condNode.id),
          isNull(workflowConnectionsTable.sourceHandle)
        )
      );

    if (brokenConnections.length > 0) {
      console.log(`\n📌 Condition node "${condNode.id}" (workflow ${condNode.workflowId})`);
      console.log(`   Found ${brokenConnections.length} connection(s) without sourceHandle:\n`);

      for (const conn of brokenConnections) {
        console.log(`   Connection: ${conn.fromNodeId} → ${conn.toNodeId}`);

        const handle = await askUser(
          `   Should this connection use the 'true' or 'false' path? (true/false/skip): `
        );

        if (handle === 'true' || handle === 'false') {
          await db
            .update(workflowConnectionsTable)
            .set({ sourceHandle: handle })
            .where(eq(workflowConnectionsTable.id, conn.id));

          console.log(`   ✅ Updated to use "${handle}" path\n`);
          totalFixed++;
        } else {
          console.log(`   ⏭️  Skipped\n`);
          totalSkipped++;
        }
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✨ Migration complete!`);
  console.log(`   Fixed: ${totalFixed} connection(s)`);
  console.log(`   Skipped: ${totalSkipped} connection(s)`);
  console.log('='.repeat(50) + '\n');

  process.exit(0);
}

function askUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// Run the migration
fixConditionConnections().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
