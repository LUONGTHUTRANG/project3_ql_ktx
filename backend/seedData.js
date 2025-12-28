import db from "./config/db.js";
import bcrypt from "bcryptjs";

const seed = async () => {
  try {
    console.log("Seeding data...");

    // Disable FK checks to allow clearing tables with relationships
    await db.query("SET FOREIGN_KEY_CHECKS = 0");

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const managerPassword = await bcrypt.hash("manager123", 10);
    const studentPassword = await bcrypt.hash("student123", 10);

    // 1. Seed Admin
    console.log("Seeding Admin...");
    // Check if admin exists to avoid duplicates if run multiple times, or just delete
    await db.query("DELETE FROM admins");
    await db.query(
      "INSERT INTO admins (username, password_hash, full_name) VALUES (?, ?, ?)",
      ["admin", adminPassword, "System Administrator"]
    );

    // 2. Seed Managers
    console.log("Seeding Managers...");
    await db.query("DELETE FROM managers");
    // Assuming buildings 1 and 2 exist. If not, set building_id to NULL or ensure buildings are seeded first.
    // We will assume the main SQL script has been run which inserts buildings.
    const managers = [
      [
        "manager1",
        "manager1@ktx.com",
        managerPassword,
        "Manager One",
        "0901234561",
        1,
        1,
      ],
      [
        "manager2",
        "manager2@ktx.com",
        managerPassword,
        "Manager Two",
        "0901234562",
        1,
        2,
      ],
    ];

    try {
      await db.query(
        "INSERT INTO managers (username, email, password_hash, full_name, phone_number, is_first_login, building_id) VALUES ?",
        [managers]
      );
    } catch (err) {
      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        console.warn(
          "Warning: Could not insert managers with building_id. Make sure 'buildings' table is populated."
        );
        throw err;
      } else {
        throw err;
      }
    }

    // 3. Seed Students
    console.log("Seeding Students...");
    await db.query("DELETE FROM students");
    const students = [
      [
        "20225001",
        studentPassword,
        "Nguyen Van A",
        "sv001@student.com",
        "0912345671",
        "MALE",
        "CNTT1",
        "STUDYING",
        "NOT_STAYING",
        15
      ],
      [
        "20225002",
        studentPassword,
        "Tran Thi B",
        "sv002@student.com",
        "0912345672",
        "FEMALE",
        "KT1",
        "STUDYING",
        "NOT_STAYING",
        15
      ],
      [
        "20225003",
        studentPassword,
        "Le Van C",
        "sv003@student.com",
        "0912345673",
        "MALE",
        "CNTT2",
        "STUDYING",
        "NOT_STAYING",
        20
      ],
      [
        "20225004",
        studentPassword,
        "Pham Thi D",
        "sv004@student.com",
        "0912345674",
        "FEMALE",
        "NNA1",
        "STUDYING",
        "NOT_STAYING",
        26
      ],
      [
        "20225005",
        studentPassword,
        "Hoang Van E",
        "sv005@student.com",
        "0912345675",
        "MALE",
        "DT1",
        "STUDYING",
        "NOT_STAYING",
        49
      ],
    ];
    await db.query(
      "INSERT INTO students (mssv, password_hash, full_name, email, phone_number, gender, class_name, student_status, stay_status, current_room_id) VALUES ?",
      [students]
    );

    // 4. Seed Service Prices
    console.log("Seeding Service Prices...");
    // Clear old data
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE invoices");
    await db.query("TRUNCATE TABLE monthly_usages");
    await db.query("TRUNCATE TABLE service_prices");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    const servicePrices = [
      ["ELECTRICITY", 2950.0, new Date(), 1],
      ["WATER", 10000.0, new Date(), 1],
    ];
    await db.query(
      "INSERT INTO service_prices (service_name, unit_price, apply_date, is_active) VALUES ?",
      [servicePrices]
    );

    // 5. Seed Monthly Usages & Utility Invoices
    console.log("Seeding Monthly Usages and Utility Invoices...");

    // Get all rooms
    const [rooms] = await db.query("SELECT id, room_number FROM rooms");

    // Get active semester
    const [semesters] = await db.query(
      "SELECT id FROM semesters WHERE is_active = 1 LIMIT 1"
    );
    const activeSemesterId = semesters.length > 0 ? semesters[0].id : 1;

    // Get a manager for created_by
    const [managersList] = await db.query("SELECT id FROM managers LIMIT 1");
    const managerId = managersList.length > 0 ? managersList[0].id : 1;

    const utilityInvoices = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    for (const room of rooms) {
      // Generate usage for current month
      const elecOld = Math.floor(Math.random() * 1000);
      const elecNew = elecOld + Math.floor(Math.random() * 200) + 10;
      const waterOld = Math.floor(Math.random() * 500);
      const waterNew = waterOld + Math.floor(Math.random() * 20) + 1;

      const elecPrice = 3500;
      const waterPrice = 6000;

      const totalAmount =
        (elecNew - elecOld) * elecPrice + (waterNew - waterOld) * waterPrice;

      // Insert usage
      const [usageResult] = await db.query(
        `INSERT INTO monthly_usages 
            (room_id, month, year, electricity_old_index, electricity_new_index, electricity_price, water_old_index, water_new_index, water_price, total_amount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          room.id,
          currentMonth,
          currentYear,
          elecOld,
          elecNew,
          elecPrice,
          waterOld,
          waterNew,
          waterPrice,
          totalAmount,
        ]
      );

      const usageId = usageResult.insertId;

      // Create Utility Invoice
      // Shorten invoice code to fit VARCHAR(20)
      const invoiceCode = `U${room.id}-${Date.now()
        .toString()
        .slice(-8)}-${Math.floor(Math.random() * 10)}`;
      utilityInvoices.push([
        invoiceCode,
        "UTILITY_FEE",
        activeSemesterId,
        room.id,
        null, // student_id is null for utility
        usageId,
        totalAmount,
        `Tiền điện nước tháng ${currentMonth}/${currentYear} phòng ${room.room_number}`,
        "UNPAID",
        new Date(now.getFullYear(), now.getMonth() + 1, 10),
        null,
        null,
        null,
        managerId,
      ]);
    }

    if (utilityInvoices.length > 0) {
      await db.query(
        `INSERT INTO invoices 
            (invoice_code, type, semester_id, room_id, student_id, usage_id, amount, description, status, due_date, paid_at, paid_by_student_id, payment_method, created_by_manager_id)
            VALUES ?`,
        [utilityInvoices]
      );
    }

    // 6. Seed Room Fee Invoices
    console.log("Seeding Room Fee Invoices...");
    // Get active stay records
    const [stayRecords] = await db.query(
      `
        SELECT sr.student_id, sr.room_id, r.price_per_semester, r.room_number 
        FROM stay_records sr 
        JOIN rooms r ON sr.room_id = r.id 
        WHERE sr.status = 'ACTIVE' AND sr.semester_id = ?`,
      [activeSemesterId]
    );

    const roomInvoices = [];
    for (const record of stayRecords) {
      // Shorten invoice code to fit VARCHAR(20)
      const invoiceCode = `R${record.student_id}-${Date.now()
        .toString()
        .slice(-8)}-${Math.floor(Math.random() * 10)}`;
      roomInvoices.push([
        invoiceCode,
        "ROOM_FEE",
        activeSemesterId,
        record.room_id,
        record.student_id,
        null, // usage_id
        record.price_per_semester,
        `Tiền phòng học kỳ 1 năm học 2024-2025 - Phòng ${record.room_number}`,
        "UNPAID",
        new Date(now.getFullYear(), now.getMonth() + 1, 15),
        null,
        null,
        null,
        managerId,
      ]);
    }

    if (roomInvoices.length > 0) {
      await db.query(
        `INSERT INTO invoices 
            (invoice_code, type, semester_id, room_id, student_id, usage_id, amount, description, status, due_date, paid_at, paid_by_student_id, payment_method, created_by_manager_id)
            VALUES ?`,
        [roomInvoices]
      );
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();
