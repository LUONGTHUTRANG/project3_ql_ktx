import cron from "node-cron";
import db from "./config/db.js";
import UtilityInvoiceCycle from "./models/utilityInvoiceCycleModel.js";
import UtilityInvoice from "./models/utilityInvoiceModel.js";

/**
 * Initialize cron jobs for the application
 * - Create utility invoice cycle on the 27th of each month
 * - Create utility invoices for all rooms with old readings from previous cycle
 */
export const initializeCronJobs = () => {
  // Run at 00:00 (midnight) on the 27th of every month
  // cron pattern: minute hour day month day-of-week
  const cronPattern = "0 0 27 * *";

  cron.schedule(cronPattern, async () => {
    console.log("[CRON] Starting utility invoice cycle creation job...");
    try {
      await createMonthlyUtilityInvoiceCycle();
      console.log("[CRON] Utility invoice cycle creation job completed successfully");
    } catch (error) {
      console.error("[CRON] Error in utility invoice cycle creation job:", error);
    }
  });

  console.log("[CRON] Utility invoice cycle creation job scheduled for: 0 0 27 * * (27th of every month at 00:00)");

  // Auto-reject unpaid registrations after 24h - run every hour
  cron.schedule("0 * * * *", async () => {
    console.log("[CRON] Checking for expired pending registrations...");
    try {
      await autoRejectExpiredRegistrations();
    } catch (error) {
      console.error("[CRON] Error in auto-reject job:", error);
    }
  });

  console.log("[CRON] Auto-reject expired registrations job scheduled to run every hour");
};

/**
 * Create a new utility invoice cycle and utility invoices for all rooms
 * Gets electricity_old and water_old from the most recent published invoice
 */
async function createMonthlyUtilityInvoiceCycle() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Check if cycle already exists for this month
    const existingCycle = await UtilityInvoiceCycle.getByMonthYear(currentMonth, currentYear);
    if (existingCycle) {
      console.log(`[CRON] Cycle already exists for ${currentMonth}/${currentYear}, skipping creation`);
      return;
    }

    console.log(`[CRON] Creating new cycle for ${currentMonth}/${currentYear}`);

    // Create new cycle
    const cycleId = await UtilityInvoiceCycle.create({
      month: currentMonth,
      year: currentYear,
      status: "DRAFT",
    });

    console.log(`[CRON] Created cycle with ID: ${cycleId}`);

    // Get all active rooms
    const [roomsList] = await db.query(
      `SELECT r.id, r.room_number FROM rooms r 
       WHERE r.status IN ('AVAILABLE', 'FULL')`
    );

    console.log(`[CRON] Found ${roomsList.length} active rooms`);

    // Create utility invoices for each room
    const utilityInvoicesToInsert = [];

    for (const room of roomsList) {
      try {
        // Get the most recent published utility invoice for this room
        const [lastInvoices] = await db.query(
          `SELECT electricity_new, water_new 
           FROM utility_invoices 
           WHERE room_id = ? AND status = 'PUBLISHED'
           ORDER BY created_at DESC 
           LIMIT 1`,
          [room.id]
        );

        const electricityOld = lastInvoices.length > 0 ? lastInvoices[0].electricity_new : null;
        const waterOld = lastInvoices.length > 0 ? lastInvoices[0].water_new : null;

        utilityInvoicesToInsert.push([
          cycleId,
          room.id,
          electricityOld,
          null, // electricity_new
          waterOld,
          null, // water_new
          null, // amount
          "DRAFT", // status
        ]);

        if (lastInvoices.length > 0) {
          console.log(`[CRON] Room ${room.room_number}: Old readings E=${electricityOld}, W=${waterOld}`);
        } else {
          console.log(`[CRON] Room ${room.room_number}: No previous readings found`);
        }
      } catch (error) {
        console.error(`[CRON] Error processing room ${room.id}:`, error.message);
      }
    }

    // Bulk insert utility invoices
    if (utilityInvoicesToInsert.length > 0) {
      await db.query(
        `INSERT INTO utility_invoices 
         (cycle_id, room_id, electricity_old, electricity_new, water_old, water_new, amount, status) 
         VALUES ?`,
        [utilityInvoicesToInsert]
      );

      console.log(`[CRON] Created ${utilityInvoicesToInsert.length} utility invoices for cycle ${cycleId}`);
    }

    console.log(`[CRON] Monthly utility invoice cycle creation completed successfully`);
  } catch (error) {
    console.error("[CRON] Error in createMonthlyUtilityInvoiceCycle:", error);
    throw error;
  }
}

/**
 * Auto-reject PENDING NORMAL registrations that are older than 24 hours
 */
async function autoRejectExpiredRegistrations() {
  try {
    const [expiredRegistrations] = await db.query(
      `SELECT id, student_id 
       FROM registrations 
       WHERE registration_type = 'NORMAL' 
         AND status = 'PENDING'
         AND desired_room_id IS NOT NULL
         AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    if (expiredRegistrations.length === 0) {
      console.log("[CRON] No expired registrations found");
      return;
    }

    console.log(`[CRON] Found ${expiredRegistrations.length} expired registrations to reject`);

    // Update status to REJECTED
    const registrationIds = expiredRegistrations.map(r => r.id);
    await db.query(
      `UPDATE registrations 
       SET status = 'REJECTED', 
           admin_note = 'Tự động từ chối do quá thời hạn thanh toán (24h)' 
       WHERE id IN (?)`,
      [registrationIds]
    );

    // Create notifications for students
    const notifications = expiredRegistrations.map(r => [
      'STUDENT',
      r.student_id,
      'Đơn đăng ký bị từ chối',
      'Đơn đăng ký chỗ ở của bạn đã bị từ chối do quá thời hạn thanh toán (24 giờ). Vui lòng đăng ký lại nếu còn phòng trống.',
      0 // unread
    ]);

    if (notifications.length > 0) {
      await db.query(
        `INSERT INTO notifications (target_type, target_user_id, title, content, is_read) VALUES ?`,
        [notifications]
      );
    }

    console.log(`[CRON] Rejected ${expiredRegistrations.length} expired registrations`);
  } catch (error) {
    console.error("[CRON] Error in autoRejectExpiredRegistrations:", error);
    throw error;
  }
}

/**
 * Optional: Manual trigger function to create cycle (useful for testing or admin operations)
 */
export const manuallyCreateUtilityInvoiceCycle = async () => {
  try {
    await createMonthlyUtilityInvoiceCycle();
    return { success: true, message: "Utility invoice cycle created successfully" };
  } catch (error) {
    console.error("Error in manuallyCreateUtilityInvoiceCycle:", error);
    throw error;
  }
};

// Export for testing (ES module syntax)
export { autoRejectExpiredRegistrations };


