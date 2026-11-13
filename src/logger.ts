export type PartytimeLogLevel = "trace" | "debug" | "info" | "warn" | "error" | "silent";

export interface PartytimeLogger {
  trace(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

const LOG_LEVEL_TO_NUMBER: Record<PartytimeLogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 60,
};

let consoleLogLevel: PartytimeLogLevel = "warn";
let usingConsoleSink = true;

function shouldLog(level: Exclude<PartytimeLogLevel, "silent">): boolean {
  return LOG_LEVEL_TO_NUMBER[level] >= LOG_LEVEL_TO_NUMBER[consoleLogLevel];
}

function createConsoleSink(): PartytimeLogger {
  return {
    trace(...args: unknown[]): void {
      if (shouldLog("trace")) {
        // eslint-disable-next-line no-console
        console.debug(...args);
      }
    },
    debug(...args: unknown[]): void {
      if (shouldLog("debug")) {
        // eslint-disable-next-line no-console
        console.debug(...args);
      }
    },
    info(...args: unknown[]): void {
      if (shouldLog("info")) {
        // eslint-disable-next-line no-console
        console.info(...args);
      }
    },
    warn(...args: unknown[]): void {
      if (shouldLog("warn")) {
        // eslint-disable-next-line no-console
        console.warn(...args);
      }
    },
    error(...args: unknown[]): void {
      if (shouldLog("error")) {
        // eslint-disable-next-line no-console
        console.error(...args);
      }
    },
  };
}

let activeSink: PartytimeLogger = createConsoleSink();

export function setPartytimeLogger(sink: PartytimeLogger | null): void {
  if (sink) {
    usingConsoleSink = false;
    activeSink = sink;
    return;
  }

  usingConsoleSink = true;
  activeSink = createConsoleSink();
}

export function setPartytimeLogLevel(level: PartytimeLogLevel): void {
  consoleLogLevel = level;
  if (usingConsoleSink) {
    activeSink = createConsoleSink();
  }
}

export const logger: PartytimeLogger = {
  trace(...args: unknown[]): void {
    activeSink.trace(...args);
  },
  debug(...args: unknown[]): void {
    activeSink.debug(...args);
  },
  info(...args: unknown[]): void {
    activeSink.info(...args);
  },
  warn(...args: unknown[]): void {
    activeSink.warn(...args);
  },
  error(...args: unknown[]): void {
    activeSink.error(...args);
  },
};
