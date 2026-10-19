const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  quiet: true,
});
const { Pool, types } = require("pg");
// Preserve SQL DATE calendar days across server/browser time zones.
types.setTypeParser(1082, (value) => value);
module.exports = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "velora_test",
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
  connectionTimeoutMillis: 5000,
});
