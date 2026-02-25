/**
 * Google Drive Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Google Drive integration.
 * Uses Google Drive REST API v3.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { GoogleDriveConfig } from '../definitions/google-drive';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Get auth headers for Google Drive API
 */
function getDriveHeaders(config: GoogleDriveConfig): Record<string, string> | null {
  const token = config.accessToken || process.env.GOOGLE_DRIVE_ACCESS_TOKEN;
  if (!token) return null;
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Execute the Google Drive integration
 */
export async function executeGoogleDrive(
  config: GoogleDriveConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('google_drive_execute');

  logger.info('Starting Google Drive operation', {
    action: config.action,
  });

  const authHeaders = getDriveHeaders(config);
  if (!authHeaders) {
    logger.error('Google Drive access token not configured');
    endTimer();
    return {
      success: false,
      error: 'Google Drive access token not configured. Set GOOGLE_DRIVE_ACCESS_TOKEN env var or provide it in the node config.',
      data: { status: 'failed', error: 'Missing access token' },
    };
  }

  try {
    switch (config.action) {
      case 'upload_file':
        return await uploadFile(config, authHeaders, context, logger, endTimer);
      case 'create_folder':
        return await createFolder(config, authHeaders, context, logger, endTimer);
      case 'list_files':
        return await listFiles(config, authHeaders, context, logger, endTimer);
      case 'share_file':
        return await shareFile(config, authHeaders, context, logger, endTimer);
      default:
        logger.error('Unknown action', { action: config.action });
        endTimer();
        return {
          success: false,
          error: `Unknown Google Drive action: ${config.action}`,
          data: { status: 'failed', error: 'Unknown action' },
        };
    }
  } catch (error) {
    endTimer();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Google Drive operation failed', { error: errorMessage });
    return {
      success: false,
      error: `Google Drive operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}

async function uploadFile(
  config: GoogleDriveConfig,
  authHeaders: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const fileName = context.substituteVariables(config.fileName || '');
  const fileContent = context.substituteVariables(config.fileContent || '');
  const folderId = context.substituteVariables(config.folderId || '');

  if (!fileName) {
    logger.error('No file name specified');
    endTimer();
    return {
      success: false,
      error: 'File name is required to upload a file',
      data: { status: 'failed', error: 'Missing file name' },
    };
  }

  logger.debug('Uploading file', { fileName, mimeType: config.mimeType });

  // Use multipart upload
  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: config.mimeType || 'text/plain',
  };
  if (folderId) metadata.parents = [folderId];

  const boundary = 'zeitflow_boundary_' + Date.now();
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${config.mimeType || 'text/plain'}`,
    '',
    fileContent,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Drive API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Google Drive API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('File uploaded', { fileId: data.id, url: data.webViewLink });

  return {
    success: true,
    data: {
      status: 'uploaded',
      fileId: data.id,
      url: data.webViewLink,
    },
  };
}

async function createFolder(
  config: GoogleDriveConfig,
  authHeaders: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const folderName = context.substituteVariables(config.folderName || '');
  const parentId = context.substituteVariables(config.folderId || '');

  if (!folderName) {
    logger.error('No folder name specified');
    endTimer();
    return {
      success: false,
      error: 'Folder name is required',
      data: { status: 'failed', error: 'Missing folder name' },
    };
  }

  logger.debug('Creating folder', { folderName });

  const metadata: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const response = await fetch(`${DRIVE_API}/files?fields=id,name,webViewLink`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Drive API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Google Drive API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Folder created', { fileId: data.id, url: data.webViewLink });

  return {
    success: true,
    data: {
      status: 'created',
      fileId: data.id,
      url: data.webViewLink,
    },
  };
}

async function listFiles(
  config: GoogleDriveConfig,
  authHeaders: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const query = context.substituteVariables(config.query || '');
  const folderId = context.substituteVariables(config.folderId || '');

  let q = query;
  if (!q && folderId) {
    q = `'${folderId}' in parents and trashed = false`;
  } else if (!q) {
    q = 'trashed = false';
  }

  logger.debug('Listing files', { query: q });

  const params = new URLSearchParams({
    q,
    fields: 'files(id,name,mimeType,webViewLink,modifiedTime,size)',
    pageSize: '100',
    orderBy: 'modifiedTime desc',
  });

  const response = await fetch(`${DRIVE_API}/files?${params}`, {
    method: 'GET',
    headers: authHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Drive API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Google Drive API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  const data = await response.json();
  endTimer();
  logger.info('Files listed', { count: data.files?.length || 0 });

  return {
    success: true,
    data: {
      status: 'listed',
      files: data.files || [],
      fileCount: data.files?.length || 0,
    },
  };
}

async function shareFile(
  config: GoogleDriveConfig,
  authHeaders: Record<string, string>,
  context: ExecutionContext,
  logger: ExecutionContext['logger'],
  endTimer: () => void
): Promise<IntegrationResult> {
  const fileId = context.substituteVariables(config.fileId || '');
  const shareEmail = context.substituteVariables(config.shareEmail || '');

  if (!fileId) {
    logger.error('No file ID specified');
    endTimer();
    return {
      success: false,
      error: 'File ID is required to share a file',
      data: { status: 'failed', error: 'Missing file ID' },
    };
  }

  if (!shareEmail) {
    logger.error('No share email specified');
    endTimer();
    return {
      success: false,
      error: 'Email is required to share a file',
      data: { status: 'failed', error: 'Missing email' },
    };
  }

  logger.debug('Sharing file', { fileId, shareEmail, role: config.shareRole });

  const response = await fetch(`${DRIVE_API}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'user',
      role: config.shareRole || 'reader',
      emailAddress: shareEmail,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    endTimer();
    logger.error('Drive API error', { status: response.status, error: errorText });
    return {
      success: false,
      error: `Google Drive API error: ${response.status} ${response.statusText}`,
      data: { status: 'failed', error: errorText },
    };
  }

  endTimer();
  logger.info('File shared', { fileId, shareEmail });

  return {
    success: true,
    data: {
      status: 'shared',
      fileId,
      url: `https://drive.google.com/file/d/${fileId}/view`,
    },
  };
}
