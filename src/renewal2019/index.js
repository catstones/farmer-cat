const cheerio = require('cheerio')
const fetch = require('node-fetch')
const Notice = require('../notice')
const Board = require('../board')

/**
 * 정규화된 공지 url을 반환합니다.
 *
 * 정규화된 url은 아래와 같은 꼴입니다:
 *
 * https://www.catholic.ac.kr/front/boardview.do?cmsDirPkid=2053&cmsLocalPkid=1&bbsConfigFK=19&pkid=105008
 */
function regularizeNoticeUrl(noticeUrl, board) {
  const params = new URL(board.baseUrl + noticeUrl).searchParams;

  return `${board.baseUrl}/front/boardview.do?`
    + `cmsDirPkid=${params.get("cmsDirPkid")}`
    + `&cmsLocalPkid=${params.get("cmsLocalPkid")}`
    + `&bbsConfigFK=${params.get("bbsConfigFK")}`
    + `&pkid=${params.get("pkid")}`
}

/**
 * 2019년에 리뉴얼 된 가톨릭대학교 게시판 페이지를 파싱합니다.
 */
module.exports = async function(board) {
  const fetchResponse = await fetch(board.url)
  const fetchText = await fetchResponse.text();
  const notices = [];
  const $ = cheerio.load(fetchText, { normalizeWhitespace: true });

  // 공지사항 링크 태그를 모조리 가져온다
  const anchorElements = $('.rbbs_list_normal_sec > ul > li > a');
  anchorElements.each(function(i, elem) {
    if (
      $(this)
        .find('.title_line > .flag.top')
        .text() === '공지 아이콘'
    )
      return;

    const url = $(this).attr('href');
    // url이 javascript일 경우 비공개 글이더라구
    if (url.startsWith("javascript"))
      return;

    // .info_line 안에 글번호, 작성자, 작성일, 조회수가 순서대로 담겨 있다
    let info = $(this)
      .find('.info_line')
      .children()
      .first();
    // 글번호는 쓸모가 없으므로 건너뛴다
    info = info.next();

    // 공지사항 제목
    let title = $(this)
      .find('.title_line > .title > .text')
      .text()
      .trim();

    // 작성자 정보
    const writtenBy = info.text().substring(6);
    info = info.next();

    // 작성일 정보
    const writtenAt = info.text().match(/[0-9.]+/)[0];

    // "새글" 글자 때내기
    if (title.endsWith('새글')) {
      title = title.split('\n')[0];
    }

    if (writtenAt.length !== 10) {
      throw Error(
        `ERR: writtenAt is parsed wrong way. ${title}`
      );
    }

    const notice = new Notice({
      title,
      board,
      url: regularizeNoticeUrl(url, board),
      writtenBy,
      writtenAt: new Date(writtenAt),
    });

    notices.push(notice);
  });

  return notices;
}
