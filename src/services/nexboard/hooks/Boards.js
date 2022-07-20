const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { hasPermission, getUser } = require('../../../hooks');
const { Forbidden, InternalServerError } = require('../../../errors');

const isNexbordEnabled = () => {
	if (!Configuration.get('NEXBOARD_USER_ID') || !Configuration.get('NEXBOARD_API_KEY')) {
		throw new InternalServerError('nexBoard is not configured');
	}
};

const getUserData = async (context) => {
	try {
		context.params.user = await getUser(context);
		return context;
	} catch (err) {
		throw new Forbidden('Failed to get user data');
	}
};

const getNexBoardProjectFromUser = async (context) => {
	const user = context.params.user || {};
	if (!user) {
		throw new Forbidden('Forbidden');
	}

	const preferences = user.preferences || {};
	if (!preferences.nexBoardProjectID) {
		try {
			context.data.title = user._id;
			context.data.description = user._id;
			const project = await context.app
				.service('/nexboard/projects')
				.create(context.data, { account: context.params.account });
			preferences.nexBoardProjectID = project.id;
			await context.app.service('/users').patch(user.id, { preferences }, { account: context.params.account });
			context.params.user.preferences = preferences;
			return context;
		} catch (err) {
			throw new Forbidden('Failed to get nexboard data');
		}
	}

	return context;
};

const before = {
	all: [authenticate('jwt'), isNexbordEnabled],
	find: [disallow()],
	get: [disallow()],
	create: [hasPermission('TOOL_CREATE'), getUserData, getNexBoardProjectFromUser],
	update: [disallow()],
	patch: [disallow()],
	remove: [disallow()],
};

const after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

module.exports = {
	before,
	after,
};
