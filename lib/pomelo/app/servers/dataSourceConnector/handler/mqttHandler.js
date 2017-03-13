'use strict';
const co = require('co');
const kafka = require('kafka-node');
const _ = require('underscore');

let Handler = function (app) {
    this._app = app;
};

Handler.prototype.publish = function (msg, session, next) {
    let {topic, payload} = msg;

    function receiveOriginalData() {
        let originalData = {};
        originalData.s = topic;
        let {v, t} = JSON.parse(payload);
        originalData.v = v;
        originalData.t = t;
        let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
        let client = new kafka.Client(
            `${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`,
            "test-client");
        let producer = new kafka.Producer(client);
        producer.on('ready', function () {
            producer.send([{
                topic: "data-arrive",
                messages: [JSON.stringify(originalData)]
            }], (err) => {
                if (err) {
                    next(err);
                }
                next(null, {
                    errcode: 0,
                    errmsg: "ok"
                });
            });
        });
    }

    if (!session || !session.uid) {
        console.log("invalid data source");
        next(null, {
            errcode: 400,
            errmsg: "fail"
        });
    } else {
        receiveOriginalData();
    }
};

Handler.prototype.subscribe = function (msg, session, next) {
    let granted = [msg.subscriptions[0].qos];
    let topic = msg.subscriptions[0].topic;
    if (!topic || topic.length == 0) {
        console.log("invalid topic");
        next(null, []);
        return;
    }
    let self = this;

    function binDataSourceID(dataSourceID) {
        return new Promise((resolve, reject) => {
            session.bind(dataSourceID, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function* dataSourceLink() {
        yield binDataSourceID("NWHSDZ-YL");
        session.on('closed', onSessionClosed.bind(null, self._app));
        return {
            errcode: 0,
            errmsg: "ok"
        };
    };

    if (!session || !session.uid) {
        co(dataSourceLink).then((res) => {
            if (res.errcode == 0) {
                console.info(`data source: NWHSDZ-YL link success`);
                let channel = self._app.get('channelService').getChannel("NWHSDZ-YL", true);
                if (!channel) {
                    next(null, []);
                    return;
                }
                channel.add(session.uid, self._app.getServerId());
                console.info(`data source: NWHSDZ-YL sub topic success`);
                let message = {
                    cmd: 'publish',
                    retain: false,
                    qos: 0,
                    dup: false,
                    length: 53,
                    topic: 'NWHSDZ-YL',
                    payload: '{"v":1026.9208104834725,"t":1489372508490}',
                    __route__: 'dataSourceConnector.mqttHandler.publish'
                };
                channel.pushMessage(message);
                next(null, granted);
            } else {
                self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                });
                next(null, []);
            }
        }).catch(err => {
            console.error(err.stack);
            next(err);
        });
    } else {
        let channel = self._app.get('channelService').getChannel("NWHSDZ-YL", true);
        if (!channel) {
            next(null, []);
            return;
        }
        channel.add(session.uid, self._app.getServerId());
        console.info(`data source: NWHSDZ-YL sub topic success`);
        let message = {
            cmd: 'publish',
            retain: false,
            qos: 0,
            dup: false,
            length: 53,
            topic: 'NWHSDZ-YL',
            payload: '{"v":1026.9208104834725,"t":1489372508490}',
            __route__: 'dataSourceConnector.mqttHandler.publish'
        };
        channel.pushMessage(message);
        next(null, granted);
    }
};

let onSessionClosed = function (app, session) {
    if (!session || !session.uid) {
        console.log(`invalid data source link closed`);
        return;
    }
    let channel = app.get('channelService').getChannel("NWHSDZ-YL", true);
    channel.leave(session.uid, app.getServerId());
    console.log(`data source: ${session.uid} closed link`);
}

module.exports = function (app) {
    return new Handler(app);
};
