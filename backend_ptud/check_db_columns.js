import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function checkColumns() {
  const promisePool = pool.promise();
  try {
    const [rows] = await promisePool.query("SHOW COLUMNS FROM semesters");
    console.log("Columns in semesters table:");
    rows.forEach((row) => console.log(row.Field));
  } catch (err) {
    console.error("Error checking columns:", err);
  } finally {
    pool.end();
  }
}

checkColumns();
