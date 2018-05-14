'use strict';
const hooks = require("./hooks");
const globalHooks = require('../../hooks');

module.exports = function() {
	const app = this;

	app.use('/provider', {
		find(params) {
			return Promise.resolve("Provider interface available");
		}
	})

	app.use('/provider/users/:token/metadata', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token
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
							'user_id': params.token,
							'username': "Anonym",
							'type': user.roles[0].name
						}

					};
				});
			});
		}
	});

	app.service('/provider/users/:token/metadata').before({
		find: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.userIsMatching
		]
	})

	app.use('/provider/users/:token/groups', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token
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
	});

	app.service('/provider/users/:token/groups').before({
		find: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.userIsMatching,
			hooks.injectOriginToolIds]
	})

	app.use('/provider/groups', {
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
							"user_id": user.token
						})),
						teachers: teachers.data.map(user => ({
							"user_id": user.token
						}))
					}
				}));
			});
		}
	});

	app.service('/provider/groups').before({
		get: [
			globalHooks.ifNotLocal(hooks.tokenIsActive),
			hooks.injectOriginToolIds]
	})

	app.service('/provider/groups').after({
		get: hooks.groupContainsUser
	})
};
