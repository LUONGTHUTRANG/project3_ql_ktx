import UtilityInvoiceCycle from "../models/utilityInvoiceCycleModel.js";
import UtilityInvoice from "../models/utilityInvoiceModel.js";
import Invoice from "../models/invoiceModel.js";
import ServicePrice from "../models/servicePriceModel.js";
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

    // Get cycle
    const cycle = await UtilityInvoiceCycle.getById(cycleId);
    if (!cycle) {
      return res.status(404).json({ message: "Utility invoice cycle not found" });
    }

    // Get all utility invoices ready to publish
    const utilityInvoices = await UtilityInvoice.getReadyToPublish(cycleId);

    if (utilityInvoices.length === 0) {
      return res.status(400).json({ message: "No utility invoices ready to publish" });
    }

    // Get service prices
    const servicePrices = await ServicePrice.getAll();
    const elecPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "ELECTRICITY")?.unit_price || 2950
    );
    const waterPrice = parseFloat(
      servicePrices.find((p) => p.service_name === "WATER")?.unit_price || 10000
    );

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
      });

      // Update utility invoice with invoice_id and amount
      await UtilityInvoice.update(ui.id, {
        amount: amount,
        status: "PUBLISHED",
        invoice_id: invoiceId,
      });
    });

    await Promise.all(invoicePromises);

    // Update cycle status to PUBLISHED
    await UtilityInvoiceCycle.updateStatus(cycleId, "PUBLISHED");

    res.json({ message: "Utility invoice cycle published successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
