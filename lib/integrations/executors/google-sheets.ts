/**
 * Google Sheets Integration Executor (Server-Side Only)
 *
 * This file contains the server-side execution logic for the Google Sheets integration.
 * It should only be imported in server-side code (API routes, server components).
 */

import { ExecutionContext, IntegrationResult } from '../types';
import { GoogleSheetsConfig } from '../definitions/google-sheets';
import { db } from '@/lib/db';
import { accountsTable } from '@/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '../../encryption';

/**
 * Execute the Google Sheets integration
 */
export async function executeGoogleSheets(
  config: GoogleSheetsConfig,
  context: ExecutionContext
): Promise<IntegrationResult> {
  const { logger } = context;
  const endTimer = logger.startTimer('google_sheets_execute');

  logger.info('Starting Google Sheets operation', {
    mode: config.mode,
    hasSpreadsheetId: !!config.spreadsheetId,
    hasRange: !!config.range,
  });

  // Substitute variables
  const spreadsheetId = context.substituteVariables(config.spreadsheetId || '');
  const range = context.substituteVariables(config.range || '');
  const valuesRaw = context.substituteVariables(config.values || '');

  // Validate spreadsheet ID
  if (!spreadsheetId) {
    logger.error('No spreadsheet ID specified');
    endTimer();
    return {
      success: false,
      error: 'No spreadsheet ID specified',
      data: { status: 'failed', error: 'Missing spreadsheet ID' },
    };
  }

  // Validate range
  if (!range) {
    logger.error('No range specified');
    endTimer();
    return {
      success: false,
      error: 'No range specified',
      data: { status: 'failed', error: 'Missing range' },
    };
  }

  // For write operations, validate values
  if ((config.mode === 'append' || config.mode === 'update') && !valuesRaw) {
    logger.error('No values specified for write operation');
    endTimer();
    return {
      success: false,
      error: 'No values specified. Provide a JSON array of rows for append/update operations.',
      data: { status: 'failed', error: 'Missing values' },
    };
  }

  // Parse values if provided
  let values: unknown[][] | undefined;
  if (valuesRaw) {
    try {
      values = JSON.parse(valuesRaw);
    } catch {
      logger.error('Invalid JSON in values');
      endTimer();
      return {
        success: false,
        error: 'Invalid JSON in values field. Values must be a JSON array of arrays.',
        data: { status: 'failed', error: 'Invalid JSON values' },
      };
    }
  }

  try {
    // Look up Google account credentials
    const userAccounts = await db
      .select()
      .from(accountsTable)
      .where(
        and(
          eq(accountsTable.userId, context.userId),
          eq(accountsTable.provider, 'google')
        )
      )
      .limit(1);

    if (userAccounts.length === 0) {
      logger.error('No Google account connected');
      endTimer();
      return {
        success: false,
        error: 'No Google account connected. Please connect your Google account in Settings.',
        data: { status: 'failed', error: 'No Google account' },
      };
    }

    const account = userAccounts[0];
    const { google } = await import('googleapis');

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: decrypt(account.access_token),
      refresh_token: decrypt(account.refresh_token),
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (config.mode === 'read') {
      logger.debug('Reading from spreadsheet', { spreadsheetId, range });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values || [];

      endTimer();
      logger.info('Read completed', { rowCount: rows.length });

      return {
        success: true,
        data: {
          status: 'read',
          rows,
          rowCount: rows.length,
        },
      };
    } else if (config.mode === 'append') {
      logger.debug('Appending to spreadsheet', { spreadsheetId, range });

      const response = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      const updatedRows = response.data.updates?.updatedRows || 0;

      endTimer();
      logger.info('Append completed', { updatedRows });

      return {
        success: true,
        data: {
          status: 'appended',
          updatedRows,
          updatedRange: response.data.updates?.updatedRange,
        },
      };
    } else {
      // update
      logger.debug('Updating spreadsheet', { spreadsheetId, range });

      const response = await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });

      const updatedRows = response.data.updatedRows || 0;

      endTimer();
      logger.info('Update completed', { updatedRows });

      return {
        success: true,
        data: {
          status: 'updated',
          updatedRows,
          updatedRange: response.data.updatedRange,
        },
      };
    }
  } catch (error) {
    endTimer();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Google Sheets operation failed', { error: errorMessage });

    return {
      success: false,
      error: `Google Sheets operation failed: ${errorMessage}`,
      data: { status: 'failed', error: errorMessage },
    };
  }
}
