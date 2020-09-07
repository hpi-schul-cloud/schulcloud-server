const { authenticate } = require('@feathersjs/authentication');
const { equal } = require('../../../helper/compare').ObjectId;

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

// get scopes from user object Id
const equalId = (baseId) => (id) => equal(baseId, id);

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

		response.data.push(
			getDataEntry({
				type: 'user',
				id: userId,
				name: user.fullName,
				authorities: ['can-read', 'can-write', 'can-send-notifications'],
			})
		);

		const [courses, classes, teams] = await Promise.all([
			courseService.find({
				query: {
					$limit: false,
					$or: [{ userIds: userId }, { teacherIds: userId }, { substitutionIds: userId }],
				},
			}),
			classService.find({
				query: {
					$limit: false,
					$or: [{ userIds: userId }, { teacherIds: userId }],
				},
			}),
			teamService.find({
				query: {
					$limit: false,
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
			response.data.push(
				getDataEntry({
					type: 'scope',
					id: _team._id,
					name: _team.name,
					// todo: only leaders have notification and write permissions
					authorities: ['can-read', 'can-write', 'can-send-notifications'],
					attributes: {
						scopeType: 'team',
					},
				})
			);
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

			response.data.push(
				getDataEntry({
					type: 'scope',
					id: scope._id,
					name: scope.name,
					authorities,
					attributes: scope.attributes,
				})
			);
		});

		return Promise.resolve(response);
	}

	setup(app) {
		this.app = app;
	}
}

const scopeResolverHooks = {
	before: {
		all: [authenticate('api-key')],
	},
};

module.exports = { ScopeResolver, scopeResolverHooks };
