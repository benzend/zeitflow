import { useState, useMemo } from 'react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  integrationId: string;
  nodeId: string;
  executionId: string;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

interface ExecutionLogViewerProps {
  logs: LogEntry[] | null;
  className?: string;
}

const LOG_LEVEL_CONFIG: Record<LogLevel, { label: string; color: string; bgColor: string }> = {
  debug: { label: 'DEBUG', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  info: { label: 'INFO', color: 'text-green-400', bgColor: 'bg-green-500/10' },
  warn: { label: 'WARN', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  error: { label: 'ERROR', color: 'text-red-400', bgColor: 'bg-red-500/10' },
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

export default function ExecutionLogViewer({ logs, className = '' }: ExecutionLogViewerProps) {
  const [showDebug, setShowDebug] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(new Set());
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      // Hide debug by default unless showDebug is true
      if (log.level === 'debug' && !showDebug) return false;
      // Apply level filter if not 'all'
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      return true;
    });
  }, [logs, showDebug, levelFilter]);

  const toggleExpand = (index: number) => {
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const logCounts = useMemo(() => {
    if (!logs) return { debug: 0, info: 0, warn: 0, error: 0 };
    return logs.reduce(
      (acc, log) => {
        acc[log.level]++;
        return acc;
      },
      { debug: 0, info: 0, warn: 0, error: 0 }
    );
  }, [logs]);

  if (!logs || logs.length === 0) {
    return (
      <div className={`bg-background-light rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-foreground mb-4">Execution Logs</h2>
        <p className="text-foreground-light">No execution logs available</p>
      </div>
    );
  }

  return (
    <div className={`bg-background-light rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Execution Logs</h2>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Log counts */}
          <div className="flex items-center gap-2 text-xs">
            {logCounts.error > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                {logCounts.error} error{logCounts.error !== 1 ? 's' : ''}
              </span>
            )}
            {logCounts.warn > 0 && (
              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                {logCounts.warn} warning{logCounts.warn !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Level filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
            className="bg-background-extra-light border border-background rounded px-2 py-1 text-xs text-foreground cursor-pointer focus:outline-none focus:border-primary"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
            {showDebug && <option value="debug">Debug</option>}
          </select>

          {/* Debug toggle */}
          <label className="flex items-center gap-1.5 text-xs text-foreground-light cursor-pointer">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="rounded border-gray-600 bg-background-extra-light text-primary focus:ring-primary focus:ring-offset-0"
            />
            Show Debug
          </label>
        </div>
      </div>

      {/* Log entries */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <p className="text-foreground-light text-sm py-4 text-center">
            No logs match the current filter
          </p>
        ) : (
          filteredLogs.map((log, index) => {
            const config = LOG_LEVEL_CONFIG[log.level];
            const hasData = log.data && Object.keys(log.data).length > 0;
            const isExpanded = expandedEntries.has(index);

            return (
              <div
                key={index}
                className={`${config.bgColor} rounded px-3 py-2 font-mono text-sm`}
              >
                {/* Main log line */}
                <div className="flex items-start gap-3">
                  {/* Timestamp */}
                  <span className="text-foreground-light text-xs shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>

                  {/* Level badge */}
                  <span className={`${config.color} text-xs font-semibold shrink-0 w-12`}>
                    {config.label}
                  </span>

                  {/* Node context */}
                  <span className="text-primary/70 text-xs shrink-0">
                    [{log.integrationId}:{log.nodeId.slice(0, 8)}]
                  </span>

                  {/* Message */}
                  <span className="text-foreground flex-1">{log.message}</span>

                  {/* Duration badge */}
                  {log.durationMs !== undefined && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                      {formatDuration(log.durationMs)}
                    </span>
                  )}

                  {/* Expand button for data */}
                  {hasData && (
                    <button
                      onClick={() => toggleExpand(index)}
                      className="text-foreground-light hover:text-foreground text-xs shrink-0 transition-colors"
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded data section */}
                {hasData && isExpanded && (
                  <div className="mt-2 ml-[calc(4.5rem+0.75rem)] pl-3 border-l border-foreground/10">
                    <pre className="text-xs text-foreground-light overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer with total count */}
      <div className="mt-3 pt-3 border-t border-foreground/10 text-xs text-foreground-light">
        Showing {filteredLogs.length} of {logs.length} log entries
      </div>
    </div>
  );
}
