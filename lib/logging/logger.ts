/**
 * Logging Utility
 * Structured logging with multiple log levels and outputs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private name: string;
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(name: string, minLevel: LogLevel = 'info') {
    this.name = name;
    this.minLevel = minLevel;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  /**
   * Format log entry as JSON
   */
  private formatLogEntry(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
  }

  /**
   * Output log to console
   */
  private outputToConsole(entry: LogEntry): void {
    const logData = {
      ...entry,
      logger: this.name,
    };

    const jsonString = JSON.stringify(logData);

    switch (entry.level) {
      case 'debug':
        console.debug(jsonString);
        break;
      case 'info':
        console.info(jsonString);
        break;
      case 'warn':
        console.warn(jsonString);
        break;
      case 'error':
        console.error(jsonString);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.formatLogEntry('debug', message, context);
    this.outputToConsole(entry);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const entry = this.formatLogEntry('info', message, context);
    this.outputToConsole(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.formatLogEntry('warn', message, context);
    this.outputToConsole(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return;
    const entry = this.formatLogEntry('error', message, context);
    this.outputToConsole(entry);
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(name: string, minLevel?: LogLevel): Logger {
  return new Logger(name, minLevel);
}

/**
 * Global logger instance
 */
export const logger = createLogger('app', process.env.LOG_LEVEL as LogLevel || 'info');

/**
 * Security event logger
 */
export const securityLogger = createLogger('security', 'info');

/**
 * Error logger
 */
export const errorLogger = createLogger('error', 'error');
