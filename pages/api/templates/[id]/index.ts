import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { db } from "@/lib/db";
import { workflowTemplatesTable, usersTable } from "@/schema";
import { eq, and } from "drizzle-orm";
import { isRateLimited } from "@/lib/rate-limit";
import { validateTemplateData, generateSlug, generateUniqueSlug } from "@/lib/template-utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID"
    });
  }

  const templateId = parseInt(id, 10);

  if (isNaN(templateId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid template ID"
    });
  }

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
      return handleGetTemplate(req, res, templateId);
    } else if (req.method === "PUT") {
      return handleUpdateTemplate(req, res, templateId);
    } else if (req.method === "DELETE") {
      return handleDeleteTemplate(req, res, templateId);
    } else {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }
  } catch (error) {
    console.error("Template detail API error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}

/**
 * GET /api/templates/[id]
 * Get single template with full details
 */
async function handleGetTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  templateId: number
) {
  const session = await getServerSession(req, res, authOptions);

  // Get template
  const templates = await db
    .select()
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Template not found"
    });
  }

  const template = templates[0];

  // Check access permissions
  if (template.visibility === 'private') {
    if (!session?.user?.email) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view private templates"
      });
    }

    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, session.user.email))
      .limit(1);

    if (user.length === 0 || user[0].id !== template.authorId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this template"
      });
    }
  }

  // Parse JSON fields
  const templateWithParsedData = {
    ...template,
    tags: template.tags ? JSON.parse(template.tags) : [],
    nodes: JSON.parse(template.nodes),
    connections: JSON.parse(template.connections),
  };

  return res.status(200).json({
    success: true,
    template: templateWithParsedData,
  });
}

/**
 * PUT /api/templates/[id]
 * Update template metadata (name, description, category, visibility, etc.)
 */
async function handleUpdateTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  templateId: number
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to update templates"
    });
  }

  // Get user
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

  const userId = user[0].id;

  // Get template and verify ownership
  const templates = await db
    .select()
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Template not found"
    });
  }

  const template = templates[0];

  if (template.authorId !== userId) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to update this template"
    });
  }

  const {
    name,
    description,
    category,
    tags,
    icon,
    visibility,
    instructions,
    previewImage,
  } = req.body;

  // Build update object with only provided fields
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (name !== undefined) {
    if (!name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Template name cannot be empty"
      });
    }
    updateData.name = name.trim();

    // If name changed, regenerate slug
    if (name.trim() !== template.name) {
      const baseSlug = generateSlug(name);
      const existingTemplates = await db
        .select({ slug: workflowTemplatesTable.slug })
        .from(workflowTemplatesTable)
        .where(eq(workflowTemplatesTable.id, templateId)); // Exclude current template

      const allTemplates = await db
        .select({ slug: workflowTemplatesTable.slug })
        .from(workflowTemplatesTable);

      const existingSlugs = allTemplates
        .filter(t => t.slug !== template.slug)
        .map(t => t.slug);

      updateData.slug = generateUniqueSlug(baseSlug, existingSlugs);
    }
  }

  if (description !== undefined) {
    updateData.description = description?.trim() || null;
  }

  if (category !== undefined) {
    if (!category.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category cannot be empty"
      });
    }
    updateData.category = category.trim();
  }

  if (tags !== undefined) {
    updateData.tags = tags ? JSON.stringify(tags) : null;
  }

  if (icon !== undefined) {
    updateData.icon = icon || null;
  }

  if (visibility !== undefined) {
    if (!['private', 'public', 'official'].includes(visibility)) {
      return res.status(400).json({
        success: false,
        message: "Invalid visibility value. Must be 'private', 'public', or 'official'"
      });
    }
    // Only allow official if user is admin (for now, we'll allow any user to set it)
    updateData.visibility = visibility;
  }

  if (instructions !== undefined) {
    updateData.instructions = instructions?.trim() || null;
  }

  if (previewImage !== undefined) {
    updateData.previewImage = previewImage || null;
  }

  // Update template
  const [updatedTemplate] = await db
    .update(workflowTemplatesTable)
    .set(updateData)
    .where(eq(workflowTemplatesTable.id, templateId))
    .returning();

  return res.status(200).json({
    success: true,
    template: {
      ...updatedTemplate,
      tags: updatedTemplate.tags ? JSON.parse(updatedTemplate.tags) : [],
      nodes: JSON.parse(updatedTemplate.nodes),
      connections: JSON.parse(updatedTemplate.connections),
    },
  });
}

/**
 * DELETE /api/templates/[id]
 * Delete a template
 */
async function handleDeleteTemplate(
  req: NextApiRequest,
  res: NextApiResponse,
  templateId: number
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({
      success: false,
      message: "You must be signed in to delete templates"
    });
  }

  // Get user
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

  const userId = user[0].id;

  // Get template and verify ownership
  const templates = await db
    .select()
    .from(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, templateId))
    .limit(1);

  if (templates.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Template not found"
    });
  }

  const template = templates[0];

  if (template.authorId !== userId) {
    return res.status(403).json({
      success: false,
      message: "You don't have permission to delete this template"
    });
  }

  // Delete template
  await db
    .delete(workflowTemplatesTable)
    .where(eq(workflowTemplatesTable.id, templateId));

  return res.status(200).json({
    success: true,
    message: "Template deleted successfully"
  });
}
