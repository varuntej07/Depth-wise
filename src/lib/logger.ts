type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string;
  context?: LogContext;
}

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const environment = process.env.NODE_ENV || 'development';
const configuredLevel = (process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug')).toLowerCase();
const activeLevel = (['debug', 'info', 'warn', 'error'].includes(configuredLevel) ? configuredLevel : 'info') as LogLevel;
const MAX_STRING_LENGTH = 800;

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return '[truncated-depth]';
  }

  if (value == null) {
    return value;
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.slice(0, 30).map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (/api[-_]?key|password|token|authorization|cookie|secret/i.test(key)) {
        output[key] = '[redacted]';
      } else {
        output[key] = sanitizeValue(entry, depth + 1);
      }
    }
    return output;
  }

  return String(value);
}

function serializeError(error: unknown): LogContext | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    const maybeApiError = error as Error & {
      status?: number;
      code?: string | number;
      headers?: unknown;
      request_id?: string;
      _request_id?: string;
    };

    return sanitizeValue({
      name: maybeApiError.name,
      message: maybeApiError.message,
      status: maybeApiError.status,
      code: maybeApiError.code,
      requestId: maybeApiError.request_id || maybeApiError._request_id,
      stack: maybeApiError.stack?.split('\n').slice(0, 6),
      headers: maybeApiError.headers,
    }) as LogContext;
  }

  return { message: sanitizeValue(error) };
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[activeLevel];
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) {
    return;
  }

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment,
    context: context ? (sanitizeValue(context) as LogContext) : undefined,
  };

  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),

  startTimer: () => nowMs(),
  durationMs: (startTimeMs: number) => Math.max(0, Math.round((nowMs() - startTimeMs) * 100) / 100),

  apiStart: (endpoint: string, context?: LogContext) => {
    emit('info', `api.start:${endpoint}`, context);
  },

  apiSuccess: (endpoint: string, context?: LogContext) => {
    emit('info', `api.success:${endpoint}`, context);
  },

  apiError: (endpoint: string, error: unknown, context?: LogContext) => {
    emit('error', `api.error:${endpoint}`, {
      ...context,
      error: serializeError(error),
    });
  },

  rateLimit: (endpoint: string, identifier: string, context?: LogContext) => {
    emit('warn', `rate_limit:${endpoint}`, { identifier, ...context });
  },

  db: (operation: string, context?: LogContext) => {
    emit('debug', `db:${operation}`, context);
  },

  external: (service: string, operation: string, context?: LogContext) => {
    emit('info', `external:${service}:${operation}`, context);
  },

  aiUsage: (service: string, context?: LogContext) => {
    emit('info', `ai.usage:${service}`, context);
  },
};
