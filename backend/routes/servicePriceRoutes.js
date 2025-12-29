import express from "express";
import * as servicePriceController from "../controllers/servicePriceController.js";

const router = express.Router();

router.get("/", servicePriceController.getAllServicePrices);
router.get("/name", servicePriceController.getServicePriceByName);
router.get("/:id", servicePriceController.getServicePriceById);
router.post("/", servicePriceController.createServicePrice);
router.put("/:id", servicePriceController.updateServicePrice);
router.delete("/:id", servicePriceController.deleteServicePrice);
router.patch("/:id/deactivate", servicePriceController.deactivateServicePrice);

export default router;
