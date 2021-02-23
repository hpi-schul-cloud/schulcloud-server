/* eslint-disable no-underscore-dangle */
const { FileModel } = require('../src/services/fileStorage/model');
const { LessonModel } = require('../src/services/lesson/model');
const { courseGroupModel, courseModel } = require('../src/services/user-group/model');
const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger');
const { OutputLogTemplate } = require('./helpers');
const { copyFile } = require('../src/services/fileStorage/utils');

const DETAIL_LOGS = true;
const EXECUTE_FIX = true;

const isUndefined = (e) => typeof e === 'undefined';
const isTextContent = (content) => content.component === 'text' && content.content.text;

const createDataTree = (courses = []) => {
	const map = {};
	const courseWithoutTeachers = [];
	courses.forEach((course) => {
		const { _id, teacherIds } = course;
		const teacher = teacherIds[0];
		if (!teacher) {
			courseWithoutTeachers.push({ courseId: _id, error: 'no teacher exist in course' });
		}
		if (isUndefined(map[_id])) {
			map[_id] = {
				courseId: _id,
				teacher,
				lessons: {},
				files: [],
				courseGroups: [],
				realFiles: [],
			};
		}
	});
	if (courseWithoutTeachers.length > 0) {
		logger.warning(`It exist ${courseWithoutTeachers.length} courses without teachers, also no owner exist.`);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(courseWithoutTeachers));
		}
	}
	return map;
};

const addCourseGroupIds = (datatree, courseGroups) => {
	const courseGroupWithoutCourse = [];
	courseGroups.forEach((cg) => {
		const { _id, courseId } = cg;
		if (datatree[courseId]) {
			datatree[courseId].courseGroups.push(_id);
		} else {
			courseGroupWithoutCourse.push({
				type: 'courseGroup',
				error: 'no course exist',
				_id,
				courseId,
			});
		}
	});
	if (courseGroupWithoutCourse.length > 0) {
		logger.warning(`It exist ${courseGroupWithoutCourse.length} courseGroups without course.`);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(courseGroupWithoutCourse));
		}
	}
	return datatree;
};

const addCourseLessons = (datatree, lessons) => {
	const courseGroupdLessons = [];
	lessons.forEach((lesson) => {
		const { _id, contents, courseId } = lesson;
		if (datatree[courseId]) {
			datatree[courseId].lessons[_id] = contents;
		} else {
			courseGroupdLessons.push(lesson);
		}
	});
	return [datatree, courseGroupdLessons];
};

const addCourseGroupLessons = (datatree, courseGroupdLessons) => {
	const lessonsWithoutCourse = [];
	courseGroupdLessons.forEach((lesson) => {
		const { _id, courseId, contents, courseGroupId } = lesson;
		let found = false;
		Object.keys(datatree).forEach((_courseId) => {
			if (datatree[_courseId].courseGroups.includes(courseGroupId)) {
				if (found === false) {
					found = true;
				} else {
					logger.warning(`A courseGroup lesson ${_id} is added in diffent courses, one is ${courseId}.`);
				}
				datatree[_courseId].lessons[_id] = contents;
			}
		});
		if (found === false) {
			lessonsWithoutCourse.push({
				type: 'lesson',
				error: 'no course exist',
				_id,
				courseId,
				courseGroupId,
			});
		}
	});
	if (lessonsWithoutCourse.length > 0) {
		logger.warning(`It exist ${lessonsWithoutCourse.length} lessons without course or courseGroup.`);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(lessonsWithoutCourse));
		}
	}
	return datatree;
};

const filterCourseFiles = (files) => files.filter((f) => f.refOwnerModel === 'course');

const extracFileIdsFromContents = (contents, courseId, lessonId) => {
	let list = [];
	const regexFileImports = new RegExp('file=.*(&amp;|&)name=[^"]*', 'g');
	const regexSplit = new RegExp('(file=|&amp;|&|name=)', 'g');

	contents.forEach((content, index) => {
		if (isTextContent(content)) {
			// `file=${file._id}&amp;name=${file.name}`
			// `file=${file._id}&name=${file.name}
			const fileStrings = content.content.text.match(regexFileImports);

			if (fileStrings !== null && fileStrings.length > 0) {
				const files = [];
				fileStrings.forEach((string) => {
					const data = string.split(regexSplit);
					files.push({
						string,
						_id: data[2].toString(),
						name: data[6],
						courseId,
						lessonId,
						content,
						index,
					});
				});
				list = [...list, ...files];
			}
		}
	});

	return list;
};

const extractAndAddFile = (datatree) => {
	// search content to found linked files
	Object.keys(datatree).forEach((courseId) => {
		const { lessons } = datatree[courseId];
		Object.keys(lessons).forEach((lessonId) => {
			const contents = lessons[lessonId];
			const files = extracFileIdsFromContents(contents, courseId, lessonId);
			if (files.length > 0) {
				datatree[courseId].files = [...datatree[courseId].files, ...files];
			}
		});
	});
	return datatree;
};

const detectNotExistingFiles = (datatree, files) => {
	const fileIds = files.map((f) => f._id.toString());
	const notExists = [];
	// test via include all files in datatree
	Object.keys(datatree).forEach((courseId) => {
		datatree[courseId].files.forEach((fileInfo) => {
			if (!fileIds.includes(fileInfo._id)) {
				fileInfo.type = 'linked file content';
				fileInfo.error = 'file not exist';
				notExists.push(fileInfo);
			}
		});
	});
	if (notExists.length > 0) {
		logger.warning(
			`They are ${notExists.length} Files that are added in lessons,` +
				'but not exist as meta data in file collection with targetModel="course".'
		);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(notExists));
		}
	}
};

const removeCourseWithoutFiles = (datatree) => {
	const newDatatree = {};
	Object.keys(datatree).forEach((courseId) => {
		if (datatree[courseId].files.length > 0) {
			newDatatree[courseId] = datatree[courseId];
		}
	});
	logger.info(
		`From ${Object.keys(datatree).length} courses,` +
			`are filtered ${Object.keys(newDatatree).length} with includes files.`
	);
	return newDatatree;
};

const addRealFilesToCourse = (datatree, files) => {
	const courseFilesWithoutCourse = [];
	files.forEach((file) => {
		const courseId = file.owner.toString();
		if (!datatree[courseId]) {
			courseFilesWithoutCourse.push({
				type: 'file with targetModel=course',
				error: 'course not exist',
				_id: file._id,
				owner: courseId,
				targetModel: file.targetModel,
			});
		} else {
			datatree[courseId].realFiles.push(file);
		}
	});
	if (courseFilesWithoutCourse.length > 0) {
		logger.warning(`It exist ${courseFilesWithoutCourse.length} course files without course.`);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(courseFilesWithoutCourse));
		}
	}
	return datatree;
};

const foundMissingFiles = (datatree, collectionFiles) => {
	const missingFiles = [];
	const notExistingSourceFiles = [];
	Object.keys(datatree).forEach((courseId) => {
		const { files: filesShouldExist, realFiles: filesThatExist, teacher } = datatree[courseId];

		filesShouldExist.forEach((shouldExist) => {
			const id = shouldExist._id;
			if (!filesThatExist.some((f) => f._id.toString() === id)) {
				const sourceFile = collectionFiles.filter((f) => f._id.toString() === id)[0];
				if (sourceFile === undefined) {
					notExistingSourceFiles.push({ shouldExist, error: 'Source file do not exist.' });
				} else {
					missingFiles.push({
						target: shouldExist,
						teacher,
						sourceFile,
					});
				}
			}
		});
	});
	if (notExistingSourceFiles.length > 0) {
		logger.warning(`It exist ${notExistingSourceFiles.length} file links in lessons without source files.`);
		if (DETAIL_LOGS) {
			logger.warning(JSON.stringify(notExistingSourceFiles));
		}
	}
	return missingFiles;
};

const cloneMissingFilesAndUpdateLessons = (missingFileInfos, out) => {
	const tasks = [];
	missingFileInfos.forEach(({ target, sourceFile: file, teacher }) => {
		// with the condition that we have at the moment only awsS3 as strategie, it is not check for every school.
		const { content, lessonId, index, courseId: parent } = target;
		const id = file._id;
		if (!teacher) {
			out.pushFail(
				lessonId,
				'Skip fix file. No teachers in course exist.' + `Owner can not set. {fileId:${id}, lessonId:${lessonId}}`
			);
		}

		const payload = { userId: teacher, fileStorageType: 'awsS3' };
		const task = copyFile({ file, parent }, { payload })
			.then(({ _id, name }) => {
				// todo save and write one time
				logger.info('New file created: ', _id.toString());
				const fileChangelog = [];
				fileChangelog.push({
					old: `file=${id}&amp;name=${file.name}`,
					new: `file=${_id}&amp;name=${name}`,
				});
				fileChangelog.push({
					old: `file=${id}&name=${file.name}`,
					new: `file=${_id}&name=${name}`,
				});

				fileChangelog.forEach((change) => {
					content.content.text = content.content.text.replace(new RegExp(change.old, 'g'), change.new);
				});

				return LessonModel.updateOne(
					{
						_id: lessonId,
					},
					{
						$set: {
							[`contents.${index}`]: content,
						},
					},
					{
						new: true,
					}
				)
					.lean()
					.exec()
					.then((lesson) => {
						out.pushModified(lesson._id);
						return lesson;
					});
			})
			.catch((err) => {
				const { message, code, name } = err;
				out.pushFail(lessonId, { message, code, name });
			});
		tasks.push(task);
	});
	return tasks;
};

module.exports = {
	up: async function up() {
		await connect();
		const [files, lessons, courses, courseGroups] = await Promise.all([
			FileModel.find({}).lean().exec(),
			LessonModel.find({}).select('_id contents courseId courseGroupId').lean().exec(),
			courseModel.find({}).select('_id teacherIds').lean().exec(),
			courseGroupModel.find({}).select('_id courseId').lean().exec(),
		]);
		let courseGroupdLessons = [];
		let datatree = createDataTree(courses);
		datatree = addCourseGroupIds(datatree, courseGroups);
		[datatree, courseGroupdLessons] = addCourseLessons(datatree, lessons);
		datatree = addCourseGroupLessons(datatree, courseGroupdLessons);

		const courseFiles = filterCourseFiles(files);
		datatree = extractAndAddFile(datatree, courseFiles);
		detectNotExistingFiles(datatree, courseFiles);
		datatree = addRealFilesToCourse(datatree, courseFiles);
		datatree = removeCourseWithoutFiles(datatree);
		const missingFileInfos = foundMissingFiles(datatree, courseFiles);
		if (missingFileInfos.length > 0) {
			logger.info(`It found ${missingFileInfos.length} to start fixing with this script.`);
		}
		if (EXECUTE_FIX) {
			const out = new OutputLogTemplate({
				total: missingFileInfos.length,
				name: 'persist_files_by_copied_courses',
			});
			// do stuff to fix it
			const tasks = cloneMissingFilesAndUpdateLessons(missingFileInfos, out);
			await Promise.all(tasks);
			out.printResults();
		}
		await close();
	},
	down: async function down() {
		logger.warning('Down is not implemented.');
	},
};
