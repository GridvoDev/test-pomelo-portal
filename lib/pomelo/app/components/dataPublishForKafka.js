'use strict';
const kafka = require('kafka-node');

let consumer;
let Component = function (app, opts) {
    this._app = app;
};

Component.prototype.start = function (cb) {
    let self = this;
    let {ZOOKEEPER_SERVICE_HOST = "127.0.0.1", ZOOKEEPER_SERVICE_PORT = "2181"} = process.env;
    let Producer = kafka.HighLevelProducer;
    let client = new kafka.Client(`${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`);
    let initProducer = new Producer(client);
    initProducer.on('ready', function () {
        initProducer.createTopics(["data-arrive"], true, (err) => {
            if (err) {
                return;
            }
            client.refreshMetadata(["data-arrive"], () => {
                initProducer.close(() => {
                    console.log("init kafka topics success");
                });
            });
        });
    });
    initProducer.on('error', (err) => {
        console.error(err.stack);
    });
    process.nextTick(cb);
};

Component.prototype.afterStart = function (cb) {
    process.nextTick(cb);
};

Component.prototype.stop = function (force, cb) {
    consumer.close();
    process.nextTick(cb);
};

module.exports = function (app, opts) {
    return new Component(app, opts);
};