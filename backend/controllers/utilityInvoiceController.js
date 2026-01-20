import UtilityInvoiceCycle from "../models/utilityInvoiceCycleModel.js";
import UtilityInvoice from "../models/utilityInvoiceModel.js";
import Invoice from "../models/invoiceModel.js";
import ServicePrice from "../models/servicePriceModel.js";
import Student from "../models/studentModel.js";
import Notification from "../models/notificationModel.js";
import db from "../config/db.js";

// Get all utility invoice cycles
export const getAllCycles = async (req, res) => {
  try {
    const cycles = await UtilityInvoiceCycle.getAll();
    res.json(cycles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current utility invoice cycle
export const getCurrentCycle = async (req, res) => {
  try {
    const cycle = await UtilityInvoiceCycle.getCurrent();
    if (!cycle) {
      return res.status(404).json({ message: "No utility invoice cycle found" });
    }
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get cycle by ID
export const getCycleById = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }
    res.json(cycle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get utility invoices for a cycle
export const getInvoicesByCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userBuildingId = req.user?.building_id; // Get from decoded token
    
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }

    // Pass building_id to model for database-level filtering
    const invoices = await UtilityInvoice.getByCycleId(cycleId, userBuildingId);

    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record utility invoice data (electricity & water readings)
export const recordUtilityInvoice = async (req, res) => {
  try {
    const { cycleId, roomId, electricityNew, waterNew } = req.body;

    if (!cycleId || !roomId || electricityNew === undefined || waterNew === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get cycle
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }

    // Get or create utility invoice for this room in this cycle
    let utilityInvoice = await UtilityInvoice.getByRoomAndCycle(roomId, cycleId);

    if (!utilityInvoice) {
      // Create new utility invoice
      const invoiceId = await UtilityInvoice.create({
        cycle_id: cycleId,
        room_id: roomId,
        electricity_old: 0,
        electricity_new: electricityNew,
        water_old: 0,
        water_new: waterNew,
        amount: 0, // Will be calculated on publish
        status: "DRAFT",
      });
      utilityInvoice = await UtilityInvoice.getById(invoiceId);
    } else {
      // Update existing utility invoice
      await UtilityInvoice.update(utilityInvoice.id, {
        electricity_new: electricityNew,
        water_new: waterNew,
      });
      utilityInvoice = await UtilityInvoice.getById(utilityInvoice.id);
    }

    res.json(utilityInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Record bulk utility invoice readings
export const recordBulkReadings = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { readings } = req.body;

    if (!cycleId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ message: "Missing or invalid readings array" });
    }

    // Get cycle
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }

    // Get service prices for amount calculation
    const servicePrices = await ServicePrice.getAll();
    const elecPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "ELECTRICITY")?.unit_price || 3500
    );
    const waterPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "WATER")?.unit_price || 25000
    );

    // Process each reading
    const results = [];
    for (const reading of readings) {
      try {
        const { room_id, electricity_old, electricity_new, water_old, water_new } = reading;

        if (!room_id || electricity_new === undefined || water_new === undefined) {
          results.push({
            room_id,
            status: "error",
            message: "Missing required fields"
          });
          continue;
        }

        // Get existing utility invoice
        let utilityInvoice = await UtilityInvoice.getByRoomAndCycle(room_id, cycleId);

        if (!utilityInvoice) {
          results.push({
            room_id,
            status: "error",
            message: "No utility invoice found for this room in this cycle"
          });
          continue;
        }

        // Prepare update data
        const updateData = {
          electricity_new: electricity_new,
          water_new: water_new,
          status: 'READY',
        };

        // Update old readings if provided
        if (electricity_old !== undefined && electricity_old !== null) {
          updateData.electricity_old = electricity_old;
        }
        if (water_old !== undefined && water_old !== null) {
          updateData.water_old = water_old;
        }

        // Calculate amount if both old readings exist
        let amount = 0;
        const finalElectricityOld = electricity_old !== undefined && electricity_old !== null 
          ? electricity_old 
          : utilityInvoice.electricity_old;
        const finalWaterOld = water_old !== undefined && water_old !== null 
          ? water_old 
          : utilityInvoice.water_old;

        if (finalElectricityOld !== null && finalWaterOld !== null) {
          const electricityUsage = electricity_new - finalElectricityOld;
          const waterUsage = water_new - finalWaterOld;
          amount = electricityUsage * elecPrice + waterUsage * waterPrice;
          updateData.amount = amount;
        }

        // Update utility invoice
        await UtilityInvoice.update(utilityInvoice.id, updateData);

        const updated = await UtilityInvoice.getById(utilityInvoice.id);
        results.push({
          room_id,
          status: "success",
          invoice: updated
        });
      } catch (err) {
        results.push({
          room_id: reading.room_id,
          status: "error",
          message: err.message
        });
      }
    }

    res.json({
      cycle_id: cycleId,
      total: readings.length,
      results: results
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update utility invoice with old readings
export const updateUtilityInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { electricityOld, electricityNew, waterOld, waterNew } = req.body;

    const utilityInvoice = await UtilityInvoice.getById(invoiceId);
    if (!utilityInvoice) {
      return res.status(404).json({ message: "Utility invoice not found" });
    }

    await UtilityInvoice.update(invoiceId, {
      electricity_old: electricityOld !== undefined ? electricityOld : utilityInvoice.electricity_old,
      electricity_new: electricityNew !== undefined ? electricityNew : utilityInvoice.electricity_new,
      water_old: waterOld !== undefined ? waterOld : utilityInvoice.water_old,
      water_new: waterNew !== undefined ? waterNew : utilityInvoice.water_new,
    });

    const updated = await UtilityInvoice.getById(invoiceId);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Publish utility invoices (create corresponding invoices)
export const publishCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const userBuildingId = req.user?.building_id; // Get from decoded token
    console.log("Publishing utility invoice cycle:", cycleId, "Building ID:", userBuildingId);

    // Get cycle
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    console.log("Found cycle:", cycle);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }

    // Check if all invoices in the cycle have been recorded
    const isReadyToPublish = await UtilityInvoice.checkReadyToPublish(cycleId, userBuildingId);
    console.log("Is cycle ready to publish?", isReadyToPublish);
    
    if (!isReadyToPublish) {
      return res.status(400).json({ message: "Not all utility invoices have been recorded. Please record all meter readings before publishing." });
    }

    // Get all utility invoices for this cycle
    const utilityInvoices = await UtilityInvoice.getAllByCycle(cycleId, userBuildingId);
    console.log(`Found ${utilityInvoices.length} utility invoices for cycle ${cycleId}`);
    if (utilityInvoices.length === 0) {
      return res.status(400).json({ message: "No utility invoices found for this cycle" });
    }

    // Get service prices
    const servicePrices = await ServicePrice.getAll();
    const elecPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "ELECTRICITY")?.unit_price || 2950
    );
    const waterPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "WATER")?.unit_price || 10000
    );

    console.log("Using service prices - Electricity:", elecPrice, "Water:", waterPrice);

    // Create invoices for each utility invoice
    let invoiceSeq = 1;
    const yearMonth = `${cycle.year}${String(cycle.month).padStart(2, '0')}`;
    const invoicePromises = utilityInvoices.map(async (ui) => {
      const amount =
        (ui.electricity_new - ui.electricity_old) * elecPrice +
        (ui.water_new - ui.water_old) * waterPrice;

      // Create invoice with format: UTIL-YYYYMM-SEQNO (max 20 chars)
      const invoiceCode = `UTIL-${yearMonth}-${String(invoiceSeq).padStart(4, '0')}`;
      invoiceSeq++;

      const invoiceId = await Invoice.create({
        invoice_code: invoiceCode,
        invoice_category: "UTILITY",
        total_amount: amount,
        status: "PUBLISHED",
        created_by_manager_id: req.user?.id,
        published_at: new Date(),
      });

      console.log(`Created invoice ${invoiceCode} with ID ${invoiceId} for utility invoice ID ${ui.id}, amount: ${amount}`);

      // Update utility invoice with invoice_id and amount
      await UtilityInvoice.update(ui.id, {
        amount: amount,
        status: "PUBLISHED",
        invoice_id: invoiceId,
      });
    });

    await Promise.all(invoicePromises);

    console.log(`Published ${utilityInvoices.length} utility invoices for cycle ${cycleId}`);

    // Update cycle status to PUBLISHED
    await UtilityInvoiceCycle.updateStatus(cycleId, "PUBLISHED");

    // Send notifications to students about published utility invoices
    try {
      console.log("Starting notification sending process...");
      console.log("Utility invoices data:", JSON.stringify(utilityInvoices.slice(0, 2), null, 2)); // Log first 2 for debugging
      await sendUtilityPublishNotifications(utilityInvoices, cycle, req.user);
      console.log("Notifications sent successfully");
    } catch (notificationErr) {
      console.error("Error sending notifications:", notificationErr.message);
      console.error("Stack:", notificationErr.stack);
      // Don't fail the publish if notifications fail
    }

    res.json({ message: "Utility invoice cycle published successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to send notifications about published utility invoices
const sendUtilityPublishNotifications = async (utilityInvoices, cycle, user) => {
  try {
    if (!utilityInvoices || utilityInvoices.length === 0) {
      console.log("No utility invoices to send notifications for");
      return;
    }

    console.log(`Processing notifications for ${utilityInvoices.length} utility invoices`);
    
    const title = `Hóa đơn điện nước tháng ${cycle.month}/${cycle.year} đã phát hành`;
    const content = `Hóa đơn tiền điện nước cho tháng ${cycle.month}/${cycle.year} của bạn đã được phát hành. Vui lòng kiểm tra chi tiết và thanh toán trong hạn.`;

    // Create notification
    const notificationId = await Notification.create({
      title,
      content,
      attachment_path: null,
      sender_role: user.role === "manager" ? "MANAGER" : "ADMIN",
      sender_id: user.id,
      target_scope: "INDIVIDUAL",
      type: "ANNOUNCEMENT",
    });

    console.log(`Created notification with ID: ${notificationId}`);

    // Get unique room IDs from utility invoices - explicitly check for room_id field
    console.log("Full utility invoice objects:", JSON.stringify(utilityInvoices.slice(0, 1), null, 2));
    
    // Create a map of room_id to building_id from utility invoices
    const roomToBuildingMap = {};
    const roomIds = [];
    for (const ui of utilityInvoices) {
      if (ui.room_id && !isNaN(ui.room_id)) {
        if (!roomToBuildingMap[ui.room_id]) {
          roomToBuildingMap[ui.room_id] = ui.building_id || null;
          roomIds.push(ui.room_id);
          console.log(`Mapped room ${ui.room_id} to building ${ui.building_id}`);
        }
      }
    }
    
    console.log(`Unique room IDs to process: [${roomIds.join(', ')}]`);
    console.log(`Room to building map:`, roomToBuildingMap);

    if (roomIds.length === 0) {
      console.log("ERROR: No valid room IDs found in utility invoices");
      return;
    }

    // Get all students in those rooms and add as recipients
    let totalRecipients = 0;
    const recipientValues = [];
    
    for (const roomId of roomIds) {
      console.log(`Fetching students for room ID: ${roomId}`);
      const students = await Student.getByRoomId(roomId);
      console.log(`Found ${students.length} students in room ${roomId}`);
      
      const buildingId = roomToBuildingMap[roomId];
      
      for (const student of students) {
        if (student && student.id) {
          // Add [notification_id, student_id, room_id, building_id]
          recipientValues.push([notificationId, student.id, roomId, buildingId]);
          totalRecipients++;
          console.log(`Added recipient: notification_id=${notificationId}, student_id=${student.id}, room_id=${roomId}, building_id=${buildingId}`);
        }
      }
    }

    console.log(`Total recipients collected: ${totalRecipients}`);

    if (recipientValues.length > 0) {
      console.log("Calling Notification.addRecipients with values:", recipientValues);
      await Notification.addRecipients(recipientValues);
      console.log(`Successfully added ${totalRecipients} recipients to notification ${notificationId}`);
    } else {
      console.log("WARNING: No recipients found to add to notification");
    }
  } catch (error) {
    console.error("CRITICAL ERROR in sendUtilityPublishNotifications:", error.message);
    console.error("Stack:", error.stack);
    throw error;
  }
};

// Get utility invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const utilityInvoice = await UtilityInvoice.getById(invoiceId);
    if (!utilityInvoice) {
      return res.status(404).json({ message: "Utility invoice not found" });
    }
    res.json(utilityInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete utility invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const utilityInvoice = await UtilityInvoice.getById(invoiceId);
    if (!utilityInvoice) {
      return res.status(404).json({ message: "Utility invoice not found" });
    }

    await UtilityInvoice.delete(invoiceId);
    res.json({ message: "Utility invoice deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get invoices by status in a cycle
export const getInvoicesByStatus = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { status } = req.query;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const invoices = await UtilityInvoice.getByCycleIdAndStatus(cycleId, status);
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
