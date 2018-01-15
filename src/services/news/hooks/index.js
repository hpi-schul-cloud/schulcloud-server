'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');
const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);
const newsModel = require('../model').newsModel;
const newsHistoryModel = require('../model').newsHistoryModel;
const logger = require('winston');

const deleteNewsHistory = hook => {
	newsModel.findOne({ _id: hook.id })
		.then(news => {
			for(let i = 0; i < news.history.length; i++) {
				newsHistoryModel.findOneAndRemove({ _id: news.history[i] })
					.catch(err => logger.log('error', err));
			}
		});
};

exports.before = {
	all: [auth.hooks.authenticate('jwt')],
	find: [restrictToCurrentSchool],
	get: [],
	create: [],
	update: [restrictToCurrentSchool],
	patch: [restrictToCurrentSchool, globalHooks.permitGroupOperation],
	remove: [restrictToCurrentSchool, globalHooks.permitGroupOperation, deleteNewsHistory]
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
