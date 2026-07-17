#!/usr/bin/env node

/**
 * Test setup script for MariaDB / MariaDB MCP server
 * 
 * This script:
 * 1. Creates a test database and table
 * 2. Inserts sample data
 * 3. Tests each MCP tool against the database
 * 
 * Usage:
 *   node test-setup.js
 * 
 * Environment variables:
 *   MARIADB_HOST - host (default: localhost)
 *   MARIADB_PORT - port (default: 3306)
 *   MARIADB_USER - username
 *   MARIADB_PASSWORD - password
 *   MARIADB_ALLOW_INSERT - false
 *   MARIADB_ALLOW_UPDATE - false
 *   MARIADB_ALLOW_DELETE - false
 */

import * as mariadb from 'mariadb';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Configuration from environment variables
const config = {
  host: process.env.MARIADB_HOST || 'localhost',
  port: parseInt(process.env.MARIADB_PORT || '3306', 10),
  user: process.env.MARIADB_USER,
  password: process.env.MARIADB_PASSWORD,
  database: process.env.MARIADB_DATABASE,
  allowInsert: process.env.MARIADB_ALLOW_INSERT !== 'false',
  allowUpdate: process.env.MARIADB_ALLOW_UPDATE !== 'false',
  allowDelete: process.env.MARIADB_ALLOW_DELETE !== 'false',
};

// Test database and table names
const TEST_DB = 'teste_db';
const TEST_TABLE = 'users';

// Check required environment variables
if (!config.user || !config.password) {
  console.error('Error: MARIADB_USER and MARIADB_PASSWORD environment variables are required');
  console.error('Example usage:');
  console.error('  MARIADB_USER=root MARIADB_PASSWORD=password node test-setup.js');
  process.exit(1);
}

// Create a connection pool
const pool = mariadb.createPool({
  ...config,
  connectionLimit: 10
});

/**
 * Main function
 */
async function main() {
  console.log('MariaDB MCP Server Test Setup');
  console.log('===========================');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`User: ${config.user}`);
  console.log(`Database: ${config.database || 'N/A'}`);
  console.log(`Allow Insert: ${config.allowInsert}`);
  console.log(`Allow Update: ${config.allowUpdate}`);
  console.log(`Allow Delete: ${config.allowDelete}`);
  console.log();

  try {
    // Test connection
    console.log('Testing connection...');
    await testConnection();
    console.log('✅ Connection successful');
    console.log();

    // Create test database
    console.log(`Creating test database '${TEST_DB}'...`);
    await createTestDatabase();
    console.log(`✅ Database '${TEST_DB}' created`);
    console.log();

    // Create test table
    console.log(`Creating test table '${TEST_TABLE}'...`);
    await createTestTable();
    console.log(`✅ Table '${TEST_TABLE}' created`);
    console.log();

    // Insert sample data
    console.log('Inserting sample data...');
    await insertSampleData();
    console.log('✅ Sample data inserted');
    console.log();

    // Test queries
    console.log('Testing queries...');
    await testQueries();
    console.log('✅ All queries executed successfully');
    console.log();

    console.log('Test setup completed successfully!');
    console.log();
    console.log('You can now use the following MCP tools:');
    console.log('1. list_databases - Should show the test database');
    console.log('2. list_tables - With database="mcp_test_db"');
    console.log('3. describe_table - With database="mcp_test_db", table="users"');
    console.log('4. execute_query - With database="mcp_test_db", query="SELECT * FROM users"');
    console.log();
    console.log('MCP Settings Configuration:');
    console.log(JSON.stringify({
      mcpServers: {
        mariadb: {
          command: 'node',
          args: ['/path/to/mariadb-mcp-server/dist/index.js'],
          env: {
            MARIADB_HOST: config.host,
            MARIADB_PORT: String(config.port),
            MARIADB_USER: config.user,
            MARIADB_PASSWORD: config.password,
            MARIADB_DATABASE: TEST_DB,
            MARIADB_ALLOW_INSERT: String(config.allowInsert),
            MARIADB_ALLOW_UPDATE: String(config.allowUpdate),
            MARIADB_ALLOW_DELETE: String(config.allowDelete),
          },
          disabled: false,
          autoApprove: [],
        },
      },
    }, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

/**
 * Test the database connection
 */
async function testConnection() {
  const connection = await pool.getConnection();
  connection.release();
}

/**
 * Create the test database
 */
async function createTestDatabase() {
  await pool.query(`DROP DATABASE IF EXISTS ${TEST_DB}`);
  await pool.query(`CREATE DATABASE ${TEST_DB}`);
}

/**
 * Create the test table
 */
async function createTestTable() {
  await pool.query(`USE ${TEST_DB}`);
  await pool.query(`
    CREATE TABLE ${TEST_TABLE} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      age INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Insert sample data
 */
async function insertSampleData() {
  await pool.query(`USE ${TEST_DB}`);
  
  const users = [
    { name: 'Roberto', email: 'roberto@example.com', age: 53 },
    { name: 'Alerinda', email: 'almerinda@example.com', age: 43 },
    { name: 'Laisa', email: 'laisa@example.com', age: 22 },
    { name: 'Luiza', email: 'luiza@example.com', age: 20 },
    { name: 'Roanna', email: 'roanna@example.com', age: 31 },
  ];
  
  for (const user of users) {
    await pool.query(
      `INSERT INTO ${TEST_TABLE} (name, email, age) VALUES (?, ?, ?)`,
      [user.name, user.email, user.age]
    );
  }
}

/**
 * Test various queries
 */
async function testQueries() {
  await pool.query(`USE ${TEST_DB}`);
  
  // Test SELECT
  const [rows] = await pool.query(`SELECT * FROM ${TEST_TABLE}`);
  console.log(`  - SELECT: Found ${rows.length} rows`);
  
  // Test SHOW TABLES
  const [tables] = await pool.query('SHOW TABLES');
  console.log(`  - SHOW TABLES: Found ${tables.length} tables`);
  
  // Test DESCRIBE
  const [columns] = await pool.query(`DESCRIBE ${TEST_TABLE}`);
  console.log(`  - DESCRIBE: Found ${columns.length} columns`);
}

// Run the main function
main().catch(console.error);
