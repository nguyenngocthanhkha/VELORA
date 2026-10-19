const pool = require("../config/database");
(async () => {
  try {
    const connection = await pool.query(
      "SELECT current_database() AS database, current_user AS username",
    );
    console.log("Database connection:", connection.rows[0]);
    const tables = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );
    console.log(
      "Public tables:",
      tables.rows.map((row) => row.tablename).join(", "),
    );
  } catch (error) {
    console.error("Database connection failed:", error.code, error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
