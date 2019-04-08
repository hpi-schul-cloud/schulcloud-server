const { BadRequest } = require('feathers-errors');
const logger = require('winston');
const { customParams, getLessonsByCourse } = require('../helper/');

const isUsersPatched = ({ data = {} }) => {
	const { teacherIds, userIds, substitutionIds } = data;
	return teacherIds || userIds || substitutionIds;
};

const patchEditorLessons = async (app, { teacherIds = [], userIds = [], substitutionIds = [], _id }) => {
	const owner = [...teacherIds, ...substitutionIds];
	const users = userIds;
	const lessons = await getLessonsByCourse(_id);
	const params = customParams({ force: true });

	const promisses = (lessons || []).map(lesson => app.service('/editor/lessons')
		.patch(lesson._id, { owner, users }, params));

	Promise.all(promisses)
		.then((patchedLessons) => {
			logger.info('Success: Editor patched lesson.', patchedLessons.map(l => l._id));
		})
		.catch((err) => {
			logger.warn(new BadRequest('Error: Editor patched lesson.', err));
		});
};

const coursesPatch = (app) => {
	app.service('courses').on('patched', (result, context) => {
		if (isUsersPatched(context)) {
			patchEditorLessons(app, result);
		}
	});
	app.service('courses').on('updated', (result) => {
		patchEditorLessons(app, result);
	});
};

module.exports = {
	coursesPatch,
};
