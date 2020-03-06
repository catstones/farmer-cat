const admin = require('firebase-admin')
const serviceAccount = require('../firebase.json')
const boards = require('./boards.json')
const Board = require('./board')

// firebase init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

// firestore init
let db = admin.firestore()

const crawlers = {
  renewal2019: require('./renewal2019'),
}

function now() {
  return new Date(Date.now()).toLocaleString('ko-KR')
}

function log(string) {
  return console.log(`[${now()}] ${string}`)
}

function err(string) {
  return console.error(`[${now()}] ${string}`)
}

async function fetch(boardData) {
  const boards = boardData.map(data => new Board(data))

  boards.forEach(async board => {
    log(`Start crawling ${board.title}.`)
    const batch = db.batch()
    const parser = crawlers[board.type]
    let notices = await parser(board)
    log(`Get ${notices.length} notices from ${board.title}.`)

    notices.forEach(notice => {
      const noticeRef = db.collection('notices').doc(notice.id)
      batch.set(noticeRef, notice.firestoreData)
    })

    batch.commit()
      .then(res => log(`Add into ${board.title} successfully.`))
      .catch(error => err(error))
  })
}

module.exports = {
  fetch,
}
