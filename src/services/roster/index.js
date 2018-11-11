'use strict';
const hooks = require("./hooks");
const globalHooks = require('../../hooks');
const oauth2 = require('../oauth2/hooks');

module.exports = function() {
	const app = this;

	app.use('/roster', {
		find(params) {
			return Promise.resolve("Roster interface available");
		}
	})

	const metadataHandler = {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					pseudonym: params.pseudonym
				}
			}).then(pseudonym => {
				if (!pseudonym.data[0]) {
					return { errors: {"description": "User not found by token"}};
				}
				const userId = (pseudonym.data[0].userId);
				return app.service("users").find({
					query: {
						_id: userId,
						$populate: ['roles']
					}
				}).then(users => {
					const user = users.data[0];
					return {
						data: {
							'user_id': params.user,
							'username': "Anonymous",
							'type': user.roles[0].name
						}

					};
				});
			});
		}
	}

	const metadataHooks = {
		find: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.userIsMatching,
			hooks.stripIframe,
		]
	}

	app.use('/roster/users/:user/metadata', metadataHandler);
	app.service('/roster/users/:user/metadata').before(metadataHooks);
	app.use('/provider/users/:user/metadata', metadataHandler);
	app.service('/provider/users/:user/metadata').before(metadataHooks);

	const userGroupsHandler = {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					pseudonym: params.pseudonym
				}
			}).then(pseudonym => {
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}

				const userId = (pseudonym.data[0].userId);
				return app.service("courses").find({
					query: {
						ltiToolIds: { $in: params.toolIds },
						$or: [
							{userIds: userId},
							{teacherIds: userId}
						]
					}
				}).then(courses => ({
					data: {
						groups: courses.data.map(course => ({
							group_id: course._id.toString(),
							name: course.name,
							student_count: course.userIds.length
						}))
					}
				}));
			});
		}
	};

	const userGroupsHooks = {
		find: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.userIsMatching,
			hooks.stripIframe,
			hooks.injectOriginToolIds]
	};

	app.use('/roster/users/:user/groups', userGroupsHandler);
	app.service('/roster/users/:user/groups').before(userGroupsHooks);
	app.use('/provider/users/:user/groups', userGroupsHandler);
	app.service('/provider/users/:user/groups').before(userGroupsHooks);

	const groupsHandler = {
		get(id, params) {
			const courseService = app.service("courses");
			return courseService.find({
				query: {
					_id: id,
					ltiToolIds: { $in: params.toolIds }
				}
			}).then(courses => {
				if (!courses.data[0]) {
					return { errors: {"description": "Group not found"}};
				}
				const course = courses.data[0];
				const pseudoService = app.service("pseudonym");

				return Promise.all([
					pseudoService.find({
						query: {
							userId: course.userIds,
							toolId: params.toolIds[0]
						}
					}),
					pseudoService.find({
						query: {
							userId: course.teacherIds,
							toolId: params.toolIds[0]
						}
					}),
				]).then(([users, teachers]) => ({
					data: {
						students: users.data.map(user => ({
							"user_id": oauth2.getSubject(user.pseudonym)
						})),
						teachers: teachers.data.map(user => ({
							"user_id": oauth2.getSubject(user.pseudonym)
						}))
					}
				}));
			});
		}
	};
	const groupsHooksBefore = {
		get: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.injectOriginToolIds]
	};

	const groupsHooksAfter = {
		get: hooks.groupContainsUser
	};

	app.use('/roster/groups', groupsHandler);
	app.service('/roster/groups').before(groupsHooksBefore);
	app.service('/roster/groups').after(groupsHooksAfter);
	app.use('/provider/groups', groupsHandler);
	app.service('/provider/groups').before(groupsHooksBefore);
	app.service('/provider/groups').after(groupsHooksAfter);
};
