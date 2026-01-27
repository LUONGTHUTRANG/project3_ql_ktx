/**
 * Script test chức năng đăng ký phòng và thanh toán
 * Test cases:
 * 1. Đăng ký phòng → Thanh toán thành công → Auto add vào phòng
 * 2. Đăng ký phòng → Quá 24h → Auto reject
 */

const axios = require('axios');
const db = require('./config/db');

const API_BASE = 'http://localhost:5000/api';

// Test data
let token = '';
let studentId = '';
let semesterId = '';
let buildingId = '';
let roomId = '';
let registrationId1 = '';
let registrationId2 = '';
let invoiceId1 = '';

async function login() {
    console.log('\n=== 1. LOGIN ===');
    const response = await axios.post(`${API_BASE}/auth/login`, {
        username: 'student1@student.com',
        password: 'student123'
    });
    token = response.data.token;
    studentId = response.data.user.id;
    console.log('✓ Login thành công - Student ID:', studentId);
    return token;
}

async function getActiveSemester() {
    console.log('\n=== 2. GET ACTIVE SEMESTER ===');
    const response = await axios.get(`${API_BASE}/semesters/active`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    semesterId = response.data.id;
    console.log('✓ Semester ID:', semesterId);
    console.log('  Tên:', response.data.name);
    return semesterId;
}

async function getAvailableRooms() {
    console.log('\n=== 3. GET AVAILABLE ROOMS ===');
    const response = await axios.get(`${API_BASE}/rooms/available`, {
        params: { semester_id: semesterId },
        headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.length === 0) {
        throw new Error('Không có phòng trống!');
    }
    
    const room = response.data[0];
    buildingId = room.building_id;
    roomId = room.id;
    
    console.log('✓ Tìm thấy phòng trống:');
    console.log('  Phòng:', room.room_number);
    console.log('  Tòa:', room.building_name);
    console.log('  Giá:', new Intl.NumberFormat('vi-VN').format(room.price_per_semester), 'VND');
    console.log('  Còn trống:', room.available_slots, 'chỗ');
    
    return roomId;
}

async function createRegistration1() {
    console.log('\n=== 4. TẠO ĐĂNG KÝ #1 (SẼ THANH TOÁN) ===');
    
    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('registration_type', 'NORMAL');
    formData.append('desired_building_id', buildingId);
    formData.append('desired_room_id', roomId);
    formData.append('priority_category', 'NONE');
    
    // Sử dụng fetch thay vì axios cho FormData
    const response = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Tạo đăng ký thất bại');
    }
    
    registrationId1 = data.id;
    invoiceId1 = data.invoice_id;
    
    console.log('✓ Đăng ký thành công:');
    console.log('  Registration ID:', registrationId1);
    console.log('  Invoice ID:', invoiceId1);
    console.log('  Status: PENDING');
    
    return { registrationId: registrationId1, invoiceId: invoiceId1 };
}

async function createRegistration2() {
    console.log('\n=== 5. TẠO ĐĂNG KÝ #2 (SẼ BỊ HỦY DO QUÁ HẠN) ===');
    
    // Get another room
    const response = await axios.get(`${API_BASE}/rooms/available`, {
        params: { semester_id: semesterId },
        headers: { Authorization: `Bearer ${token}` }
    });
    
    const room2 = response.data[1] || response.data[0]; // Lấy phòng khác nếu có
    
    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('registration_type', 'NORMAL');
    formData.append('desired_building_id', room2.building_id);
    formData.append('desired_room_id', room2.id);
    formData.append('priority_category', 'NONE');
    
    const response2 = await fetch(`${API_BASE}/registrations`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    const data = await response2.json();
    registrationId2 = data.id;
    
    console.log('✓ Đăng ký thành công:');
    console.log('  Registration ID:', registrationId2);
    console.log('  Invoice ID:', data.invoice_id);
    
    // Update created_at to 25 hours ago
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await db.query(
        'UPDATE registrations SET created_at = ? WHERE id = ?',
        [twentyFiveHoursAgo, registrationId2]
    );
    
    console.log('✓ Đã fake thời gian tạo đơn về 25 giờ trước');
    console.log('  Created at:', twentyFiveHoursAgo.toISOString());
    
    return registrationId2;
}

async function confirmPayment() {
    console.log('\n=== 6. THANH TOÁN HÓA ĐƠN #1 ===');
    
    // Get invoice details
    const [invoices] = await db.query(
        'SELECT * FROM room_fee_invoices WHERE id = ?',
        [invoiceId1]
    );
    
    if (invoices.length === 0) {
        throw new Error('Invoice không tồn tại!');
    }
    
    const invoice = invoices[0];
    console.log('  Invoice code:', invoice.invoice_code);
    console.log('  Số tiền:', new Intl.NumberFormat('vi-VN').format(invoice.amount), 'VND');
    
    const response = await axios.post(`${API_BASE}/payment/confirm`, {
        invoice_code: invoice.invoice_code,
        amount: invoice.amount,
        payment_method: 'BANK_TRANSFER',
        payment_reference: 'TEST-' + Date.now(),
        payer_name: 'Student Test'
    }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✓ Thanh toán thành công!');
    console.log('  Message:', response.data.message);
    
    // Check stay_records
    const [stays] = await db.query(
        'SELECT * FROM stay_records WHERE student_id = ? AND semester_id = ?',
        [studentId, semesterId]
    );
    
    if (stays.length > 0) {
        console.log('✓ Đã tự động thêm vào phòng:');
        console.log('  Room ID:', stays[0].room_id);
        console.log('  Start date:', stays[0].start_date);
        console.log('  End date:', stays[0].end_date);
    }
    
    // Check registration status
    const [regs] = await db.query(
        'SELECT status FROM registrations WHERE id = ?',
        [registrationId1]
    );
    console.log('  Registration status:', regs[0].status);
}

async function testAutoReject() {
    console.log('\n=== 7. TEST AUTO-REJECT (CRON JOB) ===');
    
    // Import và chạy cron job function
    const { autoRejectExpiredRegistrations } = require('./cronJobs');
    
    console.log('Đang chạy cron job...');
    await autoRejectExpiredRegistrations();
    
    // Check registration #2 status
    const [regs] = await db.query(
        'SELECT status, admin_note FROM registrations WHERE id = ?',
        [registrationId2]
    );
    
    console.log('✓ Kết quả:');
    console.log('  Registration #2 status:', regs[0].status);
    console.log('  Admin note:', regs[0].admin_note);
    
    if (regs[0].status === 'REJECTED') {
        console.log('✓ Đơn đã bị tự động reject do quá 24h!');
    }
}

async function showSummary() {
    console.log('\n\n╔════════════════════════════════════════════════╗');
    console.log('║           KẾT QUẢ TEST                         ║');
    console.log('╚════════════════════════════════════════════════╝');
    
    const [reg1] = await db.query('SELECT * FROM registrations WHERE id = ?', [registrationId1]);
    const [reg2] = await db.query('SELECT * FROM registrations WHERE id = ?', [registrationId2]);
    const [stay] = await db.query('SELECT * FROM stay_records WHERE student_id = ? AND semester_id = ?', [studentId, semesterId]);
    
    console.log('\n📋 ĐĂNG KÝ #1 (Thanh toán thành công):');
    console.log('   ID:', registrationId1);
    console.log('   Status:', reg1[0].status);
    console.log('   Invoice ID:', invoiceId1);
    console.log('   Đã thêm vào phòng:', stay.length > 0 ? '✓ YES' : '✗ NO');
    
    console.log('\n📋 ĐĂNG KÝ #2 (Quá 24h):');
    console.log('   ID:', registrationId2);
    console.log('   Status:', reg2[0].status);
    console.log('   Admin note:', reg2[0].admin_note);
    console.log('   Đã bị reject:', reg2[0].status === 'REJECTED' ? '✓ YES' : '✗ NO');
    
    console.log('\n');
}

async function runTest() {
    try {
        await login();
        await getActiveSemester();
        await getAvailableRooms();
        await createRegistration1();
        await createRegistration2();
        await confirmPayment();
        await testAutoReject();
        await showSummary();
        
        console.log('✅ TEST HOÀN THÀNH!\n');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
        if (error.response?.data) {
            console.error('Chi tiết:', error.response.data);
        }
        process.exit(1);
    }
}

// Run test
console.log('╔════════════════════════════════════════════════╗');
console.log('║   TEST REGISTRATION & PAYMENT FLOW             ║');
console.log('╚════════════════════════════════════════════════╝');

runTest();
