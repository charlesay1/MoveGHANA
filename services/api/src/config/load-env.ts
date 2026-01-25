import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let loaded = false;

export const loadEnv = () => {
  if (loaded) return;
  loaded = true;

  const nodeEnv = process.env.NODE_ENV || 'development';
  const appEnv = process.env.APP_ENV;
  process.env.NODE_ENV = nodeEnv;
  const envAlias =
    appEnv
    ?? (nodeEnv === 'production' ? 'prod' : nodeEnv === 'development' ? 'dev' : nodeEnv === 'test' ? 'dev' : nodeEnv);
  const filename = `.env.${envAlias}`;
  const legacyFilename = `.env.${nodeEnv}`;

  const candidates = [
    path.resolve(process.cwd(), 'services', 'api', filename),
    path.resolve(process.cwd(), 'services', 'api', legacyFilename),
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), legacyFilename),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
      break;
    }
  }
};
