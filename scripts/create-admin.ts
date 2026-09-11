import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();
const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const displayName = String(process.env.ADMIN_NAME || 'Nova Administrator').trim();
if (!process.env.DATABASE_URL || !email || password.length < 12) {
  throw new Error('DATABASE_URL, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters are required');
}

const passwordHash = await bcrypt.hash(password, 12);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    `INSERT INTO users (email, display_name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           password_hash = EXCLUDED.password_hash,
           active = TRUE`,
    [email, displayName, passwordHash],
  );
  console.log(`Administrator ${email} is ready.`);
} finally {
  await client.end();
}
