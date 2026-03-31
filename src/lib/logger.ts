type LogLevel = "info" | "warn" | "error" | "debug";

export type LogFields = Record<string, string | number | boolean | undefined | null>;

export function log(
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export function logApi(
  level: LogLevel,
  message: string,
  ctx: {
    requestId?: string | null;
    projectId?: string;
    jobId?: string;
    path?: string;
    extra?: LogFields;
  },
): void {
  log(level, message, {
    requestId: ctx.requestId ?? undefined,
    projectId: ctx.projectId,
    jobId: ctx.jobId,
    path: ctx.path,
    ...ctx.extra,
  });
}
