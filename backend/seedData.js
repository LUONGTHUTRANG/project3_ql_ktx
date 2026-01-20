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
    await db.query("ALTER TABLE admins AUTO_INCREMENT = 1");
    await db.query(
      "INSERT INTO admins (username, password_hash, full_name) VALUES (?, ?, ?)",
      ["admin", adminPassword, "System Administrator"]
    );

    // 2. Seed Buildings
    console.log("Seeding Buildings...");
    await db.query("DELETE FROM buildings");
    await db.query("ALTER TABLE buildings AUTO_INCREMENT = 1");
    const buildings = [
      ["C1", "Khu ký túc xá – Dãy C1", "MIXED"],
      ["C2", "Khu ký túc xá – Dãy C2", "MIXED"],
      ["C3", "Khu ký túc xá – Dãy C3", "MIXED"],
    ];
    await db.query(
      "INSERT INTO buildings (name, location, gender_restriction) VALUES ?",
      [buildings]
    );

    // 3. Seed Rooms
    console.log("Seeding Rooms...");
    await db.query("DELETE FROM rooms");
    await db.query("ALTER TABLE rooms AUTO_INCREMENT = 1");
    const rooms = [
      // Building C1 (building_id = 1)
      [1, "P101", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P102", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P103", 1, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P104", 1, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P105", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P106", 1, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P107", 1, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P108", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P109", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P110", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P111", 1, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P112", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P113", 1, 10, 4500000.00, 0, 0, 0, "AVAILABLE"],
      [1, "P114", 1, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      // Building C2 (building_id = 2)
      [2, "P201", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P202", 2, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P203", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P204", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P205", 2, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P206", 2, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P207", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P208", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P209", 2, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P210", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P211", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P212", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P213", 2, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [2, "P214", 2, 10, 4500000.00, 0, 0, 0, "AVAILABLE"],
      // Building C3 (building_id = 3)
      [3, "P301", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P302", 3, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P303", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P304", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P305", 3, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P306", 3, 8, 4000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P307", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P308", 3, 6, 3500000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P309", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P310", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
      [3, "P311", 3, 4, 3000000.00, 0, 0, 0, "AVAILABLE"],
    ];
    await db.query(
      "INSERT INTO rooms (building_id, room_number, floor, max_capacity, price_per_semester, has_ac, has_heater, has_washer, status) VALUES ?",
      [rooms]
    );

    // 4. Seed Semesters (Initialize semesters - only one is active at a time)
    console.log("Seeding Semesters...");
    await db.query("DELETE FROM semesters");
    await db.query("ALTER TABLE semesters AUTO_INCREMENT = 1");
    const semesters_data = [
      [
        "2025-02-01",
        "2025-06-15",
        "2025-01-05 08:00:00",
        "2025-01-20 17:00:00",
        "2025-01-01 08:00:00",
        "2025-01-04 17:00:00",
        "2025-01-21 08:00:00",
        "2025-01-30 17:00:00",
        0,
        "2",
        "2024-2025"
      ],
      [
        "2025-07-01",
        "2025-08-15",
        "2025-06-10 08:00:00",
        "2025-06-20 17:00:00",
        null,
        null,
        "2025-06-21 08:00:00",
        "2025-06-30 17:00:00",
        0,
        "3",
        "2024-2025"
      ],
      [
        "2025-09-15",
        "2026-02-03",
        "2025-09-01 09:41:00",
        "2025-09-10 09:41:00",
        "2025-08-10 09:41:00",
        "2025-08-20 09:41:00",
        "2025-08-10 09:42:00",
        "2026-08-25 09:42:00",
        1,
        "1",
        "2025-2026"
      ]
    ];

    await db.query(
      `INSERT INTO semesters (start_date, end_date, registration_open_date, registration_close_date, registration_special_open_date, registration_special_close_date, renewal_open_date, renewal_close_date, is_active, term, academic_year) VALUES ?`,
      [semesters_data]
    );

    // 5. Seed Managers
    console.log("Seeding Managers...");
    await db.query("DELETE FROM managers");
    await db.query("ALTER TABLE managers AUTO_INCREMENT = 1");
    // Assuming buildings 1 and 2 exist. If not, set building_id to NULL or ensure buildings are seeded first.
    // We will assume the main SQL script has been run which inserts buildings.
    const managers = [
      [
        "manager1@ktx.com",
        managerPassword,
        "Manager One",
        "0901234561",
        1,
        1,
      ],
      [
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
        "INSERT INTO managers (email, password_hash, full_name, phone_number, is_first_login, building_id) VALUES ?",
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

    // 6. Seed Students
    console.log("Seeding Students...");
    await db.query("DELETE FROM students");
    await db.query("ALTER TABLE students AUTO_INCREMENT = 1");
    
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
      ],
    ];
    
    await db.query(
      "INSERT INTO students (mssv, password_hash, full_name, email, phone_number, gender, class_name, student_status) VALUES ?",
      [students]
    );

    // Get inserted student IDs
    const [insertedStudents] = await db.query(
      "SELECT id FROM students ORDER BY id ASC LIMIT 5"
    );
    const studentIds = insertedStudents.map(s => s.id);

    // 7. Seed Stay Records (Students staying in rooms)
    console.log("Seeding Stay Records...");
    await db.query("DELETE FROM stay_records");
    await db.query("ALTER TABLE stay_records AUTO_INCREMENT = 1");
    
    // Get active semester
    const [semesters] = await db.query(
      "SELECT id, start_date FROM semesters WHERE is_active = 1 LIMIT 1"
    );
    const activeSemesterId = semesters.length > 0 ? semesters[0].id : 4;
    const semesterStartDate = semesters.length > 0 ? semesters[0].start_date : '2025-09-15';

    // Create stay records for students using actual student IDs
    const stayRecords = [
      [studentIds[0], 15, activeSemesterId, semesterStartDate, null, 'ACTIVE'],
      [studentIds[1], 15, activeSemesterId, semesterStartDate, null, 'ACTIVE'],
      [studentIds[2], 20, activeSemesterId, semesterStartDate, null, 'ACTIVE'],
      [studentIds[3], 26, activeSemesterId, semesterStartDate, null, 'ACTIVE'],
      [studentIds[4], 49, activeSemesterId, semesterStartDate, null, 'ACTIVE'],
    ];

    await db.query(
      "INSERT INTO stay_records (student_id, room_id, semester_id, start_date, end_date, status) VALUES ?",
      [stayRecords]
    );

    // 8. Seed Service Prices
    console.log("Seeding Service Prices...");
    // Clear old data
    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE invoices");
    await db.query("TRUNCATE TABLE utility_invoices");
    await db.query("TRUNCATE TABLE utility_invoice_cycles");
    await db.query("TRUNCATE TABLE room_fee_invoices");
    await db.query("TRUNCATE TABLE other_invoices");
    await db.query("TRUNCATE TABLE service_prices");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");
    await db.query("ALTER TABLE service_prices AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE invoices AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE utility_invoices AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE utility_invoice_cycles AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE room_fee_invoices AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE other_invoices AUTO_INCREMENT = 1");

    const servicePrices = [
      ["ELECTRICITY", 2950.0, new Date(), 1, "kWh"],
      ["WATER", 10000.0, new Date(), 1, "m3"],
    ];
    await db.query(
      "INSERT INTO service_prices (service_name, unit_price, apply_date, is_active, unit) VALUES ?",
      [servicePrices]
    );

    // 9. Seed Utility Invoice Cycles
    console.log("Seeding Utility Invoice Cycles...");
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Create current month cycle
    const [cycleResult] = await db.query(
      `INSERT INTO utility_invoice_cycles (month, year, status)
       VALUES (?, ?, 'DRAFT')`,
      [currentMonth, currentYear]
    );
    const cycleId = cycleResult.insertId;

    // 10. Seed Utility Invoices
    console.log("Seeding Utility Invoices...");
    const [roomsList] = await db.query("SELECT id, room_number FROM rooms");

    const utilityInvoicesToInsert = [];
    const roomsWithUsage = new Set();

    // Generate utility invoices for about 60% of rooms with readings
    for (const room of roomsList) {
      if (Math.random() > 0.6) {
        continue;
      }

      roomsWithUsage.add(room.id);

      const elecOld = Math.floor(Math.random() * 1000);
      const elecNew = elecOld + Math.floor(Math.random() * 200) + 10;
      const waterOld = Math.floor(Math.random() * 500);
      const waterNew = waterOld + Math.floor(Math.random() * 20) + 1;

      // Calculate amount based on usage and unit prices
      const electricityUsage = elecNew - elecOld;
      const waterUsage = waterNew - waterOld;
      const amount = electricityUsage * 2950.0 + waterUsage * 10000.0;

      utilityInvoicesToInsert.push([
        cycleId,
        room.id,
        elecOld,
        elecNew,
        waterOld,
        waterNew,
        amount, // calculated amount
        "DRAFT", // status
      ]);
    }

    // Generate utility invoices without readings for about 30% of remaining rooms
    for (const room of roomsList) {
      if (roomsWithUsage.has(room.id)) continue;
      if (Math.random() > 0.3) continue;

      utilityInvoicesToInsert.push([
        cycleId,
        room.id,
        null, // electricity_old
        null, // electricity_new
        null, // water_old
        null, // water_new
        null, // amount
        "DRAFT", // status
      ]);
    }

    if (utilityInvoicesToInsert.length > 0) {
      await db.query(
        `INSERT INTO utility_invoices 
         (cycle_id, room_id, electricity_old, electricity_new, water_old, water_new, amount, status) 
         VALUES ?`,
        [utilityInvoicesToInsert]
      );
    }

    // 11. Seed Room Fee Invoices
    console.log("Seeding Room Fee Invoices...");
    const [activeStayRecords] = await db.query(
      `SELECT sr.student_id, sr.room_id, r.price_per_semester, r.room_number 
       FROM stay_records sr 
       JOIN rooms r ON sr.room_id = r.id 
       WHERE sr.status = 'ACTIVE' AND sr.semester_id = ?`,
      [activeSemesterId]
    );

    const roomFeeInvoicesToInsert = [];
    let roomFeeSeq = 1;
    const yearMonth = `${currentYear}${String(currentMonth).padStart(2, '0')}`;
    for (const record of activeStayRecords) {
      // Create invoice first with format: ROOM-YYYYMM-SEQNO (max 20 chars)
      const invoiceCode = `ROOM-${yearMonth}-${String(roomFeeSeq).padStart(4, '0')}`;
      roomFeeSeq++;
      const [invoiceResult] = await db.query(
        `INSERT INTO invoices 
         (invoice_code, invoice_category, total_amount, status)
         VALUES (?, 'ROOM_FEE', ?, 'PUBLISHED')`,
        [invoiceCode, record.price_per_semester]
      );

      roomFeeInvoicesToInsert.push([
        invoiceResult.insertId,
        record.student_id,
        record.room_id,
        activeSemesterId,
        record.price_per_semester,
      ]);
    }

    if (roomFeeInvoicesToInsert.length > 0) {
      await db.query(
        `INSERT INTO room_fee_invoices 
         (invoice_id, student_id, room_id, semester_id, price_per_semester) 
         VALUES ?`,
        [roomFeeInvoicesToInsert]
      );
    }

    // 12. Seed Other Invoices (Optional - some misc charges)
    console.log("Seeding Other Invoices...");
    const [managersList] = await db.query("SELECT id FROM managers LIMIT 1");
    const managerId = managersList.length > 0 ? managersList[0].id : 1;

    // Create a few sample other invoices
    const otherInvoicesToInsert = [];
    let otherSeq = 1;
    if (studentIds.length > 0) {
      // Format: OTHER-YYYYMM-SEQNO (max 20 chars)
      const invoiceCode1 = `OTHER-${yearMonth}-${String(otherSeq).padStart(4, '0')}`;
      otherSeq++;
      const [invoiceResult1] = await db.query(
        `INSERT INTO invoices 
         (invoice_code, invoice_category, total_amount, status)
         VALUES (?, 'OTHER', ?, 'PUBLISHED')`,
        [invoiceCode1, 500000]
      );

      otherInvoicesToInsert.push([
        invoiceResult1.insertId,
        "STUDENT",
        studentIds[0],
        null,
        "Tiền sửa chữa đồ dùng phòng",
        "Sửa chữa bàn ghế hư hỏng",
        500000,
      ]);
    }

    // Add a sample room-related other invoice
    if (roomsList.length > 0) {
      const invoiceCode2 = `OTHER-${yearMonth}-${String(otherSeq).padStart(4, '0')}`;
      const [invoiceResult2] = await db.query(
        `INSERT INTO invoices 
         (invoice_code, invoice_category, total_amount, status)
         VALUES (?, 'OTHER', ?, 'PUBLISHED')`,
        [invoiceCode2, 200000]
      );

      otherInvoicesToInsert.push([
        invoiceResult2.insertId,
        "ROOM",
        null,
        roomsList[0].id,
        "Tiền vệ sinh chung cư",
        "Vệ sinh tầng lầu và hành lang",
        200000,
      ]);
    }

    if (otherInvoicesToInsert.length > 0) {
      await db.query(
        `INSERT INTO other_invoices 
         (invoice_id, target_type, target_student_id, target_room_id, title, description, amount) 
         VALUES ?`,
        [otherInvoicesToInsert]
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
