const service = require('../../utils/feathers-mongoose');
const registerInternalService = require('../../utils/register-internal-service');
const hooks = require('./hooks');
const { teamsModel } = require('./model');
const { ScopePermissionService, ScopeListService } = require('../helpers/scopePermissions');
const { equal: equalIds } = require('../../helper/compare').ObjectId;

module.exports = function setup() {
	const app = this;
	const options = {
		Model: teamsModel,
		paginate: {
			default: 50,
			max: 100,
		},
		lean: { virtuals: true },
	};

	const teamsServices = registerInternalService(app, '/teams', service(options));

	teamsServices.hooks({
		before: hooks.before,
		after: hooks.after,
	});

	ScopePermissionService.initialize(app, '/teams/:scopeId/userPermissions', async (userId, team) => {
		// Return all permissions of the user's team role within the given team
		const [teamUser] = team.userIds.filter((u) => equalIds(u.userId, userId));
		if (teamUser !== undefined) {
			const role = await app.service('roles').get(teamUser.role.toString());
			return role.permissions;
		}
		return [];
	}, { internal: true });

	ScopeListService.initialize(app, '/users/:scopeId/teams', async (user, permissions) => {
		// Find all teams the user is in, regardless of permissions
		const query = {
			'userIds.userId': user._id,
		};
		const result = await app.service('teams').find({ query });
		// Permissions can only be checked via a lookup in the Role service,
		// because permissions can be inherited from parent-roles and are only decorated
		// into the role with an after-hook.
		// We need to use map+filter here, because the role-lookup is async and cannot
		// be handled by array#filter (which is inherently synchronous) alone.
		const teams = (
			await Promise.all(
				result.data.map(async (t) => {
					const [u] = t.userIds.filter((i) => equalIds(i.userId, user._id));
					if (!u.role) return false;
					const role = await app.service('roles').get(u.role);
					return permissions.every((p) => role.permissions.includes(p)) ? t : undefined;
				})
			)
		).filter((e) => e);
		return teams;
	}, { internal: true });
};
