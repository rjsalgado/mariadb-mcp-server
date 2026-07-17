/**
 * MariaDB connection management for MCP server
 */

import * as mariadb from "mariadb";
import { MariaDBConfig } from "./types.js";
import { isAlloowedQuery } from "./validators.js";

// Default connection timeout in milliseconds
const DEFAULT_TIMEOUT = 10000;

// Default row limit for query results
const DEFAULT_ROW_LIMIT = 1000;

let pool: mariadb.Pool | null = null;
let connection: mariadb.PoolConnection | null = null;

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

function convertScalar(v: any) {
  if (typeof v === "bigint") {
    if (process.env.MARIADB_CHECK_NUMBER_RANGE === "true") {
      if (v > MAX_SAFE || v < -MAX_SAFE) {
        throw new Error(`BIGINT out of safe JS range: ${v.toString()}`);
      }
    }
    return Number(v);
  }
  return v;
}

function normalizeRow(row: any): any {
  if (Array.isArray(row)) return row.map(normalizeRow);
  if (row && typeof row === "object") {
    for (const k of Object.keys(row)) row[k] = convertScalar(row[k]);
  }
  return row;
}

/**
 * Create a MariaDB connection pool
 */
export function createConnectionPool(): mariadb.Pool {
  console.error("[Setup] Creating MariaDB connection pool");
  const config = getConfigFromEnv();
  if (pool) {
    console.error("[Setup] Connection pool already exists");
    return pool;
  }
  try {
    pool = mariadb.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: 2,
      connectTimeout: DEFAULT_TIMEOUT,
      insertIdAsNumber: true,
      bigIntAsNumber: true,
      decimalAsNumber: config.decimal_as_number,
      checkNumberRange: config.check_number_range,
    });
  } catch (error) {
    console.error("[Error] Failed to create connection pool:", error);
    throw error;
  }
  return pool;
}

/**
 * Execute a query with error handling and logging
 */
export async function executeQuery(
  sql: string,
  params: any[] = [],
  database?: string,
): Promise<{ rows: any; fields: mariadb.FieldInfo[] }> {
  console.error(`[Query] Executing: ${sql}`);
  // Create connection pool if not already created
  if (!pool) {
    console.error("[Setup] Connection pool not found, creating a new one");
    pool = createConnectionPool();
  }

  try {
    // Get connection from pool
    if (connection) {
      console.error("[Query] Reusing existing connection");
    } else {
      console.error("[Query] Creating new connection");
      connection = await pool.getConnection();
    }

    // Use specific database if provided
    if (database) {
      console.error(`[Query] Using database: ${database}`);
      await connection.query(`USE \`${database}\``);
    }

    if (!isAlloowedQuery(sql)) {
      throw new Error("Query not allowed");
    }

    const result: any = await connection.query(
      {
        sql,
        namedPlaceholders: true,
        metaAsArray: true,
        timeout: DEFAULT_TIMEOUT,
      },
      params,
    );

    const rows = result;
    const fields: mariadb.FieldInfo[] = (result as any)?.meta ?? [];

    // Apply row limit if result is an array
    const limitedRows =
      Array.isArray(rows) && rows.length > DEFAULT_ROW_LIMIT
        ? rows.slice(0, DEFAULT_ROW_LIMIT)
        : rows;

    const normalizedRows = normalizeRow(limitedRows);

    // Log result summary
    console.error(
      `[Query] Success: ${
        Array.isArray(rows) ? rows.length : 1
      } rows returned with ${JSON.stringify(params)}`,
    );

    return { rows: normalizedRows, fields };
  } catch (error) {
    console.error("[Error] Query execution failed:", error);
    throw error;
  } finally {
    // Release connection back to pool
    if (connection) {
      connection.release();
      connection = null;
      console.error("[Query] Connection released");
    }
  }
}

/**
 * Get MariaDB connection configuration from environment variables
 */
export function getConfigFromEnv(): MariaDBConfig {
  const host = process.env.MARIADB_HOST;
  const portStr = process.env.MARIADB_PORT;
  const user = process.env.MARIADB_USER;
  const password = process.env.MARIADB_PASSWORD;
  const database = process.env.MARIADB_DATABASE;
  const allow_insert = process.env.MARIADB_ALLOW_INSERT === "true";
  const allow_update = process.env.MARIADB_ALLOW_UPDATE === "true";
  const allow_delete = process.env.MARIADB_ALLOW_DELETE === "true";
  const big_int_as_number = process.env.MARIADB_BIG_INT_AS_NUMBER === "true";
  const decimal_as_number = process.env.MARIADB_DECIMAL_AS_NUMBER === "true";
  const check_number_range = process.env.MARIADB_CHECK_NUMBER_RANGE === "true";

  if (!host) throw new Error("MARIADB_HOST environment variable is required");
  if (!user) throw new Error("MARIADB_USER environment variable is required");
  if (!password)
    throw new Error("MARIADB_PASSWORD environment variable is required");

  const port = portStr ? parseInt(portStr, 10) : 3306;

  console.error("[Setup] MariaDB configuration:", {
    host: host,
    port: port,
    user: user,
    database: database || "(default not set)",
    bigIntAsNumber: big_int_as_number,
    decimalAsNumber: decimal_as_number,
    checkNumberRange: check_number_range,
  });

  return {
    host,
    port,
    user,
    password,
    database,
    allow_insert,
    allow_update,
    allow_delete,
    big_int_as_number,
    decimal_as_number,
    check_number_range,
  };
}

export function endConnection() {
  if (pool) {
    return pool.end();
  }
}
