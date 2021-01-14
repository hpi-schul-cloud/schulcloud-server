const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { equal: equalIds, isValid } = require('../../../helper/compare').ObjectId;
const { preventPopulate } = require('../../../hooks');
const { ApplicationError } = require('../../../errors');

const toArray = (data) => (Array.isArray(data) ? data : [data]);

/**
 * rewrite tool id if there is a origin tool (content-specific pseudonym)
 */
const replaceToolWithOrigin = (hook) => {
	if (!hook.params.query.toolId) return hook;
	return hook.app
		.service('ltiTools')
		.get(hook.params.query.toolId)
		.then((tool) => {
			if (tool.isTemplate === false) {
				hook.params.query.toolId = tool.originTool;
			}
			return hook;
		});
};

/**
 * looks for user and tool combinations that aren't existing, creates them and adds them into result.data
 */
const createMissingPseudonyms = (context) => {
	// prevent pseudonym creation when only pseudonym is given
	if (!context.params.query.toolId || !context.params.query.userId) return context;
	const toolIds = toArray(context.params.query.toolId);
	const userIds = toArray(context.params.query.userId);
	const missingPseudonyms = [];
	for (const userId of userIds) {
		for (const toolId of toolIds) {
			if (!context.result.data.find((entry) => equalIds(entry.userId, userId) && equalIds(entry.toolId, toolId))) {
				// collect missing pseudonyms for user and tool
				missingPseudonyms.push({ userId, toolId });
			}
		}
	}
	if (!missingPseudonyms.length) return context;
	return context.app
		.service('pseudonym')
		.create(missingPseudonyms)
		.then((results) => {
			context.result.data = context.result.data.concat(results);
			return context;
		});
};

/**
 * restricts the returned pseudonyms to the users the authenticated user shares a course with
 */
const filterPseudonyms = (context) => {
	const currentUserId = context.params.account.userId;
	/** courseUserIds are all users which share a course with the current user */
	let courseUserIds = [currentUserId];
	return context.app
		.service('courses')
		.find({
			query: {
				$or: [{ teacherIds: currentUserId }, { userIds: currentUserId }, { substitutionIds: currentUserId }],
				$populate: 'classIds',
			},
		})
		.then((currentUserCourses) => {
			for (const course of currentUserCourses.data) {
				courseUserIds = courseUserIds.concat(course.userIds, course.teacherIds, course.substitutionIds || []);
				for (const classInstance of course.classIds || []) {
					courseUserIds = courseUserIds.concat(classInstance.userIds, classInstance.teacherIds);
				}
			}
			courseUserIds = new Set(courseUserIds.map((element) => element.toString()));
			context.result.data = context.result.data.filter((pseudonym) => courseUserIds.has(pseudonym.userId.toString()));
			return context;
		});
};

const haveExacltyOneResult = (data) => {
	return data && data.length === 1 && data[0].userId;
};

/**
 * Enrichs the first result with the users firstName and lastName
 * @param {*} context
 */
const populateUsername = (context) => {
	if (!haveExacltyOneResult(context.result.data)) {
		return context;
	}
	// expect pseudonym given and having one result given
	return context.app
		.service('users')
		.get(context.result.data[0].userId)
		.then((response) => {
			const { userId, toolId, pseudonym } = context.result.data[0];
			context.result.data[0] = {
				userId,
				toolId,
				pseudonym,
				user: {
					firstName: response.firstName,
					lastName: response.lastName,
				},
			};
			return context;
		});
};

const validatePseudonym = (pseudonym) => {
	if (typeof pseudonym === 'string' && pseudonym.length) return;
	throw new ApplicationError('invalid pseudonym');
};

const validateUserAndTool = (userId, toolId) => {
	const validUserId = Array.isArray(userId) ? userId.every((id) => isValid(id)) : isValid(userId);
	const validToolId = Array.isArray(toolId) ? toolId.every((id) => isValid(id)) : isValid(toolId);
	if (validUserId && validToolId) return;
	throw new ApplicationError('invalid userIds/toolIds');
};

const validateParams = (context) => {
	// at least one parameter is required to be given:
	// pseudonym should resolve with one item
	// userId and toolId resolves with multiple items
	const { pseudonym, userId, toolId } = context.params.query;
	// we have given either a pseudonym or userId and toolId
	if (pseudonym) {
		validatePseudonym(pseudonym);
		context.params.query = { pseudonym };
	} else {
		validateUserAndTool(userId, toolId);
		context.params.query = { userId, toolId };
	}
	return context;
};

exports.before = {
	all: [authenticate('jwt')],
	find: [validateParams, replaceToolWithOrigin, globalHooks.ifNotLocal(preventPopulate)],
	get: [disallow()],
	create: [globalHooks.ifNotLocal(disallow())],
	update: [disallow()],
	patch: [disallow()],
	remove: [globalHooks.ifNotLocal(disallow())],
};

exports.after = {
	all: [],
	find: [createMissingPseudonyms, globalHooks.ifNotLocal(filterPseudonyms), populateUsername],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
