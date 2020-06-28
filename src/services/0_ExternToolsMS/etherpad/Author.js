const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const { Forbidden } = require('@feathersjs/errors');

const logger = require('../../../logger');
const { injectUserId, getUser } = require('../hooks');
const EtherpadClient = require('../logic/EtherpadClient');


const getUserData = async (context) => {
	try {
		context.data = await getUser(context);
		return context;
	} catch (err) {
		logger.error('Failed to get user data', err);
		throw new Forbidden('Failed to get user data');
	}
};

const AuthorHooks = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [
			injectUserId,
			getUserData,
		],
		update: [disallow()],
		patch: [disallow()],
		remove: [disallow()],
	},
	after: {
		all: [],
		find: [],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

class Author {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	create(params) {
		return EtherpadClient.createOrGetAuthor({
			name: params.fullName,
			authorMapper: params.id,
		});
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	Author,
	AuthorHooks,
	getUserData,
};
