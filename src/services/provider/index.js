'use strict';

module.exports = function() {
	const app = this;

	// TODO: check permissions for tool and user combination

	app.use('/provider', {
		find(params) {
			return Promise.resolve("OK");
		}
	})

	app.use('/provider/:toolId/users/:token/metadata', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token,
					toolId: params.toolId
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
							'username': "foo",
							'type': user.roles[0].name
						}

					};
				});
			});
		}
	});

	app.use('/provider/:toolId/users/:token/groups', {
		find(params) {
			return app.service("pseudonym").find({
				query: {
					token: params.token,
					toolId: params.toolId
				}
			}).then(pseudonym => {
				if (!pseudonym.data[0]) {
					return Promise.reject("User not found by token");
				}

				const userId = (pseudonym.data[0].userId);

				return app.service("courses").find({
					query: {
						ltiToolIds: params.toolId,
						$or: [
							{userIds: userId},
							{teacherIds: userId}
						]
					}
				}).then(courses => ({
					data: {
						groups: courses.data.map(course => ({
							group_id: course._id,
							name: course.name,
							student_count: course.userIds.length
						}))
					}
				}));
			});
		}
	});

	app.use('/provider/:toolId/groups', {
		get(id, params) {
			const courseService = app.service("courses");
			return courseService.find({
				query: {
					_id: id,
					ltiToolIds: params.toolId
				}
			}).then(courses => {
				if (!courses.data[0]) {
					return Promise.reject("Group not found");
				}
				const course = courses.data[0];
				const pseudoService = app.service("pseudonym");

				return Promise.all([
					pseudoService.find({
						query: {
							userId: course.userIds,
							toolId: params.toolId
						}
					}),
					pseudoService.find({
						query: {
							userId: course.teacherIds,
							toolId: params.toolId
						}
					}),
				]).then(([users, teachers]) => ({
						students: users.data.map(user => ({
							"user_id": user.token
						})),
						teachers: teachers.data.map(user => ({
							"user_id": user.token
						}))
					})
				);
			});
		}
	});
};
