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
        initProducer.createTopics(["data-arrive", "data-config"], true, (err) => {
            if (err) {
                return;
            }
            client.refreshMetadata(["data-arrive", "data-config"], () => {
                initProducer.close(() => {
                    console.log("init kafka topics success");
                    let consumerclient = new kafka.Client(`${ZOOKEEPER_SERVICE_HOST}:${ZOOKEEPER_SERVICE_PORT}`);
                    let topics = [{
                        topic: "data-config"
                    }];
                    let options = {
                        groupId: "data-source-portal-group"
                    };
                    consumer = new kafka.HighLevelConsumer(consumerclient, topics, options);
                    consumer.on('message', (message) => {
                        console.log(message);
                        let data = JSON.parse(message.value);
                        let channel = self._app.get('channelService').getChannel("NWHSDZ-YL-CONFIG", true);
                        let msg = {
                            // cmd: 'publish',
                            retain: false,
                            qos: 0,
                            dup: false,
                            // length: 53,
                            topic: 'NWHSDZ-YL-CONFIG',
                            payload: JSON.stringify(data),
                            // __route__: 'dataSourceConnector.mqttHandler.publish'
                        };
                        console.log(msg);
                        channel.pushMessage(msg);
                    });
                    console.log("start consuming topics");
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