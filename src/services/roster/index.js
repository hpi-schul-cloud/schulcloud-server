const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const globalHooks = require('../../hooks');
const oauth2 = require('../oauth2/hooks');
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
		find(params) {
			return app
				.service('pseudonym')
				.find({
					query: {
						pseudonym: params.pseudonym,
					},
				})
				.then((pseudonym) => {
					if (!pseudonym.total) {
						return { errors: { description: 'User not found by token' } };
					}
					const { userId } = pseudonym.data[0];
					return app
						.service('users')
						.find({
							query: {
								_id: userId,
								$populate: ['roles'],
							},
						})
						.then((users) => {
							const user = users.data[0];
							return {
								data: {
									user_id: params.route.user,
									username: oauth2.getSubject(params.pseudonym, app.settings.services.web),
									type: user.roles.map((role) => role.name).some((roleName) => roleName === 'teacher')
										? 'teacher'
										: 'student',
								},
							};
						});
				});
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
		find(params) {
			return app
				.service('pseudonym')
				.find({
					query: {
						pseudonym: params.pseudonym,
					},
				})
				.then((pseudonym) => {
					if (!pseudonym.data[0]) {
						return { errors: { description: 'User not found by token' } };
					}

					const { userId } = pseudonym.data[0];
					return app
						.service('courses')
						.find({
							query: {
								ltiToolIds: { $in: params.toolIds },
								$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
							},
						})
						.then((courses) => ({
							// all users courses with given tool enabled
							data: {
								groups: courses.data.map((course) => ({
									group_id: course._id.toString(),
									name: course.name,
									student_count: course.userIds.length,
								})),
							},
						}));
				});
		},
	};

	const userGroupsHooks = {
		before: {
			find: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				globalHooks.ifNotLocal(hooks.userIsMatching),
				hooks.stripIframe,
				hooks.injectOriginToolIds,
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
		get(id, params) {
			const courseService = app.service('courses');
			return courseService
				.find({
					query: {
						_id: id,
						ltiToolIds: { $in: params.toolIds },
					},
				})
				.then((courses) => {
					if (!courses.data[0]) {
						return { errors: { description: 'Group not found' } };
					}
					const course = courses.data[0];
					const pseudonymService = app.service('pseudonym');
					return Promise.all([
						pseudonymService.find({
							query: {
								userId: course.userIds,
								toolId: params.toolIds[0],
							},
						}),
						pseudonymService.find({
							query: {
								userId: course.teacherIds.concat(course.substitutionIds || []),
								toolId: params.toolIds[0],
							},
						}),
					]).then(([users, teachers]) => ({
						data: {
							students: users.data.map((user) => ({
								user_id: user.pseudonym,
								username: oauth2.getSubject(user.pseudonym, app.settings.services.web),
							})),
							teachers: teachers.data.map((user) => ({
								user_id: user.pseudonym,
								username: oauth2.getSubject(user.pseudonym, app.settings.services.web),
							})),
						},
					}));
				});
		},
	};
	const groupsHooks = {
		before: {
			get: [
				globalHooks.ifNotLocal(hooks.tokenIsActive),
				hooks.injectOriginToolIds,
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
