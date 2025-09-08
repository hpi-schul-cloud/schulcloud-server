const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const hooks = require('./hooks');
const globalHooks = require('../../hooks');
const { excludeAttributesFromSanitization } = require('../../hooks/sanitizationExceptions');

module.exports = function roster() {
	const app = this;

	app.use('/roster/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/roster', {
		find() {
			return Promise.resolve('Roster interface available');
		},
	});

	/**
	 * Takes a pseudonym from params and resolves with depseudonymization iframe content.
	 * @param {string} params.route.user pseudonym from the given user
	 * @param params.pseudonym
	 * @returns data.user_id pseudonym
	 * @returns data.type first given user role name
	 * @returns data.username depseudonymization iframe html-code
	 */
	const metadataHandler = {
		async find(params) {
			const { pseudonym } = params;

			const userMetadata = await app.service('nest-feathers-roster-service').getUsersMetadata(pseudonym);

			return userMetadata;
		},
	};

	const metadataHooks = {
		before: {
			find: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				globalHooks.ifNotLocal(hooks.userIsMatching),
				hooks.stripIframe,
				excludeAttributesFromSanitization('roster/users/:user/metadata', 'username'),
			],
		},
	};

	const metaRoute = '/roster/users/:user/metadata';
	app.use(metaRoute, metadataHandler);
	app.service(metaRoute).hooks(metadataHooks);

	/**
	 * Takes a pseudonym and toolIds from params and resolves with courses the user is part of
	 * and which are using the tools specified by the toolIds
	 * @param {string} params.pseudonym The pseudonym of the given user
	 * @param params.toolIds Ids of the given tools
	 * @returns Array of course data including the group id, the group name, and the number of students
	 */
	const userGroupsHandler = {
		async find(params) {
			const userGroups = await app
				.service('nest-feathers-roster-service')
				.getUserGroups(params.pseudonym, params.tokenInfo.client_id);

			return userGroups;
		},
	};

	const userGroupsHooks = {
		before: {
			find: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				globalHooks.ifNotLocal(hooks.userIsMatching),
				hooks.stripIframe,
			],
		},
	};
	const userGroupRoute = '/roster/users/:user/groups';
	app.use(userGroupRoute, userGroupsHandler);
	app.service(userGroupRoute).hooks(userGroupsHooks);

	/**
	 * Takes a course id and returns the pseudonyms of the group members
	 * @param id ID of the given course
	 * @returns {Array} data.students student ids and pseudonyms of students which are enrolled in the course
	 * @returns {Array} data.teacers teacher ids and pseudonyms of teachers which are enrolled in the course
	 */
	const groupsHandler = {
		async get(id, params) {
			const group = await app.service('nest-feathers-roster-service').getGroup(id, params.tokenInfo.client_id);

			return group;
		},
	};
	const groupsHooks = {
		before: {
			get: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				excludeAttributesFromSanitization('roster/groups', 'username'),
			],
		},
		after: {
			get: hooks.groupContainsUser,
		},
	};

	app.use('/roster/groups', groupsHandler);
	app.service('/roster/groups').hooks(groupsHooks);
};
