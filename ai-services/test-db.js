require("dotenv").config();

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");

    console.log("✅ Neon PostgreSQL connected");
    console.log("Database time:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDatabase();