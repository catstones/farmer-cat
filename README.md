# Farmer Cat

가톨릭대학교 공지사항 크롤링 서비스입니다.

*CUKCAT* firebase에서 공지사항 게시판 목록을 받아와 크롤링합니다.

## 설치

Node가 깔린 서버에 설치합니다.

```
$ git clone https://github.com/catstones/farmer_cat
$ npm install --production
```

`config` 디렉토리에 firebase 인증 파일을 넣고 패스에 등록합니다.

```
export GOOGLE_APPLICATION_CREDENTIALS="config/firebaseAccountKey.json"
```

pm2를 이용하여 실행합니다.

```
$ pm2 start index.js --name farmer_cat
```

## 그 외

- [wiki](https://github.com/catstones/farmer_cat/wiki)
- 이슈 참고
