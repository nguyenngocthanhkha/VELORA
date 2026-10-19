const pool = require("../config/database");
const tables = [
  ["users", "user_id"],
  ["vehicles", "vehicle_id"],
  ["vehicle_types", "type_id"],
  ["drivers", "driver_id"],
  ["bookings", "booking_id"],
  ["payments", "payment_id"],
  ["reviews", "review_id"],
];
(async () => {
  try {
    for (const [table, column] of tables) {
      const sequence = (
        await pool.query("SELECT pg_get_serial_sequence($1,$2) AS name", [
          table,
          column,
        ])
      ).rows[0].name;
      if (!sequence) continue;
      if (!/^public\.[a-z_]+$/.test(sequence))
        throw Error("Unexpected sequence name");
      const state = (
          await pool.query("SELECT last_value,is_called FROM " + sequence)
        ).rows[0],
        max = Number(
          (
            await pool.query(
              "SELECT coalesce(max(" + column + "),0) AS max FROM " + table,
            )
          ).rows[0].max,
        );
      if (
        max > Number(state.last_value) ||
        (max === Number(state.last_value) && !state.is_called && max > 0)
      ) {
        await pool.query("SELECT setval($1::regclass,$2,true)", [
          sequence,
          max,
        ]);
        console.log("Aligned", sequence, "to existing maximum", max);
      } else console.log("Already aligned", sequence);
    }
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
