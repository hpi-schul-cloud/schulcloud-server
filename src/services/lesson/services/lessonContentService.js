const { authenticate } = require('@feathersjs/authentication');
const { LessonModel } = require('../model');

const lessonContentService = {
	find(params) {
		const userId = params.account.userId;

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
		all: [authenticate('jwt')],
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
