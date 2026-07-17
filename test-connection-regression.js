import assert from 'node:assert/strict';
import mariadb from 'mariadb';
import { createConnectionPool, endConnection } from './dist/connection.js';

process.env.MARIADB_HOST = 'localhost';
process.env.MARIADB_PORT = '3306';
process.env.MARIADB_USER = 'root';
process.env.MARIADB_PASSWORD = 'password';
process.env.MARIADB_DATABASE = 'test';

let capturedConfig;
mariadb.createPool = (config) => {
  capturedConfig = config;
  return { end: async () => {} };
};

createConnectionPool();

assert.equal(capturedConfig.insertIdAsNumber, true, 'insertIdAsNumber should be enabled');
assert.equal(capturedConfig.bigIntAsNumber, true, 'bigIntAsNumber should be enabled');

await endConnection();
console.log('connection regression tests passed');
