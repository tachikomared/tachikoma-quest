import postgres from 'postgres';

let sqlInstance: ReturnType<typeof postgres> | null = null;

export function getSql() {
  if (sqlInstance) return sqlInstance;
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  
  sqlInstance = postgres(process.env.DATABASE_URL, {
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : 'require',
    max: 5,
  });
  
  return sqlInstance;
}

// For backwards compatibility - lazy initialization
export const sql = new Proxy({} as ReturnType<typeof postgres>, {
  get(_, prop) {
    const instance = getSql();
    return instance[prop as keyof typeof instance];
  },
});
