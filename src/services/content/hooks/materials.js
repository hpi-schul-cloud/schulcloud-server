const { authenticate } = require('@feathersjs/authentication');
const { Forbidden } = require('@feathersjs/errors');
const { hasPermission } = require('../../../hooks');
const { getScopePermissions } = require('../../helpers/scopePermissions/hooks/checkScopePermissions');

/**
 * Returns true if the user making the request has the required permissions
 * in all courses which reference the given material.
 * @param {Context} context hook context
 * @param {ObjectId} id Id of the material
 * @param {Array<String>} permissions Array of required permissions
 * @returns {Boolean} true if conditions are met, false otherwise
 */
const hasMaterialAccess = async (context, id, permissions) => {
	const courses = await context.app.service('courses').find({
		query: {
			materialIds: id,
			$select: ['_id'],
		},
		paginate: false,
	});
	const access = courses.every((course) => {
		const scope = { id: course._id, name: 'courses' };
		const userPermisisons = getScopePermissions(context.app, context.params.account.userId, scope);
		return permissions.every((permission) => userPermisisons.includes(permission));
	});
	return access;
};

/**
 * Before-hook to enforce the requesting user has the required permisions in the course
 * the material is used in. If the material is used in multiple courses, the permissions
 * will be required in all of them.
 * @requires authenticate('jwt')
 * @param  {...String} permissions list of permissions necessary for this hook to resolve
 * @returns {Context} hook context
 */
const checkAssociatedCoursePermission = (...permissions) => async (context) => {
	if (permissions) {
		const access = await hasMaterialAccess(context, context.id, permissions);
		if (!access) {
			throw new Forbidden('No permision to access this material');
		}
	}
	return context;
};

/**
 * After-hook to filter results of a find query to materials of courses the requesting user
 * has acces to. If a material is used in multiple courses, the permissions will be required
 * in all of them.
 * @requires authenticate('jwt')
 * @param  {...String} permissions list of permissions necessary for this hook to resolve
 * @returns {Context} hook context
 */
const checkAssociatedCoursePermissionForSearchResult = (...permissions) => async (context) => {
	if (permissions) {
		const results = context.result.data ? context.result.data : context.result;
		const filteredResults = [];
		for (const result of results) {
			if (await hasMaterialAccess(context, result._id, permissions)) {
				filteredResults.push(result);
			}
		}
		if (context.result.data) {
			context.result.data = filteredResults;
			context.result.total = filteredResults.length;
		} else {
			context.result = filteredResults;
		}
	}
	return context;
};

exports.before = {
	all: [
		authenticate('jwt'),
	],
	find: [
		// filtered in after-hook
	],
	get: [checkAssociatedCoursePermission('CONTENT_VIEW')],
	create: [
		// We don't have a course id or similar here, so we need to stick to global roles,
		// which is probably okay since the user will need edit rights in the course to add
		// the newly created material to it anyway.
		hasPermission('TOPIC_EDIT'),
	],
	update: [checkAssociatedCoursePermission('TOPIC_EDIT')],
	patch: [checkAssociatedCoursePermission('TOPIC_EDIT')],
	remove: [checkAssociatedCoursePermission('TOPIC_EDIT')],
};

exports.after = {
	all: [],
	find: [checkAssociatedCoursePermissionForSearchResult('CONTENT_VIEW')],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
