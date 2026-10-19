const pool = require("../config/database");
(async () => {
  try {
    await pool.query("BEGIN");
    await pool.query(
      "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id integer REFERENCES drivers(driver_id)",
    );
    await pool.query("COMMIT");
    console.log("bookings.driver_id ready; existing rows preserved.");
    console.log(
      JSON.stringify(
        (
          await pool.query(
            "SELECT vehicle_id,brand,model,image_url,status FROM vehicles ORDER BY vehicle_id",
          )
        ).rows,
      ),
    );
  } catch (e) {
    await pool.query("ROLLBACK");
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
