'use strict';
const co = require('co');
const _ = require('underscore');

let Handler = function (app) {
    this._app = app;
};

Handler.prototype.subData = function (msg, session, next) {
    let {dataSourceID, viewID, viewUserID} = msg;
    let channel = this._app.get('channelService').getChannel("NWHSDZ-YL", true);
    channel.add(session.uid, this._app.getServerId());
    logger.info(`view: ${viewID} and viewUser: ${viewUserID} sub data: ${dataSourceID} success`);
    next(null, {
        errcode: 0,
        errmsg: "ok"
    });
};

module.exports = function (app) {
    return new Handler(app);
};