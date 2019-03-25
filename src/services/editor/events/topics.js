/* eslint-disable object-curly-newline */
const logger = require('winston');
const { BadRequest } = require('feathers-errors');

const { fakeParams, getCourse } = require('../helper/');

const topicsCreate = (app) => {
	app.service('lessons').on('created', async (result) => {
		const { _id, courseId, name } = result;

		// eslint-disable-next-line prefer-const
		let { userIds, classIds, teacherIds, substitutionIds } = await getCourse(courseId);

		if (!substitutionIds) {
			substitutionIds = [];
		}
		const owner = ([teacherIds, ...substitutionIds]).map(e => e.toString());
		const users = (userIds || []).map(e => e.toString());
		const title = name;
		// use first teacher as user that make this action
		const param = fakeParams({ userId: teacherIds[0] });

		app.service('/editor/lessons')
			.create({ _id, owner, users, title }, param)
			.then((lesson) => {
				logger.info('Success: Editor created lesson.', lesson._id);
			})
			.catch((err) => {
				logger.warn(new BadRequest('Error: Editor created lesson.', err));
			});
	});
};

const topicsRemove = (app) => {
	app.service('lessons').on('removed', async ({ _id }) => {
		// const  = result;
		// const { teacherIds } = await getCourse(courseId);

		// use first teacher as user that make this action
		const param = fakeParams({ force: true });
		app.service('/editor/lessons')
			.remove(_id, param)
			.then((lesson) => {
				logger.info('Success: Editor removed lesson.', lesson._id);
			})
			.catch((err) => {
				logger.warn(new BadRequest('Error: Editor removed lesson.', err));
			});
	});
};

module.exports = {
	topicsRemove,
	topicsCreate,
};
