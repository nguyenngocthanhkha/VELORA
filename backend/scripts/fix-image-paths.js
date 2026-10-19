const fs = require("fs");
const path = require("path");
const backupDir = path.resolve(__dirname, "../../database/backups");
const imagesDir = path.resolve(__dirname, "../public/images");
const pool = require("../config/database");
const mappings = [
  ["Toyota", "Camry", "Toyota Camry 2023.jpg"],
  ["Honda", "Civic", "Honda Civic 2024.jpg"],
  ["Toyota", "Fortuner", "Toyota Fortuner 2023.jpg"],
  ["Hyundai", "Santa Fe", "Hyundai Santa Fe 2024.jpg"],
  ["Mitsubishi", "Xpander", "MITSUBISHI XPANDER 2023.jpg"],
  ["VinFast", "Fadil", "VinFast Fadil 2022.jpg"],
];
(async () => {
  try {
    const before = await pool.query(
      "SELECT vehicle_id,brand,model,image_url FROM vehicles",
    );
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(
      path.join(backupDir, "image-paths-" + Date.now() + ".json"),
      JSON.stringify(before.rows, null, 2),
    );
    await pool.query("BEGIN");
    for (const [brand, model, file] of mappings) {
      if (!fs.existsSync(path.join(imagesDir, file)))
        throw Error("Missing image " + file);
      await pool.query(
        "UPDATE vehicles SET image_url=$1 WHERE brand=$2 AND model=$3 AND (image_url LIKE $4 OR image_url NOT LIKE $5)",
        ["/images/" + file, brand, model, "https://example.com/%", "/images/%"],
      );
    }
    await pool.query("COMMIT");
    console.log(
      "Matched vehicle images to existing files; previous paths backed up.",
    );
  } catch (e) {
    await pool.query("ROLLBACK");
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
