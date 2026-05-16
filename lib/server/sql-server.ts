import sql, { type config as SqlConfig, type IResult, type ISqlType } from "mssql";

// Server-only guard — crashes the build if this module is bundled for the browser.
if (typeof window !== "undefined") {
  throw new Error("lib/server/sql-server must only be imported in server-side code.");
}

function buildConfig(): SqlConfig {
  const required = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing required env var: ${key}`);
    return value;
  };

  return {
    server: required("SAP_SQL_SERVER"),
    port: parseInt(process.env.SAP_SQL_PORT ?? "1433", 10),
    database: required("SAP_SQL_DATABASE"),
    user: required("SAP_SQL_USER"),
    password: required("SAP_SQL_PASSWORD"),
    options: {
      encrypt: process.env.SAP_SQL_ENCRYPT !== "false",
      trustServerCertificate: process.env.SAP_SQL_TRUST_CERT === "true",
    },
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30_000,
    },
    connectionTimeout: 15_000,
    requestTimeout: 30_000,
  };
}

// Module-level singleton so the pool survives across hot-reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var __sapPool: sql.ConnectionPool | undefined;
}

export async function getSapPool(): Promise<sql.ConnectionPool> {
  if (globalThis.__sapPool?.connected) {
    return globalThis.__sapPool;
  }

  const pool = new sql.ConnectionPool(buildConfig());

  pool.on("error", (err: Error) => {
    console.error("[SAP SQL] Pool error:", err.message);
    globalThis.__sapPool = undefined;
  });

  await pool.connect();
  globalThis.__sapPool = pool;
  return pool;
}

export type QueryResult<T extends Record<string, unknown>> = IResult<T>;

export async function sapQuery<T extends Record<string, unknown>>(
  queryText: string,
  params?: Record<string, { value: unknown; type: ISqlType | (() => ISqlType) }>,
): Promise<T[]> {
  const pool = await getSapPool();
  const request = pool.request();

  if (params) {
    for (const [name, { value, type }] of Object.entries(params)) {
      request.input(name, type, value);
    }
  }

  const result: IResult<T> = await request.query<T>(queryText);
  return result.recordset;
}
