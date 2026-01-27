const { autoRejectExpiredRegistrations } = require('./cronJobs');

console.log('Đang chạy cron job auto-reject...');

autoRejectExpiredRegistrations()
    .then(() => {
        console.log('✓ Cron job hoàn thành');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    });
