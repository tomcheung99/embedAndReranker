// ============================================================
// Logger — 輕量日誌工具（debug / info / error）
// ============================================================

export type LogLevel = "debug" | "info";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1 };

let currentLevel: LogLevel = "info";

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function ts(): string {
  return new Date().toISOString();
}

/** Debug-level log — only printed when LOG_LEVEL=debug */
export function logDebug(message: string): void {
  if (LEVELS[currentLevel] <= LEVELS.debug) {
    process.stdout.write(`[${ts()}] [DEBUG] ${message}\n`);
  }
}

/** Info-level log — always printed */
export function logInfo(message: string): void {
  process.stdout.write(`[${ts()}] ${message}\n`);
}

/** Error-level log — always printed to stderr */
export function logError(message: string): void {
  process.stderr.write(`[${ts()}] [ERROR] ${message}\n`);
}
