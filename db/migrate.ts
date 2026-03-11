import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const dbType = process.env.DB_TYPE || 'sqlite';
const isProd = process.argv.includes('--prod');

console.log(`🚀 Starting automigration for: ${dbType}${isProd ? ' (Production)' : ''}`);

try {
  switch (dbType) {
    case 'd1': {
      const d1Command = isProd 
        ? 'npx wrangler d1 migrations apply blog-db --remote'
        : 'npx wrangler d1 migrations apply blog-db --local';
      console.log(`Running: ${d1Command}`);
      execSync(d1Command, { stdio: 'inherit' });
      break;
    }

    case 'sqlite':
    case 'libsql':
    case 'neon': {
      // For these, we use drizzle-kit push which is faster for dev/simple schemas
      // or drizzle-kit migrate if you have formal migrations.
      // Assuming drizzle-kit push for simplicity in this template.
      const drizzleCommand = 'npx drizzle-kit push';
      console.log(`Running: ${drizzleCommand}`);
      execSync(drizzleCommand, { stdio: 'inherit' });
      break;
    }

    default:
      console.error(`❌ Unknown DB_TYPE: ${dbType}`);
      process.exit(1);
  }
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
