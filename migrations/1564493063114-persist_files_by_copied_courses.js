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
				files: [],
				courseGroups: [],
				realFiles: [],
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

const extracFileIdsFromContents = (contents, courseId, lessonId) => {
	let list = [];
	const regexFileImports = new RegExp('file=.*(&amp;|&)name=[^"]*', 'g');
	const regexSplit = new RegExp('(file=|&amp;|&|name=)', 'g');

	contents.forEach((content) => {
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
						id: data[2],
						name: data[6],
						courseId,
						lessonId,
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
	const fileIds = files.map(f => f._id);
	const notExists = [];
	// test via include all files in datatree
	Object.keys(datatree).forEach((courseId) => {
		datatree[courseId].files.forEach((infos) => {
			if (!fileIds.includes(infos.id)) {
				notExists.push(infos);
			}
		});
	});
	logger.warning(
		'Files that are added in lessons, but not exist as meta data in file collection with targetModel="course"',
		notExists,
	);
};


const addRealFilesToCourse = (datatree, files) => {
	files.forEach((file) => {
		datatree[file.owner].realFiles.push(file);
	});
	return datatree;
};

const collectInfos = (collectionFiles, datatree, courseId) => {
	const data = datatree[courseId];
	data.courseId = courseId;
	data.realFile = collectionFiles.some(f => f._id.toString() === data.id.toString());
	return data;
};

const foundMissingFiles = (datatree, collectionFiles) => {
	const missingFiles = [];
	Object.keys(datatree).forEach((courseId) => {
		const { files, realFiles } = datatree[courseId];
		files.forEach((file) => {
			if (!realFiles.some(rf => rf._id.toString() === file._id.toString())) {
				missingFiles.push(
					collectInfos(collectionFiles, datatree, courseId),
				);
			}
		});
	});
	return missingFiles;
};

const createLessonContentPatchTask = (content, file) => {
	const task = {};
	return task;
};

const createCopyFileTask = (file, lesson) => {
	const task = {};
	return task;
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

		const courseFiles = filterCourseFiles(files);
		datatree = extractAndAddFile(datatree, courseFiles);
		detectNotExistingFiles(datatree, courseFiles);
		datatree = addRealFilesToCourse(datatree, courseFiles);
		const missingFileInfos = foundMissingFiles(datatree);
		await close();
	},
	down: async function down() {
		logger.warning('Down is not implemented.');
	},
};
