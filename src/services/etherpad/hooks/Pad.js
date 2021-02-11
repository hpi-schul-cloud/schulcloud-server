const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');

const { Configuration } = require('@hpi-schul-cloud/commons');
const { Forbidden } = require('../../../errors');

const logger = require('../../../logger');
const globalHooks = require('../../../hooks');

const restrictOldPadsToCourse = async (context) => {
	if (typeof context.data.oldPadId === 'undefined') {
		return context;
	}
	const oldPadURI = Configuration.get('ETHERPAD_OLD_PAD_URI') || 'https://etherpad.schul-cloud.org/p';
	try {
		const lessonsService = context.app.service('/lessons');
		const foundLessons = await lessonsService.find({
			query: {
				courseId: context.id,
				contents: { $elemMatch: { 'content.url': `${oldPadURI}/${context.data.oldPadId}` } },
			},
		});
		if (foundLessons.total < 1) {
			throw new Error('Forbidden');
		}
	} catch (err) {
		logger.error('Forbidden to access pad: ', err);
		throw new Forbidden('Forbidden to access pad');
	}
};

const getGroupData = async (context) => {
	context.data = {
		...context.data,
		userId: context.params.account.userId,
	};
	const groupService = context.app.service('etherpad/groups').create(context.data);
	try {
		const response = await groupService;
		context.data = {
			...context.data,
			groupID: response.data.groupID,
		};
		return context;
	} catch (err) {
		logger.error('Failed to get course data: ', err);
		throw new Forbidden('Failed to get course data');
	}
};

const injectCourseId = async (context) => {
	context.id = context.data.courseId;
	return context;
};

const before = {
	all: [authenticate('jwt')],
	find: [disallow()],
	get: [disallow()],
	create: [
		globalHooks.hasPermission('TOOL_CREATE'),
		injectCourseId,
		globalHooks.restrictToUsersOwnCourses,
		getGroupData,
		restrictOldPadsToCourse,
	],
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
