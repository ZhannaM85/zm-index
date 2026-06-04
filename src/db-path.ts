import { getDbPath } from './db.js';

export function dbPath(projectRoot: string): void {
  console.log(getDbPath(projectRoot));
}
