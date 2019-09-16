FROM ubuntu:16.04
RUN apt-get -y update

RUN apt-get -y install nodejs

COPY . /usr/src/app

WORKDIR /usr/src/app
RUN npm run start
