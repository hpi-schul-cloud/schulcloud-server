const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { resolveScope } = require('./util/resolveScope');

/**
 * Returns the name and id for the scope of the requested resource
 * @param {Context} context Feathers hook context
 * @returns {Object} { scopeName, scopeId }
 * @throws {BadRequest} if the scope cannot be found
 */
const getScope = async (context) => {
	const { scopeName, scopeId } = await resolveScope(context);
	if (scopeName === undefined || scopeId === undefined) {
		throw new BadRequest('Cannot find scope name or scopeId.');
	}
	return { scopeName, scopeId };
};

/**
 * Returns the service instance of the user permission service for the given scope
 * @param {FeathersApp} app Feathers app object
 * @param {String} scopeName scope name
 * @returns {Service} permissionService
 * @throws {BadRequest} if no user permission service exists for the scope
 */
const getPermissionService = (app, scopeName) => {
	const permissionServicePath = `/${scopeName}/:scopeId/userPermissions`;
	const permissionService = app.service(permissionServicePath);
	if (permissionService === undefined) {
		throw new BadRequest(`There is no userPermission service for the scope '${scopeName}'.`);
	}
	return permissionService;
};

/**
 * Retrieve permissions of a user in a given scope
 * @param {FeathersApp} app Feathers app object
 * @param {ObjectId|String} userId A userId as ObjectId or String
 * @param {Object} scope A scope in the format {id, name}
 * @example
 * await getScopePermissions(app, new ObjectId(), {name: 'teams', id: new ObjectId()}) ==> []
 * await getScopePermissions(app, aRealUserId, {name: 'teams', id: aTeamId}) ==> [
 * 	'FILE_CREATE',
 * 	'TEAM_EDIT',
 * ]
 */
const getScopePermissions = async (app, userId, scope) => {
	const permissionService = getPermissionService(app, scope.name);
	return permissionService.get(userId, {
		route: {
			scopeId: scope.id,
		},
	});
};

/**
 * Returns a hook that resolves the context if the (authenticated) user has the required permissions inside the scope.
 * @param {Array<Permission>} requiredPermissions an array of strings identifying permissions in the scope
 * @requires auth.hooks.authenticate('jwt')
 * @returns {Function} Hook function: (context) => context
 * @throws {BadRequest} if the scope cannot be found or has no user permission service
 * @throws {Forbidden} if the user does not have the required permissions
 */
const checkScopePermissions = (requiredPermissions) => async (context) => {
	const { scopeName, scopeId } = await getScope(context);
	const { userId } = context.params.account;
	const userPermissions = await getScopePermissions(context.app, userId, { id: scopeId, name: scopeName });

	if (requiredPermissions.every((permission) => userPermissions.includes(permission))) {
		return context;
	}
	throw new Forbidden(`Missing one of the required permissions ${requiredPermissions}.`, {
		userId,
		scopeName,
		scopeId,
		requiredPermissions,
	});
};

module.exports = {
	getScopePermissions,
	checkScopePermissions,
};
