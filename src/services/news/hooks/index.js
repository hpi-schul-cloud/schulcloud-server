const auth = require('@feathersjs/authentication');
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

function getBoolean(value){
	switch(value){
		case true:
		case "true":
		case 1:
		case "1":
		case "on":
		case "yes":
			return true;
		default:
			return false;
	}
}

const convertToBoolean = (hook) => {
	if (hook.params.query && hook.params.query.target && hook.params.query.target.$exists) {
		hook.params.query.target.$exists = getBoolean(hook.params.query.target.$exists);
	}
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [
		globalHooks.hasPermission('NEWS_VIEW'),
		restrictToCurrentSchool,
		convertToBoolean,
	],
	get: [
		globalHooks.hasPermission('NEWS_VIEW'),
	],
	create: [
		globalHooks.hasPermission('NEWS_CREATE'),
	],
	update: [
		globalHooks.hasPermission('NEWS_EDIT'),
		restrictToCurrentSchool,
	],
	patch: [
		globalHooks.hasPermission('NEWS_EDIT'),
		restrictToCurrentSchool,
		globalHooks.permitGroupOperation,
	],
	remove: [
		globalHooks.hasPermission('NEWS_CREATE'),
		globalHooks.ifNotLocal(globalHooks.permitGroupOperation),
		restrictToCurrentSchool,
		deleteNewsHistory,
		globalHooks.ifNotLocal(globalHooks.checkSchoolOwnership),
	],
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
