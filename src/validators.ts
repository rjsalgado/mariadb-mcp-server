/**
 * SQL query validators for MariaDB MCP server
 * Ensures that only read-only queries are allowed
 */

// List of allowed SQL commands
const ALLOWED_COMMANDS = [
  "SELECT",
  "SHOW",
  "DESCRIBE",
  "DESC",
  "EXPLAIN",
  "INSERT",
  "UPDATE",
  "DELETE",
];

// List of disallowed SQL commands (write operations)
const DISALLOWED_COMMANDS = [
  "DROP",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "RENAME",
  "REPLACE",
  "GRANT",
  "REVOKE",
  "LOCK",
  "UNLOCK",
  "CALL",
  "EXEC",
  "EXECUTE",
  "SET",
  "START",
  "BEGIN",
  "COMMIT",
  "ROLLBACK",
];

/**
 * Validates if a SQL query is read-only
 * @param query SQL query to validate
 * @returns true if the query is read-only, false otherwise
 */
export function isAlloowedQuery(query: string): boolean {
  // Normalize query by removing comments and extra whitespace
  const normalizedQuery = query
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toUpperCase();
  const ALLOW_INSERT = process.env.MARIADB_ALLOW_INSERT === "true";
  const ALLOW_UPDATE = process.env.MARIADB_ALLOW_UPDATE === "true";
  const ALLOW_DELETE = process.env.MARIADB_ALLOW_DELETE === "true";

  // Check if query starts with an allowed command
  const startsWithAllowed = ALLOWED_COMMANDS.some(
    (cmd) => normalizedQuery.startsWith(cmd + " ") || normalizedQuery === cmd
  );
  const startsWithAllowedNoSpace =
    normalizedQuery.startsWith("INSERT") && !ALLOW_INSERT;
  // Check if query contains any disallowed commands
  const containsDisallowed = DISALLOWED_COMMANDS.some((cmd) => {
    if (cmd === "INSERT" && !ALLOW_INSERT) {
      return false; // Skip INSERT if not allowed
    }
    if (cmd === "UPDATE" && !ALLOW_UPDATE) {
      return false; // Skip UPDATE if not allowed
    }
    if (cmd === "DELETE" && !ALLOW_DELETE) {
      return false; // Skip DELETE if not allowed
    }
    if (cmd === "SET" && ALLOW_UPDATE) {
      return false; // UPDATE statements use SET as part of their syntax
    }
    const regex = new RegExp(`(^|\\s)${cmd}(\\s|$)`);
    return regex.test(normalizedQuery);
  });

  // Check for multiple statements (;)
  const hasMultipleStatements =
    normalizedQuery.includes(";") && !normalizedQuery.endsWith(";");

  // Query is read-only if it starts with an allowed command,
  // doesn't contain any disallowed commands, and doesn't have multiple statements
  return startsWithAllowed && !containsDisallowed && !hasMultipleStatements;
}

/**
 * Validates if a SQL query is safe to execute
 * @param query SQL query to validate
 * @throws Error if the query is not safe
 */
export function validateQuery(query: string): void {
  console.error("[Validator] Validating query:", query);

  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  if (!isAlloowedQuery(query)) {
    console.error("[Validator] Query rejected: not allowed");
    throw new Error(
      "Query contains disallowed commands or is not permitted by current configuration"
    );
  }

  console.error("[Validator] Query validated");
}
