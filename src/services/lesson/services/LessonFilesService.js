const _ = require('lodash');

const { NotFound, BadRequest } = require('../../../errors');
const { FileModel } = require('../../fileStorage/model');
const { LessonModel } = require('../model');

class LessonFilesService {
	isTextContent(content) {
		return content.component === 'text' && content.content.text;
	}

	includeFileKey(content, fileKey) {
		return _.includes(content.content.text, fileKey);
	}

	replaceFileLinksByFileId(files = [], lesson) {
		const contents = lesson.contents || [];
		return files.filter((file) => _.some(contents, (c) => this.isTextContent(c) && this.includeFileKey(c, file.key)));
	}

	/**
	 * @returns all files which are included in text-components of a given lesson
	 * @param lessonId
	 * @param query contains shareToken
	 */
	find({ lessonId, query }) {
		const { shareToken } = query;
		if (!lessonId || !shareToken) throw new BadRequest('Missing parameters!');

		// first fetch lesson from given id
		return LessonModel.findOne({ _id: lessonId, shareToken }).then((lesson) => {
			if (!lesson) {
				throw new NotFound('No lesson was not found for given lessonId and shareToken!');
			}
			// fetch files in the given course and check whether they are included in the lesson
			// check whether the file is included in any lesson
			return FileModel.find({ path: { $regex: lesson.courseId } }).then((files) =>
				this.replaceFileLinksByFileId(files, lesson)
			);
		});
	}
}

module.exports = LessonFilesService;
