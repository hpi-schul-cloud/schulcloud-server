const lessonContentService = {
	find(params) {
		const userId = params.account.userId;
		if (!userId) {
			throw new BadRequest('requires a user in the query')
		}
		return LessonModel.aggregate([
			{ $lookup: {
				from: 'courses',
				localField: 'courseId',
				foreignField: '_id',
				as: 'course'
			}},
			{ $match: { $or: [
				{ 'course.userIds': userId},
				{ 'course.teacherIds': userId },
				{ 'course.substitutionIds': userId }
			]} },
			{ $unwind: '$contents' },
			{ $match: { 'contents.component': params.query.type } },
			{ $match: { $or: [
				{ 'contents.user': { $in: [params.query.user] } },
				{ $or: [
					{'contents.hidden': { $exists: false } },
					{'contents.hidden': false }
				]},
			] } },
			{ $project: { _id: '$contents._id', content: '$contents.content' } },
		]).exec();
	},
}

const lessonContentServiceHooks = {
	before: {
		all: [auth.hooks.authenticate('jwt')],
		find: [],
	},
	after: {
		all: [],
		find: [],
	},
};

module.exports = {
	lessonContentService,
	lessonContentServiceHooks,
};
