'use strict';
const co = require('co');
const _ = require('underscore');

let Handler = function (app) {
    this._app = app;
};

Handler.prototype.entry = function (msg, session, next) {
    if (!msg.memberID) {
        next(null, {
            errcode: 400,
            errmsg: "fail"
        });
        return;
    }
    let self = this;
    let memberID = msg.memberID;

    function authMember(memberID) {
        return new Promise((resolve, reject) => {
            let memberJSON = {
                memberID: "linmadan",
                memberInfo: {
                    name: "linmadan"
                },
                stations: ["NWHSDZ"]
            };
            resolve(memberJSON);
        });
    }

    function binMemberID(memberID) {
        return new Promise((resolve, reject) => {
            session.bind(memberID, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function binMemberPro(memberJSON) {
        return new Promise((resolve, reject) => {
            session.set('stations', memberJSON.stations);
            session.set('memberInfo', memberJSON.memberInfo);
            session.pushAll((err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    function* memberEntry() {
        let memberJSON = yield authMember(memberID);
        if (!memberJSON) {
            console.warn(`member: ${memberID} auth fail`);
            return {
                errcode: 400,
                errmsg: "fail"
            };
        }
        yield binMemberID(memberID);
        yield binMemberPro(memberJSON);
        session.on('closed', onSessionClosed.bind(null, self._app));
        console.info(`member: ${memberID} auth success`);
        return {
            errcode: 0,
            errmsg: "ok",
            member: memberJSON
        };
    };

    co(memberEntry).then((res) => {
        next(null, res);
    }).catch(err => {
        console.error(err.message);
        next(err);
    });
};

let onSessionClosed = function (app, session) {
    if (!session || !session.uid) {
        console.info(`invalid member session closed`);
        return;
    }
    console.info(`member: ${session.uid} session closed`);
}

module.exports = function (app) {
    return new Handler(app);
};
