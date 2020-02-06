const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const { isValid } = require('../../../helper/compare').ObjectId;


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
		return context.app.service('/ltiTools/').get(context.data.originTool)
			.then((tool) => {
				context.data.secret = tool.secret;
				return context;
			});
	}

	return context;
};

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('TOOL_VIEW')],
	get: [globalHooks.hasPermission('TOOL_VIEW')],
	create: [globalHooks.hasPermission('TOOL_CREATE'), addSecret, setupBBB],
	update: [globalHooks.hasPermission('TOOL_EDIT')],
	patch: [globalHooks.hasPermission('TOOL_EDIT')],
	remove: [globalHooks.hasPermission('TOOL_CREATE')],
};

exports.after = {
	all: [],
	find: [globalHooks.ifNotLocal(protectSecrets)],
	get: [globalHooks.ifNotLocal(protectSecrets)],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
