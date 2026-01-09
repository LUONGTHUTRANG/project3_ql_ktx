import ServicePrice from "../models/servicePriceModel.js";

export const getAllServicePrices = async (req, res) => {
  try {
    const prices = await ServicePrice.getAll();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getServicePriceById = async (req, res) => {
  try {
    const price = await ServicePrice.getById(req.params.id);
    if (!price) return res.status(404).json({ message: "Service price not found" });
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getServicePriceByName = async (req, res) => {
  try {
    const { serviceName } = req.query;
    if (!serviceName) {
      return res.status(400).json({ message: "Service name is required" });
    }
    const price = await ServicePrice.getByServiceName(serviceName);
    if (!price) return res.status(404).json({ message: "Service price not found" });
    res.json(price);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createServicePrice = async (req, res) => {
  try {
    const { service_name, unit_price, apply_date } = req.body;
    
    // Validate required fields
    if (!service_name || !unit_price || !apply_date) {
      return res.status(400).json({ message: "Service name, unit price, and apply date are required" });
    }
    
    // Validate unit_price is a positive number
    if (isNaN(unit_price) || parseFloat(unit_price) <= 0) {
      return res.status(400).json({ message: "Unit price must be a positive number" });
    }
    
    const newPrice = await ServicePrice.create(req.body);
    res.status(201).json({
      message: 'Tạo giá dịch vụ thành công',
      data: newPrice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateServicePrice = async (req, res) => {
  try {
    const { unit_price } = req.body;
    
    // Validate unit_price if provided
    if (unit_price !== undefined && (isNaN(unit_price) || parseFloat(unit_price) <= 0)) {
      return res.status(400).json({ message: "Unit price must be a positive number" });
    }
    
    const updatedPrice = await ServicePrice.update(req.params.id, req.body);
    res.json({
      message: 'Cập nhật giá dịch vụ thành công',
      data: updatedPrice
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteServicePrice = async (req, res) => {
  try {
    const success = await ServicePrice.delete(req.params.id);
    if (!success) return res.status(404).json({ message: "Service price not found" });
    res.json({ message: "Xóa giá dịch vụ thành công" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deactivateServicePrice = async (req, res) => {
  try {
    const result = await ServicePrice.deactivate(req.params.id);
    res.json({
      message: 'Vô hiệu hóa giá dịch vụ thành công',
      data: result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
