import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export const loadEnv = () => {
  if (loaded) return;
  loaded = true;

  const nodeEnv = process.env.NODE_ENV || 'development';
  process.env.NODE_ENV = nodeEnv;
  const filename = `.env.${nodeEnv}`;

  const candidates = [
    path.resolve(process.cwd(), 'services', 'api', filename),
    path.resolve(process.cwd(), filename),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
      break;
    }
  }
};
