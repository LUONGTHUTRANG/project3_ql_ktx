import QRCode from 'qrcode';
import Invoice from "../models/invoiceModel.js";
import RoomFeeInvoice from "../models/roomFeeInvoiceModel.js";
import OtherInvoice from "../models/otherInvoiceModel.js";
import crypto from 'crypto';
import db from "../config/db.js";

// Store QR codes in memory (in production, use database)
const qrCodeStore = new Map();

export const generateQRCodeForAll = async (req, res) => {
  try {
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    // Get all unpaid room fee invoices for this student
    const roomFeeInvoices = await RoomFeeInvoice.getByStudentId(studentId);
    
    // Filter unpaid invoices
    const unpaidRoomFeeInvoices = roomFeeInvoices.filter(inv => 
      inv.status === 'PUBLISHED' || inv.status === 'OVERDUE'
    );

    // Get all unpaid other invoices for this student
    const otherInvoices = await OtherInvoice.getByStudentId(studentId);
    
    // Filter unpaid invoices
    const unpaidOtherInvoices = otherInvoices.filter(inv => 
      inv.status === 'PUBLISHED' || inv.status === 'OVERDUE'
    );

    // Get unpaid other invoices for the room the student is currently staying in
    const [roomOtherInvoices] = await db.query(
      `SELECT DISTINCT oi.id, oi.invoice_id, i.invoice_code, i.total_amount, i.status
       FROM other_invoices oi
       JOIN invoices i ON oi.invoice_id = i.id
       JOIN rooms r ON oi.target_room_id = r.id
       JOIN stay_records sr ON sr.room_id = r.id
       WHERE sr.student_id = ? AND (i.status = 'PUBLISHED' OR i.status = 'OVERDUE')`,
      [studentId]
    );

    // Combine and deduplicate other invoices (by invoice_id to avoid duplicates)
    const combinedOtherInvoices = [
      ...unpaidOtherInvoices.map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        total_amount: inv.total_amount,
        status: inv.status
      })),
      ...(roomOtherInvoices || []).map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        total_amount: inv.total_amount,
        status: inv.status
      }))
    ];

    // Remove duplicate invoices by invoice_id
    const uniqueOtherInvoices = Array.from(
      new Map(combinedOtherInvoices.map(inv => [inv.invoice_id, inv])).values()
    );

    // Get utility invoices for this student (from their current room)
    const [studentRooms] = await db.query(
      `SELECT DISTINCT ui.id, ui.invoice_id, i.invoice_code, i.total_amount, i.status
       FROM utility_invoices ui
       JOIN invoices i ON ui.invoice_id = i.id
       JOIN rooms r ON ui.room_id = r.id
       JOIN stay_records sr ON sr.room_id = r.id
       WHERE sr.student_id = ? AND (i.status = 'PUBLISHED' OR i.status = 'OVERDUE')`,
      [studentId]
    );
    
    const unpaidUtilityInvoices = studentRooms || [];

    // Combine all unpaid invoices
    const allUnpaidInvoices = [
      ...unpaidRoomFeeInvoices.map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        total_amount: inv.price_per_semester, // room fee uses price_per_semester
        status: inv.status,
        category: 'ROOM_FEE'
      })),
      ...uniqueOtherInvoices.map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        total_amount: inv.total_amount,
        status: inv.status,
        category: 'OTHER'
      })),
      ...unpaidUtilityInvoices.map(inv => ({
        invoice_id: inv.invoice_id,
        invoice_code: inv.invoice_code,
        total_amount: inv.total_amount,
        status: inv.status,
        category: 'UTILITY'
      }))
    ];

    if (allUnpaidInvoices.length === 0) {
      return res.status(404).json({ message: "No unpaid invoices found" });
    }

    // Calculate total amount from all unpaid invoices
    const totalAmount = allUnpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

    // Generate unique payment reference
    const paymentRef = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Create QR data structure for multiple invoices
    const qrData = {
      type: 'all',
      invoiceIds: allUnpaidInvoices.map(inv => inv.invoice_id),
      invoiceCodes: allUnpaidInvoices.map(inv => inv.invoice_code),
      totalAmount: totalAmount,
      studentId: studentId,
      paymentRef: paymentRef,
      expiresAt: expiresAt.toISOString(),
      invoiceCount: allUnpaidInvoices.length,
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

    // Generate QR code string
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
        invoiceCount: allUnpaidInvoices.length,
        totalAmount: totalAmount,
        invoiceCodes: allUnpaidInvoices.map(inv => inv.invoice_code),
      },
    });
  } catch (err) {
    console.error('Error generating QR code for all invoices:', err);
    res.status(500).json({ error: err.message });
  }
};

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

    const now = new Date();

    // Handle "pay all" invoices
    if (qrData.type === 'all' || invoiceId === 'all') {
      // Verify student matches
      if (qrData.studentId !== studentId) {
        return res.status(400).json({ message: "Payment data mismatch" });
      }

      let paidInvoices = [];

      // Update all invoices in the QR data
      for (const invId of qrData.invoiceIds) {
        const invoice = await Invoice.getById(invId);
        if (invoice) {
          const [result] = await db.query(
            `UPDATE invoices 
             SET status = 'PAID', paid_at = ?, paid_by_student_id = ? 
             WHERE id = ?`,
            [now, studentId, invId]
          );

          if (result.affectedRows > 0) {
            paidInvoices.push({
              id: invoice.id,
              invoice_code: invoice.invoice_code,
              total_amount: invoice.total_amount,
            });

            // Check if this is a room fee invoice from registration and auto-assign room
            const [roomFeeData] = await db.query(
              `SELECT rfi.*, r.student_id, r.desired_room_id, r.semester_id
               FROM room_fee_invoices rfi
               JOIN registrations r ON r.invoice_id = rfi.invoice_id
               WHERE rfi.invoice_id = ?`,
              [invId]
            );

            if (roomFeeData && roomFeeData.length > 0) {
              const regInfo = roomFeeData[0];
              
              // Get semester dates
              const [semester] = await db.query(
                'SELECT start_date, end_date FROM semesters WHERE id = ?',
                [regInfo.semester_id]
              );

              if (semester && semester.length > 0) {
                // Create stay record
                await db.query(
                  `INSERT INTO stay_records 
                   (student_id, room_id, semester_id, start_date, end_date, status) 
                   VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
                  [
                    regInfo.student_id,
                    regInfo.desired_room_id,
                    regInfo.semester_id,
                    semester[0].start_date,
                    semester[0].end_date
                  ]
                );

                // Update registration status to COMPLETED
                await db.query(
                  `UPDATE registrations 
                   SET status = 'COMPLETED' 
                   WHERE invoice_id = ?`,
                  [invId]
                );

                console.log(`[PAYMENT] Auto-assigned student ${regInfo.student_id} to room ${regInfo.desired_room_id}`);
              }
            }
          }
        }
      }

      // Remove QR code from store
      qrCodeStore.delete(paymentRef);

      res.json({
        success: true,
        message: "All payments confirmed successfully",
        invoices: paidInvoices,
        totalPaid: paidInvoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        paid_at: now.toISOString(),
      });
    } else {
      // Handle single invoice payment
      if (qrData.invoiceId !== parseInt(invoiceId) || qrData.studentId !== studentId) {
        return res.status(400).json({ message: "Payment data mismatch" });
      }

      // Get invoice details
      const invoice = await Invoice.getById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Update invoice status to PAID
      const [result] = await db.query(
        `UPDATE invoices 
         SET status = 'PAID', paid_at = ?, paid_by_student_id = ? 
         WHERE id = ?`,
        [now, studentId, invoiceId]
      );

      if (result.affectedRows === 0) {
        return res.status(400).json({ message: "Failed to update invoice status" });
      }

      // Check if this is a room fee invoice from registration
      const [roomFeeInvoice] = await db.query(
        `SELECT rfi.*, r.student_id, r.desired_room_id, r.semester_id, r.registration_type
         FROM room_fee_invoices rfi
         JOIN registrations r ON r.invoice_id = rfi.invoice_id
         WHERE rfi.invoice_id = ?`,
        [invoiceId]
      );

      // Auto-add student to room if this is a registration payment
      if (roomFeeInvoice && roomFeeInvoice.length > 0) {
        const regInfo = roomFeeInvoice[0];
        
        // Get semester dates
        const [semester] = await db.query(
          'SELECT start_date, end_date FROM semesters WHERE id = ?',
          [regInfo.semester_id]
        );

        if (semester && semester.length > 0) {
          // Create stay record
          await db.query(
            `INSERT INTO stay_records 
             (student_id, room_id, semester_id, start_date, end_date, status) 
             VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
            [
              regInfo.student_id,
              regInfo.desired_room_id,
              regInfo.semester_id,
              semester[0].start_date,
              semester[0].end_date
            ]
          );

          // Update registration status to COMPLETED
          await db.query(
            `UPDATE registrations 
             SET status = 'COMPLETED' 
             WHERE invoice_id = ?`,
            [invoiceId]
          );

          // Create notification
          await db.query(
            `INSERT INTO notifications 
             (target_type, target_user_id, title, content, is_read) 
             VALUES ('STUDENT', ?, ?, ?, 0)`,
            [
              regInfo.student_id,
              'Thanh toán thành công',
              'Bạn đã thanh toán thành công và được phân phòng. Vui lòng kiểm tra thông tin phòng ở của bạn.'
            ]
          );

          console.log(`[PAYMENT] Auto-assigned student ${regInfo.student_id} to room ${regInfo.desired_room_id}`);
        }
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
    }
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
