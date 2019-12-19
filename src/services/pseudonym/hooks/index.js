const { authenticate } = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const toArray = (data) => (Array.isArray(data) ? data : [data]);

// rewrite tool id if there is a origin tool (content-specific pseudonym)
const replaceToolWithOrigin = (hook) => {
	if (!hook.params.query.toolId) return hook;
	return hook.app.service('ltiTools').get(hook.params.query.toolId).then((tool) => {
		hook.params.query.toolId = tool.originTool || hook.params.query.toolId;
		return hook;
	});
};

// looks for user and tool combinations that aren't existing and creates them
const createMissingPseudonyms = (hook) => {
	if (!hook.params.query.toolId || !hook.params.query.userId) return hook;
	const toolIds = toArray(hook.params.query.toolId);
	const userIds = toArray(hook.params.query.userId);
	const missingPseudonyms = [];
	for (const userId of userIds) {
		for (const toolId of toolIds) {
			if (!hook.result.data.find((entry) => (
				equalIds(entry.userId, userId)
				&& equalIds(entry.toolId, toolId)))) {
				missingPseudonyms.push({ userId, toolId });
			}
		}
	}
	if (!missingPseudonyms.length) return hook;
	return hook.app.service('pseudonym')
		.create(missingPseudonyms)
		.then((results) => {
			hook.result.data = hook.result.data.concat(results);
			return hook;
		});
};

// restricts the return pseudonyms to the users the current user is allowed to retrieve
const filterValidUsers = (context) => {
	const currentUserId = context.params.account.userId;
	let courseUserIds = [currentUserId];
	return context.app.service('courses').find({
		query: {
			$or: [
				{ teacherIds: currentUserId },
				{ userIds: currentUserId },
				{ substitutionIds: currentUserId },
			],
			$populate: 'classIds',
		},
	}).then((currentUserCourses) => {
		for (const course of currentUserCourses.data) {
			courseUserIds = courseUserIds.concat(course.userIds, course.teacherIds, (course.substitutionIds || []));
			for (const classInstance of (course.classIds || [])) {
				courseUserIds = courseUserIds.concat(classInstance.userIds, classInstance.teacherIds);
			}
		}
		courseUserIds = new Set(courseUserIds.map((element) => element.toString()));
		context.result.data = context.result.data
			.filter((pseudonym) => courseUserIds.has(pseudonym.userId.toString()));
		return context;
	});
};

const populateUsername = (context) => {
	if (!context.result.data[0]) return context;
	return context.app.service('users').get(context.result.data[0].userId)
		.then((response) => {
			context.result.data[0] = {
				...context.result.data[0]._doc, // eslint-disable-line no-underscore-dangle
				user: {
					firstName: response.firstName,
					lastName: response.lastName,
				},
			};
			return context;
		});
};

exports.before = {
	all: [authenticate('jwt')],
	find: [replaceToolWithOrigin],
	get: [() => { throw new errors.MethodNotAllowed(); }],
	create: [globalHooks.ifNotLocal(() => { throw new errors.MethodNotAllowed(); })],
	update: [() => { throw new errors.MethodNotAllowed(); }],
	patch: [() => { throw new errors.MethodNotAllowed(); }],
	remove: [globalHooks.ifNotLocal(() => { throw new errors.MethodNotAllowed(); })],
};

exports.after = {
	all: [],
	find: [createMissingPseudonyms, globalHooks.ifNotLocal(filterValidUsers), populateUsername],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
