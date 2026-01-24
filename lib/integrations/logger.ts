import { LogLevel, LogEntry, IntegrationLogger } from './types';

/**
 * Configuration for the integration logger
 */
export interface LoggerConfig {
  /** Minimum log level to record (default: 'info' in production, 'debug' in development) */
  minLevel?: LogLevel;
  /** Whether to output to console (default: true in development) */
  consoleOutput?: boolean;
  /** Custom log handler for external logging systems */
  onLog?: (entry: LogEntry) => void;
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Console color codes for different log levels
 */
const LOG_LEVEL_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

/**
 * Creates a structured logger for integration execution.
 */
export function createIntegrationLogger(
  integrationId: string,
  nodeId: string,
  executionId: string,
  config: LoggerConfig = {}
): IntegrationLogger {
  const entries: LogEntry[] = [];
  const isDev = process.env.NODE_ENV !== 'production';
  const minLevel = config.minLevel ?? (isDev ? 'debug' : 'info');
  const consoleOutput = config.consoleOutput ?? isDev;
  const minPriority = LOG_LEVEL_PRIORITY[minLevel];

  const log = (level: LogLevel, message: string, data?: Record<string, unknown>, durationMs?: number) => {
    // Skip if below minimum level
    if (LOG_LEVEL_PRIORITY[level] < minPriority) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      integrationId,
      nodeId,
      executionId,
      message,
      data,
      durationMs,
    };

    entries.push(entry);

    // Console output
    if (consoleOutput) {
      const prefix = `${LOG_LEVEL_COLORS[level]}[${level.toUpperCase()}]${RESET_COLOR}`;
      const context = `[${integrationId}:${nodeId.slice(0, 8)}]`;
      const timing = durationMs !== undefined ? ` (${durationMs}ms)` : '';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.log(`${prefix} ${context} ${message}${timing}${dataStr}`);
    }

    // Custom handler
    if (config.onLog) {
      config.onLog(entry);
    }
  };

  const timers = new Map<string, number>();

  return {
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),

    startTimer: (operation: string) => {
      const startTime = performance.now();
      timers.set(operation, startTime);
      log('debug', `Starting: ${operation}`);

      return () => {
        const endTime = performance.now();
        const start = timers.get(operation);
        if (start !== undefined) {
          const durationMs = Math.round(endTime - start);
          timers.delete(operation);
          log('debug', `Completed: ${operation}`, undefined, durationMs);
        }
      };
    },

    getEntries: () => [...entries],
  };
}

/**
 * Aggregate logs from multiple node executions
 */
export interface ExecutionLogSummary {
  executionId: string;
  totalDurationMs: number;
  nodeCount: number;
  entries: LogEntry[];
  errorCount: number;
  warnCount: number;
}

/**
 * Creates an aggregate log summary from multiple logger instances
 */
export function aggregateLogs(
  executionId: string,
  loggers: IntegrationLogger[],
  totalDurationMs: number
): ExecutionLogSummary {
  const allEntries = loggers.flatMap(l => l.getEntries());

  return {
    executionId,
    totalDurationMs,
    nodeCount: loggers.length,
    entries: allEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
    errorCount: allEntries.filter(e => e.level === 'error').length,
    warnCount: allEntries.filter(e => e.level === 'warn').length,
  };
}

/**
 * Format log entries for human-readable output
 */
export function formatLogEntries(entries: LogEntry[]): string {
  return entries
    .map(entry => {
      const time = entry.timestamp.toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const context = `[${entry.integrationId}:${entry.nodeId.slice(0, 8)}]`;
      const timing = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : '';
      const data = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : '';
      return `${time} ${level} ${context} ${entry.message}${timing}${data}`;
    })
    .join('\n');
}

/**
 * Filter log entries by criteria
 */
export function filterLogs(
  entries: LogEntry[],
  criteria: {
    level?: LogLevel;
    minLevel?: LogLevel;
    integrationId?: string;
    nodeId?: string;
    after?: Date;
    before?: Date;
  }
): LogEntry[] {
  return entries.filter(entry => {
    if (criteria.level && entry.level !== criteria.level) return false;
    if (criteria.minLevel && LOG_LEVEL_PRIORITY[entry.level] < LOG_LEVEL_PRIORITY[criteria.minLevel]) return false;
    if (criteria.integrationId && entry.integrationId !== criteria.integrationId) return false;
    if (criteria.nodeId && entry.nodeId !== criteria.nodeId) return false;
    if (criteria.after && entry.timestamp < criteria.after) return false;
    if (criteria.before && entry.timestamp > criteria.before) return false;
    return true;
  });
}
