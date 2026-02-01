/**
 * Diagnostic script to check for condition node connections missing sourceHandle
 *
 * This script:
 * 1. Finds all workflows with condition nodes
 * 2. Reports connections from condition nodes without sourceHandle
 * 3. Does NOT modify the database
 *
 * Run with: npx ts-node scripts/check-condition-connections.ts
 */

import { db } from '../lib/db';
import { workflowNodesTable, workflowConnectionsTable, workflowsTable } from '../schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

async function checkConditionConnections() {
  console.log('🔍 Checking for condition node connections without sourceHandle...\n');

  // Find all condition nodes
  const conditionNodes = await db
    .select()
    .from(workflowNodesTable)
    .where(eq(workflowNodesTable.type, 'condition'));

  if (conditionNodes.length === 0) {
    console.log('✅ No condition nodes found in the database.');
    process.exit(0);
  }

  console.log(`Found ${conditionNodes.length} condition node(s)\n`);

  const conditionNodeIds = conditionNodes.map(n => n.id);
  let totalBroken = 0;
  const affectedWorkflows = new Set<number>();

  // Find all connections from condition nodes without sourceHandle
  const brokenConnections = await db
    .select()
    .from(workflowConnectionsTable)
    .where(
      and(
        inArray(workflowConnectionsTable.fromNodeId, conditionNodeIds),
        isNull(workflowConnectionsTable.sourceHandle)
      )
    );

  if (brokenConnections.length === 0) {
    console.log('✅ All condition node connections have sourceHandle set correctly!');
    process.exit(0);
  }

  console.log(`⚠️  Found ${brokenConnections.length} broken connection(s):\n`);

  // Group by workflow
  const byWorkflow = new Map<number, typeof brokenConnections>();
  for (const conn of brokenConnections) {
    const node = conditionNodes.find(n => n.id === conn.fromNodeId);
    if (node) {
      affectedWorkflows.add(node.workflowId);
      if (!byWorkflow.has(node.workflowId)) {
        byWorkflow.set(node.workflowId, []);
      }
      byWorkflow.get(node.workflowId)!.push(conn);
    }
  }

  // Get workflow names
  const workflowIds = Array.from(affectedWorkflows);
  const workflowRecords = await db
    .select()
    .from(workflowsTable)
    .where(inArray(workflowsTable.id, workflowIds));

  const workflowMap = new Map(workflowRecords.map(w => [w.id, w]));

  // Report by workflow
  for (const [workflowId, connections] of byWorkflow.entries()) {
    const workflow = workflowMap.get(workflowId);
    const workflowName = workflow?.name || `Workflow ${workflowId}`;

    console.log(`📋 ${workflowName} (ID: ${workflowId})`);
    for (const conn of connections) {
      console.log(`   ❌ ${conn.fromNodeId} → ${conn.toNodeId} (missing sourceHandle)`);
    }
    console.log('');
    totalBroken += connections.length;
  }

  console.log('='.repeat(60));
  console.log(`⚠️  Summary:`);
  console.log(`   - ${affectedWorkflows.size} workflow(s) affected`);
  console.log(`   - ${totalBroken} connection(s) need to be fixed`);
  console.log('');
  console.log(`💡 To fix these connections, run:`);
  console.log(`   npx ts-node scripts/fix-condition-connections.ts`);
  console.log('='.repeat(60) + '\n');

  process.exit(1);
}

// Run the check
checkConditionConnections().catch(error => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});
