const cron = require('node-cron')
const axios = require('axios')
const cheerio = require('cheerio')
const firebase = require('firebase-admin')
const serviceAccount = require('../config/firebaseAccountKey.json');

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: "https://cukcat-aacfa.firebaseio.com"
})

const db = firebase.firestore();
const noticeRef = db.collection('Notice');
const logRef = db.collection('NoticeLog')
const boardRef = db.collection('NoticeBoard')

function getBaseURL(URL) {
  let startIndex = 0;
  if (URL.startsWith("https://")) startIndex = "https://".length + 1;
  if (URL.startsWith("http://")) startIndex = "http://".length + 1;
  return URL.slice(0, URL.indexOf("/", startIndex));
};

async function crawl_notices_2019(URL) {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data, {
        normalizeWhitespace: true
    })
    const notices = [];

    const anchorElements = $(".rbbs_list_normal_sec > ul > li > a");
    anchorElements.each(function(i, elem) {
        if ($(this).find(".title_line > .flag.top").text() === "공지 아이콘")
            return;
        const notice = {
            URL: null,
            title: '',
            id: null,
            writtenAt: "",
        };
        const infoLineFirstChild = $(this).find('.info_line').children().first();
        notice.URL = getBaseURL(URL) + $(this).attr("href");
        notice.title = $(this).find(".title_line > .title > .text").text().trim();
        notice.id = parseInt(infoLineFirstChild.text().substring(5));
        notice.writtenAt = infoLineFirstChild.next().next().text().match(/[0-9\.]+/)[0]

        if (notice.title.endsWith("새글")) {
            notice.title = notice.title.split("\n")[0];
        }

        if (notice.writtenAt.length !== 10) {
            throw Error(
                `ERR: writtenAt is parsed wrong way.
                [${notice.id}] ${notice.title}`
            )
        }

        notices.push(notice);
    })

    return notices.sort((a, b) => a.id - b.id);
}

// Get all board list and crawl notices.
// Returns result
async function updateAllNotices() {
    const snapshot = await boardRef.get();
    const resultLog = {};

    snapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        const board = doc.data();
        const lastId = board.lastCrawledId || 0;
        const notices = (await crawl_notices_2019(board.URL)).filter(notice => notice.id > lastId);

        notices.forEach(notice => noticeRef.add({
            ...notice,
            board: board.name,
            writtenAt: firebase.firestore.Timestamp.fromDate(new Date(notice.writtenAt))
        }));

        const updateLog = {
            lastCrawledId: notices.length === 0 ? lastId : notices[notices.length - 1].id,
            lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdateCount: notices.length
        };

        await docRef.update(updateLog);
        resultLog[board.name] = {
            ...updateLog,
            lastUpdatedAt: Date.now().toLocaleString()
        };
    })

    return resultLog;
}

updateAllNotices();

function start() {

    cron.schedule('* */10 * * * *', () => {
        updateAllNotices
    });

    cron.schedule('* * * * * *', () => {

    });
}


module.exports = start