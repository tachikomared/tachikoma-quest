import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
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
    prepare: false,
  });
  
  return sqlInstance;
}

// Export sql tagged template function with proper typing
export const sql = (
  strings: TemplateStringsArray,
  ...values: (string | number | boolean | null | undefined)[]
) => {
  return getSql()(strings, ...values);
};

// Export getter for direct access
export { getSql };
