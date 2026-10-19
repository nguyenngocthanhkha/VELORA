const pool = require("../config/database");
(async () => {
  try {
    const names = [
      "users",
      "vehicles",
      "bookings",
      "payments",
      "reviews",
      "drivers",
      "vehicle_types",
    ];
    for (const name of names) {
      const cols = await pool.query(
        "SELECT column_name,data_type FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position",
        ["public", name],
      );
      const count = await pool.query("SELECT count(*) AS count FROM " + name);
      console.log(name, count.rows[0].count, JSON.stringify(cols.rows));
    }
    const users = await pool.query(
      "SELECT user_id,email,role,status FROM users ORDER BY user_id",
    );
    console.log("Accounts:", JSON.stringify(users.rows));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
