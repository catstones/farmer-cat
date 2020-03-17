class Board {
  constructor({ title, type, url }) {
    this.title = title
    this.type = type
    this.url = url
  }

  /**
   * Removes resource path or query params and gets a base url.
   * Given string must starts with `http` or `https`.
   * Return has no trailing slash.
   *
   * ## Example
   *
   * ```
   * > const board = Board({ url: 'https://www.catholic.ac.kr/front/boardlist' })
   * > board.baseUrl
   * 'https://www.catholic.ac.kr'
   * ```
   */
  get baseUrl() {
    let startIndex = 0;
    if (this.url.startsWith('https://')) startIndex = 'https://'.length + 1;
    if (this.url.startsWith('http://')) startIndex = 'http://'.length + 1;
    return this.url.slice(0, this.url.indexOf('/', startIndex));
  }
}

module.exports = Board
