# Test Registration and Payment Flow
# PowerShell script

$API_BASE = "http://localhost:5000/api"
$ErrorActionPreference = "Stop"

Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEST REGISTRATION & PAYMENT FLOW             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# 1. LOGIN
Write-Host "=== 1. LOGIN ===" -ForegroundColor Yellow
$loginResponse = Invoke-RestMethod "$API_BASE/auth/login" -Method POST -Body '{"username":"student1@student.com","password":"student123"}' -ContentType "application/json"
$token = $loginResponse.token
$studentId = $loginResponse.user.id
Write-Host "✓ Login thành công - Student ID: $studentId" -ForegroundColor Green

# 2. GET ACTIVE SEMESTER
Write-Host "`n=== 2. GET ACTIVE SEMESTER ===" -ForegroundColor Yellow
$semester = Invoke-RestMethod "$API_BASE/semesters/active" -Headers @{Authorization="Bearer $token"}
$semesterId = $semester.id
Write-Host "✓ Semester ID: $semesterId" -ForegroundColor Green
Write-Host "  Tên: $($semester.name)" -ForegroundColor Gray

# 3. GET AVAILABLE ROOMS
Write-Host "`n=== 3. GET AVAILABLE ROOMS ===" -ForegroundColor Yellow
$rooms = Invoke-RestMethod "$API_BASE/rooms/available?semester_id=$semesterId" -Headers @{Authorization="Bearer $token"}
if ($rooms.Count -eq 0) {
    Write-Host "❌ Không có phòng trống!" -ForegroundColor Red
    exit 1
}
$room1 = $rooms[0]
$room2 = if ($rooms.Count -gt 1) { $rooms[1] } else { $rooms[0] }

Write-Host "✓ Tìm thấy phòng trống:" -ForegroundColor Green
Write-Host "  Phòng: $($room1.room_number)" -ForegroundColor Gray
Write-Host "  Tòa: $($room1.building_name)" -ForegroundColor Gray
Write-Host "  Còn trống: $($room1.available_slots) chỗ" -ForegroundColor Gray

# 4. CREATE REGISTRATION #1 (Will pay)
Write-Host "`n=== 4. TẠO ĐĂNG KÝ #1 (SẼ THANH TOÁN) ===" -ForegroundColor Yellow

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"student_id`"$LF",
    $studentId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"registration_type`"$LF",
    "NORMAL",
    "--$boundary",
    "Content-Disposition: form-data; name=`"desired_building_id`"$LF",
    $room1.building_id,
    "--$boundary",
    "Content-Disposition: form-data; name=`"desired_room_id`"$LF",
    $room1.id,
    "--$boundary",
    "Content-Disposition: form-data; name=`"priority_category`"$LF",
    "NONE",
    "--$boundary--$LF"
)
$body = $bodyLines -join $LF

$reg1Response = Invoke-RestMethod "$API_BASE/registrations" -Method POST -Headers @{
    Authorization="Bearer $token"
    "Content-Type"="multipart/form-data; boundary=$boundary"
} -Body $body

$registrationId1 = $reg1Response.id
$invoiceId1 = $reg1Response.invoice_id

Write-Host "✓ Đăng ký thành công:" -ForegroundColor Green
Write-Host "  Registration ID: $registrationId1" -ForegroundColor Gray
Write-Host "  Invoice ID: $invoiceId1" -ForegroundColor Gray

# 5. CREATE REGISTRATION #2 (Will expire)
Write-Host "`n=== 5. TẠO ĐĂNG KÝ #2 (SẼ BỊ HỦY DO QUÁ HẠN) ===" -ForegroundColor Yellow

$bodyLines2 = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"student_id`"$LF",
    $studentId,
    "--$boundary",
    "Content-Disposition: form-data; name=`"registration_type`"$LF",
    "NORMAL",
    "--$boundary",
    "Content-Disposition: form-data; name=`"desired_building_id`"$LF",
    $room2.building_id,
    "--$boundary",
    "Content-Disposition: form-data; name=`"desired_room_id`"$LF",
    $room2.id,
    "--$boundary",
    "Content-Disposition: form-data; name=`"priority_category`"$LF",
    "NONE",
    "--$boundary--$LF"
)
$body2 = $bodyLines2 -join $LF

$reg2Response = Invoke-RestMethod "$API_BASE/registrations" -Method POST -Headers @{
    Authorization="Bearer $token"
    "Content-Type"="multipart/form-data; boundary=$boundary"
} -Body $body2

$registrationId2 = $reg2Response.id
Write-Host "✓ Đăng ký thành công:" -ForegroundColor Green
Write-Host "  Registration ID: $registrationId2" -ForegroundColor Gray
Write-Host "  Invoice ID: $($reg2Response.invoice_id)" -ForegroundColor Gray

# Update created_at to 25 hours ago (via MySQL command)
Write-Host "⏰ Đang fake thời gian tạo đơn về 25 giờ trước..." -ForegroundColor Yellow
$mysqlCommand = "mysql -h localhost -u root -p123456 -D ktx_db -e `"UPDATE registrations SET created_at = DATE_SUB(NOW(), INTERVAL 25 HOUR) WHERE id = $registrationId2;`""
Invoke-Expression $mysqlCommand 2>$null
Write-Host "✓ Đã fake thời gian thành công" -ForegroundColor Green

# 6. GET INVOICE DETAILS
Write-Host "`n=== 6. LẤY THÔNG TIN HÓA ĐƠN ===" -ForegroundColor Yellow
$invoiceQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT invoice_code, amount FROM room_fee_invoices WHERE id = $invoiceId1;`""
$invoiceInfo = Invoke-Expression $invoiceQuery 2>$null
$invoiceData = $invoiceInfo -split "`t"
$invoiceCode = $invoiceData[0]
$invoiceAmount = [int]$invoiceData[1]

Write-Host "✓ Invoice Code: $invoiceCode" -ForegroundColor Green
Write-Host "  Số tiền: $($invoiceAmount.ToString('N0')) VND" -ForegroundColor Gray

# 7. CONFIRM PAYMENT
Write-Host "`n=== 7. THANH TOÁN HÓA ĐƠN #1 ===" -ForegroundColor Yellow
$paymentBody = @{
    invoice_code = $invoiceCode
    amount = $invoiceAmount
    payment_method = "BANK_TRANSFER"
    payment_reference = "TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
    payer_name = "Student Test"
} | ConvertTo-Json

$paymentResponse = Invoke-RestMethod "$API_BASE/payment/confirm" -Method POST -Body $paymentBody -ContentType "application/json" -Headers @{Authorization="Bearer $token"}
Write-Host "✓ Thanh toán thành công!" -ForegroundColor Green
Write-Host "  Message: $($paymentResponse.message)" -ForegroundColor Gray

# Check stay_records
Start-Sleep -Seconds 1
$stayQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT room_id, start_date, end_date FROM stay_records WHERE student_id = $studentId AND semester_id = $semesterId;`""
$stayInfo = Invoke-Expression $stayQuery 2>$null
if ($stayInfo) {
    $stayData = $stayInfo -split "`t"
    Write-Host "✓ Đã tự động thêm vào phòng:" -ForegroundColor Green
    Write-Host "  Room ID: $($stayData[0])" -ForegroundColor Gray
    Write-Host "  Start date: $($stayData[1])" -ForegroundColor Gray
    Write-Host "  End date: $($stayData[2])" -ForegroundColor Gray
}

# Check registration status
$regStatusQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT status FROM registrations WHERE id = $registrationId1;`""
$regStatus = Invoke-Expression $regStatusQuery 2>$null
Write-Host "  Registration status: $regStatus" -ForegroundColor Gray

# 8. TEST AUTO-REJECT (Run cron job manually)
Write-Host "`n=== 8. TEST AUTO-REJECT (CHẠY CRON JOB) ===" -ForegroundColor Yellow
Write-Host "Đang chạy cron job..." -ForegroundColor Yellow

# Run cron via node
$cronScript = @"
const { autoRejectExpiredRegistrations } = require('./cronJobs');
autoRejectExpiredRegistrations().then(() => {
    console.log('Cron job completed');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
"@

$cronScript | Out-File -FilePath "backend/test-cron.js" -Encoding utf8
Push-Location backend
node test-cron.js
Pop-Location
Remove-Item "backend/test-cron.js" -ErrorAction SilentlyContinue

# Check registration #2 status
$reg2StatusQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT status, admin_note FROM registrations WHERE id = $registrationId2;`""
$reg2StatusInfo = Invoke-Expression $reg2StatusQuery 2>$null
$reg2Data = $reg2StatusInfo -split "`t"
Write-Host "✓ Kết quả:" -ForegroundColor Green
Write-Host "  Registration #2 status: $($reg2Data[0])" -ForegroundColor Gray
Write-Host "  Admin note: $($reg2Data[1])" -ForegroundColor Gray

if ($reg2Data[0] -eq "REJECTED") {
    Write-Host "✓ Đơn đã bị tự động reject do quá 24h!" -ForegroundColor Green
}

# 9. SUMMARY
Write-Host "`n`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           KẾT QUẢ TEST                         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$reg1FinalQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT status FROM registrations WHERE id = $registrationId1;`""
$reg1Final = Invoke-Expression $reg1FinalQuery 2>$null

$reg2FinalQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT status, admin_note FROM registrations WHERE id = $registrationId2;`""
$reg2FinalInfo = Invoke-Expression $reg2FinalQuery 2>$null
$reg2Final = $reg2FinalInfo -split "`t"

$stayCheckQuery = "mysql -h localhost -u root -p123456 -D ktx_db -N -e `"SELECT COUNT(*) FROM stay_records WHERE student_id = $studentId AND semester_id = $semesterId;`""
$stayCount = [int](Invoke-Expression $stayCheckQuery 2>$null)

Write-Host "📋 ĐĂNG KÝ #1 (Thanh toán thành công):" -ForegroundColor White
Write-Host "   ID: $registrationId1" -ForegroundColor Gray
Write-Host "   Status: $reg1Final" -ForegroundColor Gray
Write-Host "   Invoice ID: $invoiceId1" -ForegroundColor Gray
Write-Host "   Đã thêm vào phòng: $(if ($stayCount -gt 0) { '✓ YES' } else { '✗ NO' })" -ForegroundColor $(if ($stayCount -gt 0) { 'Green' } else { 'Red' })

Write-Host "`n📋 ĐĂNG KÝ #2 (Quá 24h):" -ForegroundColor White
Write-Host "   ID: $registrationId2" -ForegroundColor Gray
Write-Host "   Status: $($reg2Final[0])" -ForegroundColor Gray
Write-Host "   Admin note: $($reg2Final[1])" -ForegroundColor Gray
Write-Host "   Đã bị reject: $(if ($reg2Final[0] -eq 'REJECTED') { '✓ YES' } else { '✗ NO' })" -ForegroundColor $(if ($reg2Final[0] -eq 'REJECTED') { 'Green' } else { 'Red' })

Write-Host "`n✅ TEST HOÀN THÀNH!`n" -ForegroundColor Green
