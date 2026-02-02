/**
 * Production-grade logger for API routes
 * Provides structured logging with context for debugging
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.context && Object.keys(entry.context).length > 0) {
    return `${base} ${JSON.stringify(entry.context)}`;
  }
  return base;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),

  /**
   * Log API request start
   */
  apiStart: (endpoint: string, context?: LogContext) => {
    log('info', `API Request: ${endpoint}`, context);
  },

  /**
   * Log API request success
   */
  apiSuccess: (endpoint: string, context?: LogContext) => {
    log('info', `API Success: ${endpoint}`, context);
  },

  /**
   * Log API request error with full error details
   */
  apiError: (endpoint: string, error: unknown, context?: LogContext) => {
    const errorDetails: LogContext = {
      ...context,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join(' | ') : undefined,
    };
    log('error', `API Error: ${endpoint}`, errorDetails);
  },

  /**
   * Log rate limit events
   */
  rateLimit: (endpoint: string, identifier: string, context?: LogContext) => {
    log('warn', `Rate limit exceeded: ${endpoint}`, { identifier, ...context });
  },

  /**
   * Log database operations
   */
  db: (operation: string, context?: LogContext) => {
    log('info', `DB: ${operation}`, context);
  },

  /**
   * Log external API calls (Claude, etc.)
   */
  external: (service: string, operation: string, context?: LogContext) => {
    log('info', `External API: ${service} - ${operation}`, context);
  },
};
