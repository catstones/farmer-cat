const cron = require('node-cron');
const { fetchAllNotices } = require('./src/update_notices');

process.setMaxListeners(0);
console.log('updateAllNotice scheduled.');

cron.schedule('* */10 * * * *', () => {
    console.log('Update!', Date.now().toLocaleString());
    fetchAllNotices({ update: true });
});
