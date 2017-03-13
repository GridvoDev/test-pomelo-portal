'use strict';
const mqtt = require('mqtt');

let client = mqtt.connect('mqtt://127.0.0.1:3011');
let timeout;
client.on('connect', () => {
    client.subscribe('NWHSDZ-YL-CONFIG');
    console.log("subscribe config topic");
    timeout = setInterval(() => {
        let payload = JSON.stringify({
            v: 1000 + 100 * Math.random(),
            t: (new Date()).getTime()
        });
        client.publish('NWHSDZ-YL', payload, () => {
            console.log(payload);
        });
    }, 2000);
});

client.on('message', (topic, message) => {
    console.log(topic.toString());
    console.log(message.toString());
});

client.on('close', () => {
    console.log("is close");
    clearInterval(timeout);
    client.end();
});
