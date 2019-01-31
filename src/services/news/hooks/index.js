const auth = require('feathers-authentication');
const logger = require('winston');
const globalHooks = require('../../../hooks');
const { newsModel, newsHistoryModel } = require('../model');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

const deleteNewsHistory = (hook) => {
	newsModel.findOne({ _id: hook.id })
		.then((news) => {
			for (let i = 0; i < news.history.length; i++) {
				newsHistoryModel.findOneAndRemove({ _id: news.history[i] })
					.catch(err => logger.log('error', err));
			}
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [globalHooks.hasPermission('NEWS_VIEW'), restrictToCurrentSchool],
	get: [globalHooks.hasPermission('NEWS_VIEW')],
	create: [globalHooks.hasPermission('NEWS_CREATE')],
	update: [globalHooks.hasPermission('NEWS_EDIT'), restrictToCurrentSchool],
	patch: [globalHooks.hasPermission('NEWS_EDIT'), restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [globalHooks.hasPermission('NEWS_CREATE'), restrictToCurrentSchool, globalHooks.permitGroupOperation, deleteNewsHistory, globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership)]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};