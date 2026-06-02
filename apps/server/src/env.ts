import dotenv from 'dotenv';
import path from 'path';

// Since we're running from apps/server, we need to load the root .env
dotenv.config({ path: path.join(process.cwd(), '..', '..', '.env') });
