import assert from 'node:assert/strict';
import { isAlloowedQuery } from './dist/validators.js';

process.env.MARIADB_ALLOW_INSERT = 'false';
process.env.MARIADB_ALLOW_UPDATE = 'true';
process.env.MARIADB_ALLOW_DELETE = 'false';

assert.equal(
  isAlloowedQuery('UPDATE some_table SET col = col WHERE 1=0'),
  true,
  'UPDATE queries should be allowed when MARIADB_ALLOW_UPDATE=true'
);

process.env.MARIADB_ALLOW_UPDATE = 'false';
assert.equal(
  isAlloowedQuery('UPDATE some_table SET col = col WHERE 1=0'),
  false,
  'UPDATE queries should be rejected when MARIADB_ALLOW_UPDATE=false'
);

console.log('validator regression tests passed');
