'use strict';
const co = require('co');
const kafka = require('kafka-node');
const _ = require('underscore');

let Handler = function (app) {
    this._app = app;
};

Handler.prototype.publish = function (msg, session, next) {
    let {topic, payload} = msg;
    let dataSourceID;
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

    function joinChannel() {
        return new Promise((resolve, reject) => {
            let channel = self._app.get('channelService').getChannel("NWHSDZ-YL", true);
            channel.add(session.uid, self._app.getServerId());
            resolve();
        });
    }

    function* dataSourceLink() {
        yield binDataSourceID("NWHSDZ-YL");
        session.on('closed', onSessionClosed.bind(null, self._app));
        yield joinChannel();
        console.info(`data source: NWHSDZ-YL link success`);
        return {
            errcode: 0,
            errmsg: "ok"
        };
    };

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
        dataSourceID = topic ? topic : "noDataSourceID";
        co(dataSourceLink).then((res) => {
            if (res.errcode == 0) {
                receiveOriginalData();
            } else {
                self._app.get("sessionService").kickBySessionId(session.id, "close client", (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                });
                next(null, res);
            }
        }).catch(err => {
            console.error(err.stack);
            next(err);
        });
    } else {
        receiveOriginalData();
    }
};

Handler.prototype.subscribe = function (msg, session, next) {
    next(null, {
        errcode: 400,
        errmsg: "fail"
    });
};

let onSessionClosed = function (app, session) {
    if (!session || !session.uid) {
        console.warn(`invalid data source link closed`);
        return;
    }
    let channel = app.get('channelService').getChannel("NWHSDZ-YL", true);
    channel.leave(session.uid, app.getServerId());
    console.warn(`data source: ${session.uid} closed link`);
}

module.exports = function (app) {
    return new Handler(app);
};
