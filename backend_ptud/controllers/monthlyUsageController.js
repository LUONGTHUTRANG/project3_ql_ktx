import MonthlyUsage from "../models/monthlyUsageModel.js";
import Invoice from "../models/invoiceModel.js";
import Semester from "../models/semesterModel.js";
import Room from "../models/roomModel.js";

export const getMonthlyUsages = async (req, res) => {
  try {
    console.log("getMonthlyUsages called with query:", req.query);
    const { month, year, buildingId } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }
    const usages = await MonthlyUsage.getUsageStatus(month, year, buildingId);
    res.json(usages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getServicePrices = async (req, res) => {
  try {
    const prices = await MonthlyUsage.getCurrentServicePrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const recordUsage = async (req, res) => {
  console.log("recordUsage called with body:", req.body);
  const { roomId, month, year, electricityIndex, waterIndex } = req.body;

  if (
    !roomId ||
    !month ||
    !year ||
    electricityIndex === undefined ||
    waterIndex === undefined
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Get old indexes
    const oldUsage = await MonthlyUsage.getLatestUsageBefore(
      roomId,
      month,
      year
    );
    const electricityOld = oldUsage ? oldUsage.electricity_new_index : 0;
    const waterOld = oldUsage ? oldUsage.water_new_index : 0;

    // Get prices
    const prices = await MonthlyUsage.getCurrentServicePrices();
    const elecPriceObj = prices.find((p) => p.service_name === "ELECTRICITY");
    const waterPriceObj = prices.find((p) => p.service_name === "WATER");

    const elecPrice = elecPriceObj ? parseFloat(elecPriceObj.unit_price) : 3500;
    const waterPrice = waterPriceObj
      ? parseFloat(waterPriceObj.unit_price)
      : 6000;

    const totalAmount =
      (electricityIndex - electricityOld) * elecPrice +
      (waterIndex - waterOld) * waterPrice;

    if (totalAmount < 0) {
      return res
        .status(400)
        .json({ message: "New index must be greater than old index" });
    }

    const usageId = await MonthlyUsage.create({
      room_id: roomId,
      month,
      year,
      electricity_old_index: electricityOld,
      electricity_new_index: electricityIndex,
      electricity_price: elecPrice,
      water_old_index: waterOld,
      water_new_index: waterIndex,
      water_price: waterPrice,
      total_amount: totalAmount,
    });

    // Create Invoice
    const activeSemester = await Semester.getActiveSemester();
    const semesterId = activeSemester ? activeSemester.id : 1;

    const room = await Room.getById(roomId);
    const roomNumber = room ? room.room_number : roomId;

    const invoiceCode = `U${roomId}-${Date.now()
      .toString()
      .slice(-8)}-${Math.floor(Math.random() * 10)}`;

    // Calculate due date (10th of next month)
    // Note: month is 1-based from input usually, let's assume so.
    // If month is 12, next month is 1, year + 1.
    let dueMonth = parseInt(month) + 1;
    let dueYear = parseInt(year);
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear++;
    }
    const dueDate = new Date(dueYear, dueMonth - 1, 10);

    await Invoice.create({
      invoice_code: invoiceCode,
      type: "UTILITY_FEE",
      semester_id: semesterId,
      room_id: roomId,
      student_id: null,
      usage_id: usageId,
      amount: totalAmount,
      description: `Tiền điện nước tháng ${month}/${year} phòng ${roomNumber}`,
      status: "UNPAID",
      due_date: dueDate,
      paid_at: null,
      paid_by_student_id: null,
      payment_method: null,
      payment_proof: null,
      created_by_manager_id: req.user ? req.user.id : 1,
    });

    res
      .status(201)
      .json({ message: "Usage recorded and invoice created", usageId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
