const { authenticate } = require('@feathersjs/authentication');

const { NotFound } = require('../../../errors');

// get an json api conform entry
const getDataEntry = ({ type, id, name, authorities = ['can-read'], attributes = {} }) => ({
	type,
	id,
	attributes: {
		name,
		authorities,
		...attributes,
	},
});

// get users from UUID (e.g. course id)
class UserResolver {
	get(id, params) {
		// token should NOT be userId but for testing purpose it's easier right now
		const userService = this.app.service('/users');
		const courseService = this.app.service('/courses');
		const classService = this.app.service('/classes');

		const response = {
			links: {
				self: '',
				first: '',
				last: '',
				next: '',
				prev: '',
			},
			data: [],
		};

		// only if both services fail the error will be thrown
		const getScope = Promise.all([
			userService
				.get(id)
				.then((data) => {
					data.type = 'user';
					return data;
				})
				.catch(() => undefined),
			courseService
				.get(id)
				.then((data) => data)
				.catch(() => undefined),
			classService
				.get(id)
				.then((data) => data)
				.catch(() => undefined),
		]).then(([userData, courseData, classData]) => userData || courseData || classData);

		return getScope
			.then((scope) => {
				// find users that are related to scope (either teacher or student)
				if (!scope) throw new NotFound('No scope found for given id.');

				return userService.find({
					query: {
						$or: [
							{
								_id: {
									$in: scope.userIds,
								},
							},
							{
								_id: {
									$in: scope.teacherIds,
								},
							},
							{
								_id: scope._id,
							},
						],
						$populate: ['roles'],
					},
				});
			})
			.then((data) => {
				const users = data.data;

				response.data = users.map((user) => {
					const authorities = ['can-read'];
					const isTeacher = user.roles.filter((role) => role.name === 'teacher');
					if (isTeacher.length > 0) {
						authorities.push('can-write', 'can-send-notifications');
					}

					return getDataEntry({
						type: 'user',
						id: user._id,
						name: user.fullName,
						authorities,
					});
				});
				return Promise.resolve(response);
			});
	}

	setup(app) {
		this.app = app;
	}
}

const userResolverHooks = {
	before: {
		all: [authenticate('api-key')],
	},
};

module.exports = { UserResolver, userResolverHooks };
