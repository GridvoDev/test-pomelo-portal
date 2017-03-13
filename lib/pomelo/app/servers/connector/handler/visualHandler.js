'use strict';
const kafka = require('kafka-node');
const co = require('co');
const _ = require('underscore');

let Handler = function (app) {
    this._app = app;
};

Handler.prototype.subData = function (msg, session, next) {
    let {dataSourceID, viewID, viewUserID} = msg;
    let channel = this._app.get('channelService').getChannel("NWHSDZ-YL", true);
    channel.add(session.uid, this._app.getServerId());
    console.log(`view: ${viewID} and viewUser: ${viewUserID} sub data: ${dataSourceID} success`);
    next(null, {
        errcode: 0,
        errmsg: "ok"
    });
};

Handler.prototype.configData = function (msg, session, next) {
    let {dataSourceID, config} = msg;
    console.log(msg);
    let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
    let client = new kafka.Client(
        `${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`,
        "test-client");
    let producer = new kafka.Producer(client);
    producer.on('ready', function () {
        producer.send([{
            topic: "data-config",
            messages: [JSON.stringify(config)]
        }], (err) => {
            if (err) {
                next(err);
            }
            console.log(`config data success`);
            next(null, {
                errcode: 0,
                errmsg: "ok"
            });
        });
    });
};

module.exports = function (app) {
    return new Handler(app);
};