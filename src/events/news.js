const mongoose = require('mongoose');
const userModel = require('../services/user/model').userModel;
const send = require('./notificationSender').send;
const config = require('config');

function addPathToBase(path) {
    const client = config.get('services.client');
    const url = new URL(path, client);
    return url.toString();
}

function _newsAddedNotification(context) {
    userModel.find({ schoolId: context.data.schoolId }).exec().then(users => {
        userModel.findById(context.data.creatorId).exec().then(sender => {
            if (users) {
                let data = context.result.toObject();
                data.url = addPathToBase('/news/' + data._id.toString());
                send('news-added', data, users, sender.toObject());
            }
        });
    });
}

module.exports = {
    added: function (context) {
        _newsAddedNotification(context);
    }
}
