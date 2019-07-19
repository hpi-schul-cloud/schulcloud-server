const { /* ScopePermissionService, */ ScopeListService } = require('../../helpers/scopePermissions');
const { courseModel } = require('../model');

module.exports = function setup() {
	const app = this;

	ScopeListService.initialize(app, '/users/:scopeId/courses', async (user, permissions, params) => {
		let filter = 'active';
		let substitution = 'false';
		if (params.query.filter && ['active', 'archived', 'all'].includes(params.query.filter)) {
			({ filter } = params.query);
		}
		if (params.query.substitution && ['true', 'false', 'all'].includes(params.query.substitution)) {
			({ substitution } = params.query);
		}

		const userQuery = { $or: [] };
		if (['false', 'all'].includes(substitution)) {
			userQuery.$or.push(
				{ userIds: user._id },
				{ teacherIds: user._id },
			);
		}
		if (['true', 'all'].includes(substitution)) userQuery.$or.push({ substitutionIds: user._id });

		let untilQuery = {};
		if (filter === 'active') {
			untilQuery = {
				$or: [
					{ untilDate: { $exists: false } },
					{ untilDate: { $gte: Date.now() } },
				],
			};
		}
		if (filter === 'archived') {
			untilQuery = { untilDate: { $lt: Date.now() } };
		}

		if (params.query.count === 'true') {
			return courseModel.count({
				$and: [
					userQuery,
					untilQuery,
				],
			});
		}

		return app.service('courses').find({
			query: {
				$and: [
					userQuery,
					untilQuery,
				],
				$skip: params.query.$skip,
				$limit: params.query.$limit,
			},
			paginate: params.paginate,
		});
	});
};
