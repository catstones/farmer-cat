const admin = require('firebase-admin')

class Notice {
  constructor({url, title, writtenAt, writtenBy, board}) {
    this.title = title
    this.writtenAt = writtenAt
    this.writtenBy = writtenBy
    this.board = board
    this.url = url

    if (!this.url.startsWith('http'))
      throw new Error('Url does not starts with http[s] protocol')
  }

  get id() {
    let startIndex = this.url.startsWith('https://')
      ? 'https://'.length
      : 'http://'.length
    return this.url.slice(startIndex).replace(/\//g, "_")
  }

  get firestoreData() {
    return {
      title: this.title,
      writtenBy: this.writtenBy,
      writtenAt: admin.firestore.Timestamp.fromDate(this.writtenAt),
      boardTitle: this.board.title,
      url: this.url,
    }
  }
}

module.exports = Notice;
