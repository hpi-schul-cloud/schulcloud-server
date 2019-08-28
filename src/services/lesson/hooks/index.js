const auth = require('@feathersjs/authentication');
const { SKIP } = require('@feathersjs/feathers');
const nanoid = require('nanoid');
const {
	injectUserId,
	hasPermission,
	ifNotLocal,
	permitGroupOperation,
	checkCorrectCourseOrTeamId,
	testIfRoleNameExist,
	userIsInThatCourse,
	getUser,
} = require('../../../hooks');
const { hasAccessToCourse } = require('../../user-group/hooks/courses');
const Lesson = require('../model');
const checkIfCourseGroupLesson = require('./checkIfCourseGroupLesson');

// add a shareToken to a lesson if course has a shareToken
/**
 * @afterHook
 */
const addShareTokenIfCourseShareable = async (context) => {
	const { courseId, _id } = context.result;
	if (!courseId) {
		return context;
	}
	const course = await context.app.service('courses').get(courseId, {
		query: {
			$select: ['shareToken'],
		},
	});

	if (!course.shareToken) {
		return context;
	}

	return Lesson.findByIdAndUpdate(_id, { shareToken: nanoid(12) })
		.then(() => context);
};

const setPosition = async (context) => {
	const { courseId, courseGroupId } = context.data;
	if (courseId || courseGroupId) {
		const query = courseId ? { courseId } : { courseGroupId };
		context.data.position = await Lesson.count(query).exec(); // next free position
	}

	return context;
};

const mapUsers = (context) => {
	if (context.data && context.data.contents) {
		context.data.contents = (context.data.contents || []).map((item) => {
			item.user = item.user || context.params.account.userId;
			return item;
		});
	}
	return context;
};

const skipIfAdminOrSuperhero = async (context) => {
	const user = await getUser(context);
	if (testIfRoleNameExist(user, ['superhero', 'administrator'])) {
		return SKIP;
	}
	return context;
};

const populateFields = (context) => {
	let populate = context.params.query.$populate;
	if (typeof (populate) === 'undefined') {
		populate = ['courseId', 'courseGroupId'];
	} else if (Array.isArray(populate) && !populate.includes('courseId')) {
		populate.push('courseId');
		populate.push('courseGroupId');
	}
	context.params.query.$populate = populate;
	return context;
};

const lessonFilter = user => async (lesson) => {
	if ('courseGroupId' in lesson) {
		return userIsInThatCourse(user, lesson.courseGroupId, false) ? lesson : undefined;
	}
	return (await hasAccessToCourse(user._id, lesson.courseId)
				|| (context.params.query.shareToken || {}) === (lesson.shareToken || {})) ? lesson : undefined;
};

const filterLessons = user => async lessons => (await Promise.all(lessons.map(lessonFilter(user)))).filter(l => l);

const postProcessLessons = async (context) => {
	const user = await getUser(context);
	if (context.method === 'get' && (context.result || {})._id) {
		context.result = await lessonFilter(user)(context.result) || {};
		if ('courseGroupId' in context.result) {
			context.result.courseGroupId = context.result.courseGroupId._id;
		} else {
			context.result.courseId = context.result.courseId._id;
		}
	}
	if (context.method === 'find' && ((context.result || {}).data || []).length > 0) {
		context.result.data = await filterLessons(user)(context.result.data);
		context.result.total = context.result.data.length;
		context.result.data.forEach((lesson) => {
			if ('courseGroupId' in lesson) {
				lesson.courseGroupId = lesson.courseGroupId._id;
			} else {
				lesson.courseId = lesson.courseId._id;
			}
		});
	}
	return context;
};

exports.before = () => ({
	all: [auth.hooks.authenticate('jwt'), mapUsers],
	find: [
		hasPermission('TOPIC_VIEW'),
		ifNotLocal(skipIfAdminOrSuperhero),
		ifNotLocal(populateFields),
	],
	get: [
		hasPermission('TOPIC_VIEW'),
		ifNotLocal(skipIfAdminOrSuperhero),
		ifNotLocal(populateFields),
	],
	create: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', true),
		injectUserId,
		checkCorrectCourseOrTeamId,
		setPosition,
	],
	update: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
	],
	patch: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_EDIT', 'TOPIC_EDIT', false),
		permitGroupOperation,
		checkCorrectCourseOrTeamId,
	],
	remove: [
		checkIfCourseGroupLesson.bind(this, 'COURSEGROUP_CREATE', 'TOPIC_CREATE', false),
		permitGroupOperation,
	],
});

exports.after = {
	all: [],
	find: [ifNotLocal(postProcessLessons)],
	get: [ifNotLocal(postProcessLessons)],
	create: [addShareTokenIfCourseShareable],
	update: [],
	patch: [],
	remove: [],
};
