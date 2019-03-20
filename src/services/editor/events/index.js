/* eslint-disable object-curly-newline */
const logger = require('winston');
const { BadRequest } = require('feathers-errors');

const { courseModel } = require('../../models');
const { fakeParams } = require('../helper/');

const getCourse = id => courseModel.findById(id)
	.select('userIds classIds teacherIds substitutionIds')
	.lean().exec();
/*
const lessonCreate = (app) => {
	logger.info('create');
	app.service('lessons').on('create', (result, context) => {
		console.log(result, context.id);
		logger.warn('create');
	});
};

const lessonPatch = (app) => {
	app.service('lessons').on('patch', (result, context) => {
		console.log(result, context.id);
		logger.warn('patch');
	});
};

const lessonUpate = (app) => {
	app.service('lessons').on('update', (result, context) => {
		console.log(result, context.id);
		logger.warn('update');
	});
};
*/

const lessonOwnCreate = (app) => {
	app.on('lesson:after:create', async (context) => {
		try {
			const { _id, courseId, name } = context.result;

			const { userIds, classIds, teacherIds, substitutionIds } = await getCourse(courseId)
				.catch((err) => { throw new BadRequest(err); });

			const owner = ([teacherIds, ...substitutionIds]).map(e => e.toString());
			const users = (userIds || []).map(e => e.toString());
			const title = name;
			const param = fakeParams(teacherIds[0]);

			app.service('/editor/lessons')
				.create({ _id, owner, users, title }, param)
				.then((lesson) => {
					logger.info('Success: Editor create lesson.');
					logger.info({ lesson });
				})
				.catch((err) => {
					logger.warn(new BadRequest(err));
					logger.warn('Error: Editor create lesson.');
				});
		} catch (err) {
			logger.warn(new BadRequest(err));
			logger.warn('Error: Editor create lesson.');
		}
	});
};

const lessonOwnPatch = (app) => {
	app.on('lesson:after:patch', (context) => {
		console.log(context.result);
	});
};

const lessonOwnRemove = (app) => {
	app.on('lesson:after:remove', async (context) => {
		try {
			const { _id, courseId } = context.result;
			const { teacherIds } = await getCourse(courseId);

			const param = fakeParams(teacherIds[0]);
			app.service('/editor/lessons')
				.remove(_id, param)
				.then((lesson) => {
					logger.info('Success: Editor remove lesson.');
					logger.info({ lesson });
				});
		} catch (err) {
			logger.warn(new BadRequest(err));
			logger.warn('Error: Editor remove lesson.');
		}
	});
};

module.exports = (app) => {
	lessonOwnCreate(app);
	lessonOwnPatch(app);
	lessonOwnRemove(app);
};
