const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const globalHooks = require('../../hooks');
const oauth2 = require('../oauth2/hooks');

module.exports = function roster() {
	const app = this;

	app.use('/roster/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/roster', {
		find() {
			return Promise.resolve('Roster interface available');
		},
	});

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
									type: user.roles[0].name,
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
			],
		},
	};

	app.use('/roster/users/:user/metadata', metadataHandler);
	app.service('/roster/users/:user/metadata').hooks(metadataHooks);

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
						return Promise.reject(new Error('User not found by token'));
					}

					const { userId } = pseudonym.data[0];
					return app
						.service('courses')
						.find({
							query: {
								ltiToolIds: { $in: params.toolIds },
								$or: [{ userIds: userId }, { teacherIds: userId }],
							},
						})
						.then((courses) => ({
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

	app.use('/roster/users/:user/groups', userGroupsHandler);
	app.service('/roster/users/:user/groups').hooks(userGroupsHooks);

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
					const pseudoService = app.service('pseudonym');
					return Promise.all([
						pseudoService.find({
							query: {
								userId: course.userIds,
								toolId: params.toolIds[0],
							},
						}),
						pseudoService.find({
							query: {
								userId: course.teacherIds,
								toolId: params.toolIds[0],
							},
						}),
					]).then(([users, teachers]) => ({
						data: {
							students: users.data.map((user) => ({
								user_id: user.pseudonym,
								username: encodeURI(oauth2.getSubject(user.pseudonym, app.settings.services.web)),
							})),
							teachers: teachers.data.map((user) => ({
								user_id: user.pseudonym,
								username: encodeURI(oauth2.getSubject(user.pseudonym, app.settings.services.web)),
							})),
						},
					}));
				});
		},
	};
	const groupsHooks = {
		before: {
			get: [globalHooks.ifNotLocal(hooks.tokenIsActive), hooks.injectOriginToolIds],
		},
		after: {
			get: hooks.groupContainsUser,
		},
	};

	app.use('/roster/groups', groupsHandler);
	app.service('/roster/groups').hooks(groupsHooks);
};
