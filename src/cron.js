const cron = require('node-cron');
const axios = require('axios');
const cheerio = require('cheerio');
const firebase = require('firebase-admin');
const serviceAccount = require('../config/firebaseAccountKey.json');

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: 'https://cukcat-aacfa.firebaseio.com',
});

const db = firebase.firestore();
const noticeRef = db.collection('Notice');
const boardRef = db.collection('NoticeBoard');

function getBaseURL(URL) {
    let startIndex = 0;
    if (URL.startsWith('https://')) startIndex = 'https://'.length + 1;
    if (URL.startsWith('http://')) startIndex = 'http://'.length + 1;
    return URL.slice(0, URL.indexOf('/', startIndex));
}

async function crawl_notices_2019(board) {
    const URL = board.URL;
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data, {
        normalizeWhitespace: true,
    });
    const notices = [];

    const anchorElements = $('.rbbs_list_normal_sec > ul > li > a');
    anchorElements.each(function(i, elem) {
        if (
            $(this)
                .find('.title_line > .flag.top')
                .text() === '공지 아이콘'
        )
            return;

        const notice = {
            URL: null,
            title: '',
            id: null,
            writtenAt: '',
        };

        let info = $(this)
            .find('.info_line')
            .children()
            .first();

        notice.URL = getBaseURL(URL) + $(this).attr('href');
        if (notice.URL == board.latestCrawledURL) {
            // return false를 하면 `each` 콜백을 break 할 수 있어요
            return false;
        }

        notice.board = board.name;

        notice.title = $(this)
            .find('.title_line > .title > .text')
            .text()
            .trim();
        notice.id = parseInt(info.text().substring(5));
        info = info.next();

        notice.writtenBy = info.text().substring(6);
        info = info.next();

        notice.writtenAt = info.text().match(/[0-9.]+/)[0];

        if (notice.title.endsWith('새글')) {
            notice.title = notice.title.split('\n')[0];
        }

        if (notice.writtenAt.length !== 10) {
            throw Error(
                `ERR: writtenAt is parsed wrong way.
                                [${notice.id}] ${notice.title}`
            );
        }

        notices.push(notice);
    });

    return notices;
}

// Firebase에서 NoticeBoard 목록을 가져와
// 이를 기반으로 업데이트 합니다.
async function updateAllNotices() {
    const snapshot = await boardRef.get();

    snapshot.forEach(async doc => {
        const docRef = doc.ref;
        const board = doc.data();
        console.log(board.name, board.latestCrawledURL);
        const notices = await crawl_notices_2019(board);

        notices.forEach(notice =>
            noticeRef.add({
                ...notice,
                writtenAt: firebase.firestore.Timestamp.fromDate(
                    new Date(notice.writtenAt)
                ),
                crawledAt: firebase.firestore.FieldValue.serverTimestamp(),
            })
        );

        const updateLog = {
            lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdateCount: notices.length,
            latestCrawledURL:
                notices.length > 0
                    ? notices[notices.length - 1].URL
                    : board.latestCrawledURL,
        };

        docRef.update(updateLog);
    });
}

function start() {
    process.setMaxListeners(0);
    console.log('updateAllNotice scheduled.');

    cron.schedule('* */10 * * * *', () => {
        console.log('Update!', Date.now().toLocaleString());
        updateAllNotices();
    });
}

module.exports = start;
