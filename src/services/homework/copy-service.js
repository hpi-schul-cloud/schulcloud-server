const _ = require('lodash');
const { BadRequest } = require('@feathersjs/errors');

const { copyFile } = require('../fileStorage/utils');
const hooks = require('./hooks/copy');
const HomeworkModel = require('./model').homeworkModel;
const { FileModel } = require('../fileStorage/model');

class HomeworkCopyService {
	constructor(app) {
		this.app = app;
	}

	copy(copyAssignment, ignoreParams, addParams) {
		const temp = _.omit(JSON.parse(JSON.stringify(copyAssignment)), ignoreParams);
		return Object.assign(temp, addParams);
	}

	/**
	 * @param {Object} fileIds
	 * @param {Object} params
	 */
	async copyFilesIfExist(fileIds = [], params) {
		if (fileIds.length > 0) {
			const $or = (fileIds || []).map((_id) => ({ _id }));

			const files = await FileModel.find({ $or }).lean().exec();

			const copiedFiles = await Promise.all(
				files.map((file) =>
					copyFile(
						{
							file,
							parent: params.account.userId,
							sourceSchoolId: params.payload.schoolId,
						},
						params
					)
				)
			).catch((error) => {
				this.app.logger.error('Could not copy files for homework.', { homeworkId: params.id, error });
			});

			return copiedFiles.map((file) => file._id);
		}
		return [];
	}

	/**
	 * Is used in client for copy single homeworks.
	 * @param id = id of homework to copy
	 * @returns {new homework}
	 */
	async get(id, params) {
		const ignoredKeys = ['_id', 'stats', 'isTeacher', 'archived', '__v', 'fileIds'];

		const copyAssignment = await HomeworkModel.findOne({ _id: id }).lean().exec();
		const fileIds = await this.copyFilesIfExist(copyAssignment.fileIds, params);

		const addingKeys = {
			private: true,
			name: `${copyAssignment.name || ''} - Copy`,
			fileIds,
		};

		const tempAssignment = this.copy(copyAssignment, ignoredKeys, addingKeys);
		return HomeworkModel.create(tempAssignment);
	}

	/**
	 * TODO: test if it is also used for client tasks
	 * It is used for course and topic/lessons copy services by share and clone it.
	 * Copies a homework if the homework belongs to the user.
	 * @param data consists of the _id to copy, can have courseId/lessonId to add to correct course/lesson.
	 * @param params consists of information about the user.
	 * @returns new homework.
	 */
	async create({ newTeacherId, _id, courseId, lessonId }, params) {
		const userId = newTeacherId || (params.payload || {}).userId || (params.account || {}).userId;
		const ignoredKeys = ['_id', 'stats', 'isTeacher', 'archived', '__v', 'courseId', 'lessonId', 'fileIds'];

		const [copyAssignment, { schoolId, _id: teacherId }] = await Promise.all([
			HomeworkModel.findById(_id).lean().exec(),
			this.app.service('users').get(userId),
		]);
		const fileIds = await this.copyFilesIfExist(copyAssignment.fileIds, params);

		const addingKeys = {
			courseId,
			lessonId,
			schoolId,
			teacherId,
			fileIds,
			private: true,
		};

		const tempAssignment = this.copy(copyAssignment, ignoredKeys, addingKeys);
		return HomeworkModel.create(tempAssignment).catch((error) => {
			throw new BadRequest('Can not copy the homework.', { error });
		});
	}
}

module.exports = (app) => {
	app.use('/homework/copy', new HomeworkCopyService(app));
	const homeworkCopyService = app.service('/homework/copy');
	homeworkCopyService.hooks(hooks);
};
