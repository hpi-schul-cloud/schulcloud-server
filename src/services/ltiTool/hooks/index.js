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

exports.before = {
	all: [authenticate('jwt')],
	find: [globalHooks.hasPermission('TOOL_VIEW')],
	get: [globalHooks.hasPermission('TOOL_VIEW')],
	create: [globalHooks.hasPermission('TOOL_CREATE'), setupBBB],
	update: [globalHooks.hasPermission('TOOL_EDIT')],
	patch: [globalHooks.hasPermission('TOOL_EDIT')],
	remove: [globalHooks.hasPermission('TOOL_CREATE')],
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
