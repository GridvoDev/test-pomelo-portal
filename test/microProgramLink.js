'use strict';
const WebSocket = require('ws');

let client = new WebSocket('wss://www.gridvo.com:3012');

client.on('open', () => {
    client.send(JSON.stringify({
        id: "member-entry",
        route: "connector.memberHandler.entry",
        body: {
            memberID: "linmadan"
        }
    }));
});

client.on('message', (data, flags) => {
    console.log(data);
    let result = JSON.parse(data);
    if (result.id == "member-entry") {
        client.send(JSON.stringify({
            id: "sub-data",
            route: "connector.visualHandler.subData",
            body: {
                dataSourceID: "NWHSDZ-YL",
                viewID: "test-view",
                viewUserID: "NWHSDZ-YL"
            }
        }));
        client.send(JSON.stringify({
            id: "config-data",
            route: "connector.visualHandler.configData",
            body: {
                dataSourceID: "NWHSDZ-YL",
                config: {fenxiang: "60"}
            }
        }));
    }
    else if (result.id == "config-data") {
        console.log("config data");
    }
});