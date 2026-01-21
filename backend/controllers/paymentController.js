import QRCode from 'qrcode';
import Invoice from "../models/invoiceModel.js";
import crypto from 'crypto';
import db from "../config/db.js";

// Store QR codes in memory (in production, use database)
const qrCodeStore = new Map();

export const generateQRCode = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { studentId } = req.body;

    // Get invoice details
    const invoice = await Invoice.getById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Generate unique payment reference
    const paymentRef = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create QR data structure
    const qrData = {
      invoiceId: invoice.id,
      invoiceCode: invoice.invoice_code,
      amount: invoice.total_amount,
      studentId: studentId,
      paymentRef: paymentRef,
      expiresAt: expiresAt.toISOString(),
      category: invoice.invoice_category,
    };

    // Store QR data
    qrCodeStore.set(paymentRef, {
      ...qrData,
      createdAt: new Date(),
    });

    // Clean up expired QR codes every 10 minutes
    if (Math.random() < 0.1) {
      const now = Date.now();
      for (const [key, value] of qrCodeStore.entries()) {
        if (new Date(value.expiresAt) < now) {
          qrCodeStore.delete(key);
        }
      }
    }

    // Generate QR code string (in real scenario, would be a payment URL)
    const qrString = JSON.stringify(qrData);

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    res.json({
      success: true,
      paymentRef,
      qrCode: qrCodeImage,
      expiresAt: expiresAt.toISOString(),
      invoiceData: {
        invoiceCode: invoice.invoice_code,
        amount: invoice.total_amount,
        category: invoice.invoice_category,
      },
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    res.status(500).json({ error: err.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentRef, invoiceId, studentId } = req.body;

    // Validate payment reference
    const qrData = qrCodeStore.get(paymentRef);
    if (!qrData) {
      return res.status(400).json({ message: "Invalid or expired payment reference" });
    }

    // Check if QR code has expired
    if (new Date(qrData.expiresAt) < new Date()) {
      qrCodeStore.delete(paymentRef);
      return res.status(400).json({ message: "Payment reference has expired" });
    }

    // Verify payment data matches
    if (qrData.invoiceId !== parseInt(invoiceId) || qrData.studentId !== studentId) {
      return res.status(400).json({ message: "Payment data mismatch" });
    }

    // Get invoice details
    const invoice = await Invoice.getById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Update invoice status to PAID
    const now = new Date();
    const [result] = await db.query(
      `UPDATE invoices 
       SET status = 'PAID', paid_at = ?, paid_by_student_id = ? 
       WHERE id = ?`,
      [now, studentId, invoiceId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "Failed to update invoice status" });
    }

    // Remove QR code from store
    qrCodeStore.delete(paymentRef);

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      invoice: {
        id: invoice.id,
        invoice_code: invoice.invoice_code,
        total_amount: invoice.total_amount,
        status: 'PAID',
        paid_at: now.toISOString(),
      },
    });
  } catch (err) {
    console.error('Error confirming payment:', err);
    res.status(500).json({ error: err.message });
  }
};

export const verifyPaymentRef = async (req, res) => {
  try {
    const { paymentRef } = req.params;

    const qrData = qrCodeStore.get(paymentRef);
    if (!qrData) {
      return res.status(404).json({ message: "Invalid or expired payment reference" });
    }

    // Check if expired
    if (new Date(qrData.expiresAt) < new Date()) {
      qrCodeStore.delete(paymentRef);
      return res.status(400).json({ message: "Payment reference has expired" });
    }

    res.json({
      valid: true,
      expiresAt: qrData.expiresAt,
      invoiceCode: qrData.invoiceCode,
      amount: qrData.amount,
    });
  } catch (err) {
    console.error('Error verifying payment ref:', err);
    res.status(500).json({ error: err.message });
  }
};
