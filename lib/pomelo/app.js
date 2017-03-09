'use strict';
const fs = require('fs');
const pomelo = require('pomelo');
const MicroprogramConnector = require('gridvo-microprogram-connector');

let app = pomelo.createApp();
const {
    SSL_KEY_PATH = `${__dirname }/keys/gridvocomrsa.key`,
    SSL_CA_PATH = `${__dirname }/keys/1_root_bundle.crt`,
    SSL_CERT_PATH = `${__dirname }/keys/1_www.gridvo.com_bundle.crt`
} = process.env;
app.set('name', 'smartgrid-wechat-portal');
app.configure('production|development', 'connector', () => {
    app.set('connectorConfig',
        {
            connector: MicroprogramConnector,
            ssl: {
                key: fs.readFileSync(SSL_KEY_PATH),
                ca: [fs.readFileSync(SSL_CA_PATH)],
                cert: fs.readFileSync(SSL_CERT_PATH)
            }
        });
    app.set('errorHandler', (err, msg, resp, session, next) => {
        console.error(err.stack);
    });
});
app.configure('production|development', 'dataSourceConnector', () => {
    app.set('connectorConfig',
        {
            connector: pomelo.connectors.mqttconnector,
            publishRoute: 'dataSourceConnector.mqttHandler.publish',
            subscribeRoute: 'dataSourceConnector.mqttHandler.subscribe'
        });
    app.set('errorHandler', (err, msg, resp, session, next) => {
        console.error(err.stack);
    });
});
app.start((err) => {
    if (err) {
        console.error(`${err.stack}`);
    }
    else {
        console.log("pomelo app is start");
    }
});
process.on('uncaughtException', err => {
    console.error(`Caught exception: ${err.stack}`);
});