import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  // Only throw at runtime when actually used, not at build time
  console.warn('[db] DATABASE_URL not set - will throw on first query');
}

// Create sql instance lazily
let sqlInstance: ReturnType<typeof postgres> | null = null;

function getSql(): ReturnType<typeof postgres> {
  if (sqlInstance) return sqlInstance;
  
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }
  
  sqlInstance = postgres(DATABASE_URL, {
    ssl: DATABASE_URL.includes('localhost') ? false : 'require',
    max: 5,
    prepare: false, // Disable prepared statements for Neon compatibility
  });
  
  return sqlInstance;
}

// Export a wrapper that creates sql on first use
export const sql = Object.assign(
  // The tagged template function
  (strings: TemplateStringsArray, ...values: unknown[]) => {
    return getSql()(strings, ...values);
  },
  // Copy over other sql methods lazily
  {
    get unsafe() { return getSql().unsafe; },
    get file() { return getSql().file; },
    get json() { return getSql().json; },
    get array() { return getSql().array; },
    get begin() { return getSql().begin; },
    get end() { return getSql().end; },
  }
);

// Also export getter for direct access
export { getSql };
