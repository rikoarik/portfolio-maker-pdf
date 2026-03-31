#!/usr/bin/env node
/**
 * Encode password untuk disisipkan manual ke URI Postgres (karakter @ # * dll).
 * Contoh: node scripts/encode-postgres-password.mjs 'pass*word'
 */
const p = process.argv[2];
if (!p) {
  console.error('Usage: node scripts/encode-postgres-password.mjs "<raw-password>"');
  process.exit(1);
}
console.log(encodeURIComponent(p));
