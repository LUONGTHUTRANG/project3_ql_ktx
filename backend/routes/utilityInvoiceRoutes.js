import express from "express";
import * as utilityInvoiceController from "../controllers/utilityInvoiceController.js";
import { manuallyCreateUtilityInvoiceCycle } from "../cronJobs.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// Manually trigger utility invoice cycle creation (for testing or early trigger)
router.post("/manual-create-cycle", async (req, res) => {
  try {
    const result = await manuallyCreateUtilityInvoiceCycle();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cycle routes
router.get("/cycles", utilityInvoiceController.getAllCycles);
router.get("/cycles/current", utilityInvoiceController.getCurrentCycle);
router.get("/cycles/:cycleId", utilityInvoiceController.getCycleById);
router.get("/cycles/:cycleId/invoices", utilityInvoiceController.getInvoicesByCycle);
router.get("/cycles/:cycleId/invoices/status/:status", utilityInvoiceController.getInvoicesByStatus);
router.post("/cycles/:cycleId/publish", utilityInvoiceController.publishCycle);
router.post("/cycles/:cycleId/record-readings", utilityInvoiceController.recordBulkReadings);

// Invoice routes
router.get("/:invoiceId", utilityInvoiceController.getInvoiceById);
router.post("/record", utilityInvoiceController.recordUtilityInvoice);
router.put("/:invoiceId", utilityInvoiceController.updateUtilityInvoice);
router.delete("/:invoiceId", utilityInvoiceController.deleteInvoice);

export default router;
