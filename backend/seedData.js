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

    // 2. Seed Buildings
    console.log("Seeding Buildings...");
    await db.query("DELETE FROM buildings");
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

    // 7.5 Clear Registrations (for demo - students will register fresh)
    console.log("Clearing Registrations for fresh demo...");
    await db.query("DELETE FROM registrations");
    console.log("Registrations cleared - students can now register fresh!");

    // 8. Seed Service Prices
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

    // 7. Seed Monthly Usages & Utility Invoices
    console.log("Seeding Monthly Usages and Utility Invoices...");

    // Get all rooms
    const [roomsList] = await db.query("SELECT id, room_number FROM rooms");

    // Get a manager for created_by
    const [managersList] = await db.query("SELECT id FROM managers LIMIT 1");
    const managerId = managersList.length > 0 ? managersList[0].id : 1;

    const utilityInvoices = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const roomsWithUsage = new Set(); // Track rooms with monthly_usages

    // Only generate utility invoices and monthly usages for about 60% of rooms (randomly selected)
    for (const room of roomsList) {
      // Random selection: approximately 60% of rooms have utility invoices
      if (Math.random() > 0.6) {
        continue; // Skip this room
      }

      roomsWithUsage.add(room.id);

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

      // Create Utility Invoice with usage_id
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

    // Generate some utility invoices WITHOUT usage_id (chưa ghi chỉ số)
    // About 30% of rooms without usage will have invoices created but not recorded usage
    // These invoices have amount = null since usage hasn't been recorded yet
    for (const room of roomsList) {
      if (roomsWithUsage.has(room.id)) {
        continue; // Skip rooms that already have usage
      }

      // Random selection: approximately 30% of remaining rooms
      if (Math.random() > 0.3) {
        continue;
      }

      // Create Utility Invoice WITHOUT usage_id and WITHOUT amount (chưa ghi)
      const invoiceCode = `U${room.id}-${Date.now()
        .toString()
        .slice(-9)}-${Math.floor(Math.random() * 10)}`;

      utilityInvoices.push([
        invoiceCode,
        "UTILITY_FEE",
        activeSemesterId,
        room.id,
        null, // student_id is null for utility
        null, // usage_id is NULL (chưa ghi chỉ số)
        0, // amount is 0 (chưa có dữ liệu vì chưa ghi chỉ số)
        `Tiền điện nước tháng ${currentMonth}/${currentYear} phòng ${room.room_number} (chưa ghi chỉ số)`,
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

    // 8. Seed Room Fee Invoices
    console.log("Seeding Room Fee Invoices...");
    // Get stay records that are ACTIVE in current semester
    const [activeStayRecords] = await db.query(
      `
        SELECT sr.student_id, sr.room_id, r.price_per_semester, r.room_number 
        FROM stay_records sr 
        JOIN rooms r ON sr.room_id = r.id 
        WHERE sr.status = 'ACTIVE' AND sr.semester_id = ?`,
      [activeSemesterId]
    );

    const roomInvoices = [];
    for (const record of activeStayRecords) {
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
