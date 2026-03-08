import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { db } from "@/lib/db";
import {
  workflowTemplatesTable,
  usersTable,
  workflowsTable,
  workflowNodesTable,
  workflowConnectionsTable,
} from "@/schema";
import { eq, or, and, like, desc, sql } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";
import {
  sanitizeNodes,
  generateSlug,
  generateUniqueSlug,
  validateTemplateData,
} from "@/lib/template-utils";
import { NodeData, Connection } from "@/lib/workflow-types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get client IP for rate limiting
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const clientIp = Array.isArray(ip) ? ip[0] : ip;

  const isLimited = await isRateLimited({
    key: `templates:${clientIp}`,
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100
  });

  if (isLimited) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later."
    });
  }

  try {
    if (req.method === "GET") {
      return handleGetTemplates(req, res);
    } else if (req.method === "POST") {
      return handleCreateTemplate(req, res);
    } else {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }
  } catch (error) {
    console.error("Templates API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/**
 * GET /api/templates
 * List templates with filtering
 */
async function handleGetTemplates(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  // Extract query parameters
  const {
    visibility,
    category,
    search,
    authorId,
    limit = '50',
    offset = '0'
  } = req.query;

  const limitNum = parseInt(limit as string, 10);
  const offsetNum = parseInt(offset as string, 10);

  // Build where conditions
  const conditions = [];

  // Visibility filter - if user is logged in, show their private templates plus public/official
  if (session?.user?.email) {
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    const userId = user.length > 0 ? user[0].id : null;

    if (visibility === 'private') {
      // Only show user's private templates
      if (userId) {
        conditions.push(
          and(
            eq(workflowTemplatesTable.visibility, 'private'),
            eq(workflowTemplatesTable.authorId, userId)
          )
        );
      }
    } else if (visibility === 'public') {
      conditions.push(eq(workflowTemplatesTable.visibility, 'public'));
    } else if (visibility === 'official') {
      conditions.push(eq(workflowTemplatesTable.visibility, 'official'));
    } else {
      // Show all templates user has access to (their private + public + official)
      if (userId) {
        conditions.push(
          or(
            eq(workflowTemplatesTable.visibility, 'official'),
            eq(workflowTemplatesTable.visibility, 'public'),
            and(
              eq(workflowTemplatesTable.visibility, 'private'),
              eq(workflowTemplatesTable.authorId, userId)
            )
          )
        );
      } else {
        // User not found in DB, show public and official only
        conditions.push(
          or(
            eq(workflowTemplatesTable.visibility, 'official'),
            eq(workflowTemplatesTable.visibility, 'public')
          )
        );
      }
    }
  } else {
    // Not logged in - only show public and official templates
    conditions.push(
      or(
        eq(workflowTemplatesTable.visibility, 'official'),
        eq(workflowTemplatesTable.visibility, 'public')
      )
    );
  }

  // Category filter
  if (category && typeof category === 'string') {
    conditions.push(eq(workflowTemplatesTable.category, category));
  }

  // Author filter
  if (authorId && typeof authorId === 'string') {
    conditions.push(eq(workflowTemplatesTable.authorId, authorId));
  }

  // Search filter (name or description)
  if (search && typeof search === 'string') {
    const searchPattern = `%${search}%`;
    conditions.push(
      or(
        like(workflowTemplatesTable.name, searchPattern),
        like(workflowTemplatesTable.description, searchPattern)
      )
    );
  }

  // Combine all conditions
  const whereClause = conditions.length > 0
    ? and(...conditions)
    : undefined;

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(workflowTemplatesTable)
    .where(whereClause);

  const total = countResult[0]?.count || 0;

  // Get templates (exclude nodes and connections for list view)
  const templates = await db
    .select({
      id: workflowTemplatesTable.id,
      name: workflowTemplatesTable.name,
      description: workflowTemplatesTable.description,
      slug: workflowTemplatesTable.slug,
      category: workflowTemplatesTable.category,
      tags: workflowTemplatesTable.tags,
      icon: workflowTemplatesTable.icon,
      visibility: workflowTemplatesTable.visibility,
      authorName: workflowTemplatesTable.authorName,
      useCount: workflowTemplatesTable.useCount,
      previewImage: workflowTemplatesTable.previewImage,
      createdAt: workflowTemplatesTable.createdAt,
    })
    .from(workflowTemplatesTable)
    .where(whereClause)
    .orderBy(desc(workflowTemplatesTable.useCount))
    .limit(limitNum)
    .offset(offsetNum);

  // Parse tags JSON
  const templatesWithParsedTags = templates.map(t => ({
    ...t,
    tags: t.tags ? JSON.parse(t.tags) : [],
  }));

  return res.status(200).json({
    success: true,
    templates: templatesWithParsedTags,
    total,
  });
}

/**
 * POST /api/templates
 * Create a new template from workflow or manually
 */
async function handleCreateTemplate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let userId: string;
  let userName: string;

  // Support both session auth and API token auth (for CLI/MCP)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const apiToken = authHeader.substring(7);
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.apiToken, apiToken))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid API token"
      });
    }

    userId = user[0].id;
    userName = user[0].name || 'Anonymous';
  } else {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        message: "You must be signed in to create templates"
      });
    }

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    userId = user[0].id;
    userName = user[0].name || session.user.name || 'Anonymous';
  }

  const {
    name,
    description,
    category,
    tags,
    icon,
    visibility = 'private',
    sourceWorkflowId,
    nodes: providedNodes,
    connections: providedConnections,
    instructions,
    previewImage,
  } = req.body;

  let nodes: NodeData[] = [];
  let connections: Connection[] = [];
  let sourceWorkflowIdFinal: number | null = null;

  // Get nodes and connections from source workflow or use provided ones
  if (sourceWorkflowId) {
    // Verify user owns the workflow
    const workflow = await db
      .select()
      .from(workflowsTable)
      .where(
        and(
          eq(workflowsTable.id, sourceWorkflowId),
          eq(workflowsTable.userId, userId)
        )
      )
      .limit(1);

    if (workflow.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Workflow not found or you don't have access"
      });
    }

    // Fetch workflow nodes and connections
    const workflowNodes = await db
      .select()
      .from(workflowNodesTable)
      .where(eq(workflowNodesTable.workflowId, sourceWorkflowId));

    const workflowConnections = await db
      .select()
      .from(workflowConnectionsTable)
      .where(eq(workflowConnectionsTable.workflowId, sourceWorkflowId));

    // Convert to NodeData and Connection format
    nodes = workflowNodes.map(node => ({
      id: node.id,
      type: node.type as any,
      x: node.positionX,
      y: node.positionY,
      label: node.label,
      entryType: node.entryType || undefined,
      ...(node.config ? JSON.parse(node.config) : {}),
    }));

    connections = workflowConnections.map(conn => ({
      from: conn.fromNodeId,
      to: conn.toNodeId,
      sourceHandle: conn.sourceHandle || undefined,
      targetHandle: conn.targetHandle || undefined,
    }));

    sourceWorkflowIdFinal = sourceWorkflowId;
  } else if (providedNodes && providedConnections) {
    nodes = providedNodes;
    connections = providedConnections;
  } else {
    return res.status(400).json({
      success: false,
      message: "Either sourceWorkflowId or nodes/connections must be provided"
    });
  }

  // Validate template data
  const validationErrors = validateTemplateData({
    name,
    category,
    nodes,
    connections,
  });

  if (validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: validationErrors,
    });
  }

  // Sanitize nodes to remove sensitive data
  const sanitizedNodes = sanitizeNodes(nodes);

  // Generate slug
  const baseSlug = generateSlug(name);
  const existingTemplates = await db
    .select({ slug: workflowTemplatesTable.slug })
    .from(workflowTemplatesTable);
  const existingSlugs = existingTemplates.map(t => t.slug);
  const uniqueSlug = generateUniqueSlug(baseSlug, existingSlugs);

  // Create template
  const [template] = await db
    .insert(workflowTemplatesTable)
    .values({
      name: name.trim(),
      description: description?.trim() || null,
      slug: uniqueSlug,
      category: category.trim(),
      tags: tags ? JSON.stringify(tags) : null,
      icon: icon || null,
      visibility: visibility,
      authorId: userId,
      authorName: userName,
      nodes: JSON.stringify(sanitizedNodes),
      connections: JSON.stringify(connections),
      instructions: instructions?.trim() || null,
      previewImage: previewImage || null,
      sourceWorkflowId: sourceWorkflowIdFinal,
      updatedAt: new Date(),
    })
    .returning();

  return res.status(201).json({
    success: true,
    template: {
      ...template,
      tags: template.tags ? JSON.parse(template.tags) : [],
      nodes: JSON.parse(template.nodes),
      connections: JSON.parse(template.connections),
    },
  });
}
