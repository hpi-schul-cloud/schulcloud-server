/* eslint-disable no-underscore-dangle */
const { FileModel } = require('../src/services/fileStorage/model');
const LessonModel = require('../src/services/lesson/model');
const { courseGroupModel, courseModel } = require('../src/services/user-group/model');
const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger/');

const isUndefined = e => typeof e === 'undefined';
const isTextContent = content => content.component === 'text' && content.content.text;

const createDataTree = (courses = []) => {
	const map = {};
	courses.forEach((course) => {
		const { _id } = course;
		if (isUndefined(map[_id])) {
			map[_id] = {
				lessons: {},
				files: {},
				courseGroups: [],
			};
		}
	});
	return map;
};

const addCourseGroupIds = (datatree, courseGroups) => {
	courseGroups.forEach((cg) => {
		const { _id, courseId } = cg;
		if (datatree[courseId]) {
			datatree[courseId].courseGroups.push(_id);
		} else {
			logger.warning(`A courseGroup ${_id} without existing course ${courseId} found.`);
		}
	});
	return datatree;
};

const addCourseLessons = (datatree, lessons) => {
	const courseGroupdLessons = [];
	lessons.forEach((lesson) => {
		const {
			_id, contents, courseId,
		} = lesson;
		if (datatree[courseId]) {
			datatree[courseId].lessons[_id] = contents;
		} else {
			courseGroupdLessons.push(lesson);
		}
	});
	return [datatree, courseGroupdLessons];
};

const addCourseGroupLessons = (datatree, courseGroupdLessons) => {
	courseGroupdLessons.forEach((lesson) => {
		const {
			_id, courseId, contents, courseGroupId,
		} = lesson;
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
			logger.warning(
				`A lesson ${_id} without existing course ${courseId}, or courseGroup ${courseGroupId} found.`,
			);
		}
	});
	return datatree;
};

const filterCourseFiles = files => files.filter(f => f.refOwnerModel === 'course');

const extracFileIdsFromContent = (content) => {
	const files = [];
	// `file=${sourceFile._id}&amp;name=${sourceFile.name}`,
	// `file=${sourceFile._id}&name=${sourceFile.name}
	// => helper with regex
	return files;
};

const extractAndAddFile = (datatree) => {
	// search content to found linked files
	Object.keys(datatree).forEach((courseId) => {
		const { lessons } = datatree[courseId];
		Object.keys(lessons).forEach((lessonId) => {
			const contents = lessons[lessonId];
			if (isTextContent(contents)) {
				const files = extracFileIdsFromContent(contents);
				datatree[courseId].files = [...datatree[courseId].files, ...files];
			}
		});
	});
	return datatree;
};

const detectNotExistingFiles = (datatree, files) => {
	const fileIds = files.map(f => f._id);
	// test via include all files in datatree
};

const createLessonTask = (content, file) => {
	const task = {};
	return task;
};

const createCopyFileTask = (file, lesson) => {
	const task = {};
	return task;
};


const foundMissingFilesAndCreateTasks = (datatree, files) => {
	const tasks = [];
	const alreadyUsedFileIds = []; // in other courses
	/*
	files.forEach((file) => {
		file
	});
	return tasks; */
};

module.exports = {
	up: async function up() {
		await connect();
		const [files, lessons, courses, courseGroups] = await Promise.all([
			FileModel.find({}).lean().exec(),
			LessonModel.find({}).select('_id contents courseId courseGroupId').lean().exec(),
			courseModel.find({}).select('_id').lean().exec(),
			courseGroupModel.find({}).select('_id courseId').lean().exec(),
		]);
		let courseGroupdLessons = [];
		let datatree = createDataTree(courses);
		datatree = addCourseGroupIds(datatree, courseGroups);
		[datatree, courseGroupdLessons] = addCourseLessons(datatree, lessons);
		datatree = addCourseGroupLessons(datatree, courseGroupdLessons);

		datatree = extractAndAddFile(datatree, filterCourseFiles(files));
		detectNotExistingFiles(datatree, files);
		await close();
	},
	down: async function down() {
		logger.warning('Down is not implemented.');
		await connect();
		await close();
	},
};
