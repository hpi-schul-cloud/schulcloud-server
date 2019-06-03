const mongoose = require('mongoose');
const { userModel } = require('../services/user/model');
const { send } = require('./notificationSender');
const config = require('config');

const clientUrl = config.get('services.client');

function addPathToClientUrl(path) {
	const url = new URL(path, clientUrl);
	return url.toString();
}

function _newsAddedNotification(context) {
	userModel.find({ schoolId: context.data.schoolId }).exec().then((users) => {
		userModel.findById(context.data.creatorId).exec().then((sender) => {
			if (users) {
				const data = context.result.toObject();
				data.url = addPathToClientUrl(`/news/${data._id.toString()}`);
				send('news-added', data, users, sender.toObject());
			}
		});
	});
}

module.exports = {
	added(context) {
		_newsAddedNotification(context);
	},
};
