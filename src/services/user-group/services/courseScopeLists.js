const { ScopeListService } = require('../../helpers/scopePermissions');
const { courseModel } = require('../model');

const buildUserQuery = (query, userId) => {
	const userQuery = { $or: [] };
	if (['false', 'all', undefined].includes(query.substitution)) {
		userQuery.$or.push({ userIds: userId });
		userQuery.$or.push({ teacherIds: userId });
	}
	if (['true', 'all', undefined].includes(query.substitution)) {
		userQuery.$or.push({ substitutionIds: userId });
	}
	return userQuery;
};

const buildArchiveQuery = (query) => {
	const filter = ['active', 'archived', 'all'].includes(query.filter) ? query.filter : 'active';

	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	let untilQuery = {};
	if (filter === 'active') {
		untilQuery = {
			$or: [{ untilDate: { $exists: false } }, { untilDate: null }, { untilDate: { $gte: yesterday } }],
		};
	}
	if (filter === 'archived') {
		untilQuery = { untilDate: { $lt: yesterday } };
	}
	return untilQuery;
};

module.exports = (app) => {
	ScopeListService.initialize(app, '/users/:scopeId/courses', async (user, permissions, params) => {
		const userQuery = buildUserQuery(params.query, user._id);
		const untilQuery = buildArchiveQuery(params.query);

		if (params.query.count === 'true') {
			const courseCount = await courseModel
				.count({
					$and: [userQuery, untilQuery],
				})
				.exec();

			return {
				total: courseCount,
			};
		}
		return app.service('courses').find({
			query: {
				$and: [userQuery, untilQuery],
				$skip: params.query.$skip,
				$limit: params.query.$limit,
			},
			paginate: params.paginate,
		});
	});
};
