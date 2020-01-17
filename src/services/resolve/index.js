const errors = require('@feathersjs/errors');

// get an json api conform entry
const getDataEntry = ({
	type, id, name, authorities = ['can-read'], attributes = {},
}) => ({
	type,
	id,
	attributes: Object.assign({}, {
		name,
		authorities,
	}, attributes),
});

const equalId = (baseId) => (id) => baseId.toString() === id.toString();

// get scopes from user object Id
class ScopeResolver {
	async get(id, params) {
		const userService = this.app.service('/users');
		const courseService = this.app.service('/courses');
		const classService = this.app.service('/classes');
		const teamService = this.app.service('/teams');

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

		const user = await userService.get(id);
		const userId = user._id;

		response.data.push(getDataEntry({
			type: 'user',
			id: userId,
			name: user.fullName,
			authorities: [
				'can-read',
				'can-write',
				'can-send-notifications',
			],
		}));

		const [courses, classes, teams] = await Promise.all([
			courseService.find({
				query: {
					$limit: 1000,
					$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
				},
			}),
			classService.find({
				query: {
					$limit: 1000,
					$or: [{ userIds: userId }, { teacherIds: userId }],
				},
			}),
			teamService.find({
				query: {
					$limit: 1000,
					userIds: { $elemMatch: { userId } },
				},
			}),
		]);

		courses.data = courses.data.map((c) => {
			c.attributes = {
				scopeType: 'course',
			};
			return c;
		});

		classes.data = classes.data.map((c) => {
			c.attributes = {
				scopeType: 'class',
			};
			return c;
		});

		teams.data.forEach((_team) => {
			response.data.push(getDataEntry({
				type: 'scope',
				id: _team._id,
				name: _team.name,
				// todo: only leaders have notification and write permissions
				authorities: ['can-read', 'can-write', 'can-send-notifications'],
				attributes: {
					scopeType: 'team',
				},
			}));
		});

		const scopes = [].concat(courses.data, classes.data);
		const isUserId = equalId(userId);

		scopes.forEach((scope) => {
			const authorities = ['can-read'];

			const isTeacher = (scope.teacherIds || []).some(isUserId);
			const isSubstitutionTeacher = (scope.substitutionIds || []).some(isUserId);

			if (isTeacher || isSubstitutionTeacher) {
				authorities.push('can-write', 'can-send-notifications');
			}

			response.data.push(getDataEntry({
				type: 'scope',
				id: scope._id,
				name: scope.name,
				authorities,
				attributes: scope.attributes,
			}));
		});

		return Promise.resolve(response);
	}

	setup(app, path) {
		this.app = app;
	}
}

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
			userService.get(id, { headers: { 'x-api-key': (params.headers || {})['x-api-key'] } }).then((data) => {
				data.type = 'user';
				return data;
			}).catch((_) => undefined),
			courseService.get(id, { headers: { 'x-api-key': (params.headers || {})['x-api-key'] } }).then((data) => data).catch((_) => undefined),
			classService.get(id, { headers: { 'x-api-key': (params.headers || {})['x-api-key'] } }).then((data) => data).catch((_) => undefined),
		]).then(([userData, courseData, classData]) => userData || courseData || classData);


		return getScope.then((scope) => {
			// find users that are related to scope (either teacher or student)
			if (!scope) throw new errors.NotFound('No scope found for given id.');

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

	setup(app, path) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/resolve/scopes', new ScopeResolver());
	app.use('/resolve/users', new UserResolver());
};
