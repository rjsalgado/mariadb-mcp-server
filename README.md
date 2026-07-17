# MariaDB / MySQL MCP Server

This MCP server exposes MariaDB and MySQL databases to MCP clients such as Claude Desktop, VS Code, and other compatible tools.

It provides tools to:
- list available databases
- list tables in a database
- describe table schemas
- execute SQL queries

## Features
- Safe-by-default behavior: read-only access is enabled by default
- Query validation to block disallowed statements and reduce injection risk
- Configurable write permissions through environment variables
- Timeout and row-limit protection
- Numeric safety for insert IDs and BIGINT values returned by the MariaDB driver

## Installation

### Option 1: Install from npm
```bash
npm install -g mariadb-mcp-server
```

### Option 2: Install locally
```bash
npm install mariadb-mcp-server
```

### Option 3: Build from source
```bash
git clone https://github.com/rjsalgado/mariadb-mcp-server.git
cd mariadb-mcp-server
npm install
npm run build
```

## Configuration

Set the following environment variables before starting the server:

- `MARIADB_HOST`: Database host
- `MARIADB_PORT`: Database port (default: `3306`)
- `MARIADB_USER`: Database username
- `MARIADB_PASSWORD`: Database password
- `MARIADB_DATABASE`: Default database name (optional)
- `MARIADB_ALLOW_INSERT`: Enable `INSERT` statements (`true`/`false`)
- `MARIADB_ALLOW_UPDATE`: Enable `UPDATE` statements (`true`/`false`)
- `MARIADB_ALLOW_DELETE`: Enable `DELETE` statements (`true`/`false`)
- `MARIADB_TIMEOUT_MS`: Query timeout in milliseconds (default: `10000`)
- `MARIADB_ROW_LIMIT`: Maximum number of rows returned (default: `1000`)

Example:
```bash
export MARIADB_HOST=localhost
export MARIADB_PORT=3306
export MARIADB_USER=myuser
export MARIADB_PASSWORD=mypassword
export MARIADB_DATABASE=mydb
export MARIADB_ALLOW_INSERT=false
export MARIADB_ALLOW_UPDATE=false
export MARIADB_ALLOW_DELETE=false
export MARIADB_TIMEOUT_MS=10000
export MARIADB_ROW_LIMIT=1000
```

## MCP configuration

### Using npm package
```json
{
  "mcpServers": {
    "mariadb": {
      "command": "npx",
      "args": ["mariadb-mcp-server"],
      "env": {
        "MARIADB_HOST": "your-host",
        "MARIADB_PORT": "3306",
        "MARIADB_USER": "your-user",
        "MARIADB_PASSWORD": "your-password",
        "MARIADB_DATABASE": "your-database",
        "MARIADB_ALLOW_INSERT": "false",
        "MARIADB_ALLOW_UPDATE": "false",
        "MARIADB_ALLOW_DELETE": "false",
        "MARIADB_TIMEOUT_MS": "10000",
        "MARIADB_ROW_LIMIT": "1000"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Using a built local server
```json
{
  "mcpServers": {
    "mariadb": {
      "command": "node",
      "args": ["/absolute/path/to/mariadb-mcp-server/dist/index.js"],
      "env": {
        "MARIADB_HOST": "your-host",
        "MARIADB_PORT": "3306",
        "MARIADB_USER": "your-user",
        "MARIADB_PASSWORD": "your-password",
        "MARIADB_DATABASE": "your-database",
        "MARIADB_ALLOW_INSERT": "false",
        "MARIADB_ALLOW_UPDATE": "false",
        "MARIADB_ALLOW_DELETE": "false",
        "MARIADB_TIMEOUT_MS": "10000",
        "MARIADB_ROW_LIMIT": "1000"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

## Available tools

The server registers the following MCP tools:

### `list_databases`
Lists all databases accessible to the configured user.

### `list_tables`
Lists tables from a specific database.

Parameters:
- `database` (optional): database name to inspect

### `describe_table`
Returns the schema of a specific table.

Parameters:
- `database` (optional): database name
- `table` (required): table name

### `execute_query`
Executes a SQL query.

Parameters:
- `database` (optional): database name
- `query` (required): SQL statement to run

## Testing

The repository includes scripts to validate the server against a MariaDB or MySQL instance.

```bash
npm run test:setup
npm run test:tools
```

Or run everything together:

```bash
npm test
```

## Notes

- The server is safe-by-default and only allows read-only operations unless the write flags are explicitly enabled.
- Write operations are still subject to query validation and runtime limits.

## Troubleshooting
If you encounter issues:

1. Check the server logs for error messages
2. Verify your MariaDB/MySQL credentials and connection details
3. Ensure your MariaDB/MySQL user has appropriate permissions
4. Check that your query is read-only and properly formatted


**Inspiration**
**https://github.com/dpflucas/mysql-mcp-server**

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
