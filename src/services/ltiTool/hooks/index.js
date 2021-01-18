const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');
const { SCHOOL_FEATURES } = require('../../school/model');
const globalHooks = require('../../../hooks');
const { isSuperheroUser } = require('../../../helper/userHelpers');
const { isValid } = require('../../../helper/compare').ObjectId;
const { populateCurrentSchool } = require('../../../hooks/index');

const isBBBCreateRequest = (context) => context.data && context.data.url && context.data.url === 'BBB_URL';

const isValidCourseTool = (context) => context.data && context.data.courseId && isValid(context.data.courseId);

const setupBBB = (context) => {
	// ignore if no bbb request or no valid courseId given
	if (!isBBBCreateRequest(context) || !isValidCourseTool(context)) {
		return context;
	}
	// update url
	context.data.url = `/videoconference/course/${context.data.courseId}`;
	return context;
};

const protectSecrets = (context) => {
	if (Array.isArray(context.result.data)) {
		let i;
		for (i = 0; i < context.result.data.length; i += 1) {
			context.result.data[i].secret = undefined;
		}
	} else {
		context.result.secret = undefined;
	}
	return context;
};

const addSecret = (context) => {
	if (context.data.originTool) {
		return context.app
			.service('/ltiTools/')
			.get(context.data.originTool)
			.then((tool) => {
				context.data.secret = tool.secret;
				return context;
			});
	}

	return context;
};

const isBBBTool = (tool) => tool.name && tool.name === 'Video-Konferenz mit BigBlueButton';

const filterFindBBB = (context) => {
	let hasVideoconferenceItems = false;
	if (context.result && context.result.data && Array.isArray(context.result.data)) {
		hasVideoconferenceItems = context.result.data.some((tool) => isBBBTool(tool));
	}
	if (hasVideoconferenceItems) {
		// if school feature disabled, remove bbb tools from results data
		const { features } = context.params.school;
		if (!features.includes(SCHOOL_FEATURES.VIDEOCONFERENCE)) {
			context.result.data = context.result.data.filter((tool) => !isBBBTool(tool));
		}
	}
};

const filterGetBBB = (context) => {
	if (context.data && isBBBTool(context.data)) {
		const { features } = context.params.school;
		if (!features.includes(SCHOOL_FEATURES.VIDEOCONFERENCE)) {
			throw new Forbidden('school feature disabled');
		}
	}
};

const restrictToUsersOwnTools = async (context) => {
	const currentUserId = context.params.account.userId;
	if (isSuperheroUser(context.app, currentUserId)) return context;
	const coursesOfUser = await context.app.service('courses').find({
		query: {
			$or: [{ teacherIds: { $in: [currentUserId] } }, { substitutionIds: { $in: [currentUserId] } }],
		},
	});
	if (
		coursesOfUser.data.some((course) => course.ltiToolIds.map((id) => id.toString()).includes(context.id.toString()))
	) {
		return context;
	}
	throw new Forbidden('tool is not part of your courses');
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('TOOL_VIEW'), globalHooks.ifNotLocal(populateCurrentSchool)],
	get: [globalHooks.hasPermission('TOOL_VIEW'), globalHooks.ifNotLocal(populateCurrentSchool)],
	create: [globalHooks.hasPermission('TOOL_CREATE'), addSecret, setupBBB],
	update: [globalHooks.hasPermission('TOOL_EDIT')],
	patch: [globalHooks.hasPermission('TOOL_EDIT'), globalHooks.ifNotLocal(restrictToUsersOwnTools)],
	remove: [globalHooks.hasPermission('TOOL_CREATE'), globalHooks.ifNotLocal(restrictToUsersOwnTools)],
};

exports.after = {
	all: [],
	find: [globalHooks.ifNotLocal(protectSecrets), filterFindBBB],
	get: [globalHooks.ifNotLocal(protectSecrets), filterGetBBB],
	create: [],
	update: [],
	patch: [globalHooks.ifNotLocal(protectSecrets)],
	remove: [],
};
