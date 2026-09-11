import dotenv from 'dotenv';
import pg from 'pg';
import { readFile } from 'node:fs/promises';

dotenv.config();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

const sql = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(sql);
  console.log('Database schema is ready.');
} finally {
  await client.end();
}

