FROM node:latest
MAINTAINER linmadan <772181827@qq.com>
COPY ./package.json /home/test-pomelo-portal/
WORKDIR /home/test-pomelo-portal
RUN ["npm","config","set","registry","http://registry.npm.taobao.org"]
RUN ["npm","install","--save","co@4.6.0"]
RUN ["npm","install","--save","kafka-node@1.5.0"]
RUN ["npm","install","--save","pomelo@2.2.5"]
RUN ["npm","install","--save","underscore@1.8.3"]
RUN ["npm","install","--save","gridvo-microprogram-connector@0.0.1"]
RUN ["npm","install","pomelo@2.2.5","-g"]
COPY ./lib lib
VOLUME ["/home/test-pomelo-portal"]
VOLUME ["/home/keys"]
ENTRYPOINT ["pomelo"]
CMD ["start","-e","production","-d","./lib/pomelo"]