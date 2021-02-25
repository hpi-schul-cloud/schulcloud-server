const { authenticate } = require('@feathersjs/authentication');

const { iff, isProvider } = require('feathers-hooks-common');
const { Forbidden, GeneralError, NotFound, NotAuthenticated } = require('../../../errors');
const logger = require('../../../logger');

const globalHooks = require('../../../hooks');
const { equal: equalIds, isValid: isValidId } = require('../../../helper/compare').ObjectId;

const getAverageRating = function getAverageRating(submissions) {
	// Durchschnittsnote berechnen
	if (submissions.length > 0) {
		// Nur bewertete Abgaben einbeziehen
		const submissiongrades = submissions.filter((s) => Number.isInteger(s.grade));
		// Abgabe für jedes Teammitglied einzeln werten
		let numSubmissions = 0;
		let gradeSum = 0;
		submissiongrades.forEach((e) => {
			if (e.courseGroupId && (e.courseGroupId.userIds || []) > 0) {
				numSubmissions += e.courseGroupId.userIds.length;
				gradeSum += e.courseGroupId.userIds * e.grade;
			} else if (e.teamMembers && e.teamMembers.length > 0) {
				numSubmissions += e.teamMembers.length;
				gradeSum += e.teamMembers.length * e.grade;
			} else {
				numSubmissions += 1;
				gradeSum += e.grade;
			}
		});

		// Abgaben vorhanden?
		if (numSubmissions > 0) {
			// Durchschnittsnote berechnen
			return (gradeSum / numSubmissions).toFixed(2);
		}
	}
	return undefined;
};

function isValidSubmission(submission) {
	return (submission.comment && submission.comment !== '') || (submission.fileIds && submission.fileIds.length > 0);
}

function isGraded(submission) {
	return (
		(submission.gradeComment && submission.gradeComment !== '') ||
		(submission.grade && Number.isInteger(submission.grade)) ||
		(submission.gradeFileIds && submission.gradeFileIds.length > 0)
	);
}

/**
 * Resolves with true, if the user id given matches the teacherId (which is the case for students too) AND the private flag is set true.
 * @param {String|ObjectId} userId
 * @param {*} homework
 * @returns {Boolean}
 */
const isHomeworkOwner = (userId, homework) => {
	// changed logic, added private check beside owner-check
	const result = equalIds(userId, homework.teacherId) === true;
	return result;
};

/**
 * for non-private homework, resolves with true when the userId is part of the homeworks courses teacherIds or courses substitutionIds
 * requires a homework with populated course in courseId to be given
 * @param {ObjectId|String} userId
 * @param {Object} homework
 * @param {[ObjectId]} homework.courseId.teacherIds
 * @param {[ObjectId]} homework.courseId.substitutionIds
 * @returns {Boolean} isTeacherInHomeworksCourse
 */
const isCourseHomeworkTeacher = (userId, homework) => {
	if (!isValidId(userId)) throw new GeneralError('missing valid userId', { userId });
	if (!homework || !homework.courseId) throw new GeneralError('course id (populated) in homework');

	const isCourseTeacher = (homework.courseId.teacherIds || []).some((teacherId) => equalIds(teacherId, userId));
	const isCourseSubstitution = (homework.courseId.substitutionIds || []).some((substitutionId) =>
		equalIds(substitutionId, userId)
	);

	const isTeacherInHomeworksCourse = isCourseTeacher === true || isCourseSubstitution === true;
	return isTeacherInHomeworksCourse;
};

/**
 * allow deletion of homework for owners in their private homeworks or for (substitution-)teachers in course homeworks
 * @param {*} userId
 * @param {*} homework
 */
function hasHomeworkPermission(userId, homework) {
	let hasPermission = isHomeworkOwner(userId, homework) === true;
	if (!hasPermission && !homework.private) {
		hasPermission = isCourseHomeworkTeacher(userId, homework) === true;
	}
	return hasPermission;
}

const populateWithCourse = (hook) => {
	// Add populate to query to be able to filter permissions
	if ((hook.params.query || {}).$populate) {
		if (!hook.params.query.$populate.includes('courseId')) {
			hook.params.query.$populate.push('courseId');
		}
	} else {
		if (!hook.params.query) {
			hook.params.query = {};
		}
		hook.params.query.$populate = ['courseId'];
	}
	return Promise.resolve(hook);
};

const hasViewPermissionAfter = (hook) => {
	// filter any other homeworks where the user has no view permission
	// user is teacher OR ( user is in courseId of task AND availableDate < Date.now() )
	const hasPermission = (homework) => {
		if (homework.private === false && !homework.courseId) {
			return false;
		}
		const userId = hook.params.account.userId.toString();
		const isTeacherCheck =
			homework.teacherId === userId || (!homework.private && isCourseHomeworkTeacher(userId, homework));
		const isStudentCheck = homework.courseId && homework.courseId.userIds && homework.courseId.userIds.includes(userId);
		const published = new Date(homework.availableDate) < new Date() && !homework.private;
		return isTeacherCheck || (isStudentCheck && published);
	};

	let homework = JSON.parse(JSON.stringify(hook.result.data || hook.result));
	if (Array.isArray(homework)) {
		homework = homework.filter(hasPermission);
	} else {
		// TODO check this
		// check if it is a single homework AND user has view permission
		if (homework.schoolId && !hasPermission(homework)) {
			return Promise.reject(new Forbidden("You don't have permissions!"));
		}
	}

	if (hook.result.data) {
		hook.result.data = homework;
		hook.result.total = homework.length;
	} else {
		hook.result = homework;
		hook.total = homework.length;
	}

	return Promise.resolve(hook);
};

const isCourseUser = (hook, homework) => {
	return ((homework.courseId || {}).userIds || []).includes(hook.params.account.userId.toString());
};

const addStats = async (hook) => {
	let data = hook.result.data || hook.result;
	const submissionService = hook.app.service('/submissions');
	const arrayed = !Array.isArray(data);
	data = Array.isArray(data) ? data : [data];

	const submissions = await submissionService.find({
		query: {
			homeworkId: { $in: data.map((n) => n._id) },
			$populate: ['courseGroupId'],
		},
		paginate: false,
	});

	data = data.map((homework) => {
		const homeworkSubmissions = submissions.filter((s) => equalIds(homework._id, s.homeworkId));
		const validSubmissions = homeworkSubmissions.filter(isValidSubmission);

		const isTeacher = hasHomeworkPermission(hook.params.account.userId, homework);
		if (!isTeacher) {
			const currentStudentSubmissions = validSubmissions.filter(
				(submission) =>
					equalIds(hook.params.account.userId, submission.studentId) ||
					(submission.teamMembers &&
						submission.teamMembers.some((userId) => equalIds(hook.params.account.userId, userId)))
			);

			homework.submissions = currentStudentSubmissions.length;

			const gradedSubmissions = currentStudentSubmissions.filter(isGraded);

			if (gradedSubmissions.length === 1) {
				homework.grade = gradedSubmissions[0].grade.toFixed(2);
			}

			homework.hasEvaluation = false;
			if (currentStudentSubmissions.filter(isGraded).length === 1) {
				homework.hasEvaluation = true;
			}
		}

		if (!homework.private && (isTeacher || (homework.publicSubmissions && isCourseUser(hook, homework)))) {
			const userCount = ((homework.courseId || {}).userIds || []).length;

			const submissionCount = validSubmissions
				.map((submission) =>
					submission.courseGroupId
						? (submission.courseGroupId.userIds || []).length || 1
						: (submission.teamMembers || []).length || 1
				)
				.reduce((a, b) => a + b, 0);

			const gradedSubmissions = homeworkSubmissions.filter(isGraded);
			const gradeCount = gradedSubmissions
				.map((submission) =>
					submission.courseGroupId
						? (submission.courseGroupId.userIds || []).length || 1
						: (submission.teamMembers || []).length || 1
				)
				.reduce((a, b) => a + b, 0);

			const getPercentage = (a, b) => {
				if (a > 0 && b > 0) {
					return ((a / b) * 100).toFixed(2);
				}
				return 0;
			};

			homework.stats = {
				userCount,
				submissionCount,
				submissionPercentage: getPercentage(submissionCount, userCount),
				gradeCount,
				gradePercentage: getPercentage(gradeCount, userCount),
				averageGrade: getAverageRating(homeworkSubmissions),
			};
		}

		return homework;
	});

	if (arrayed) {
		data = data[0];
	}

	if (hook.result.data) {
		hook.result.data = data;
	} else {
		hook.result = data;
	}

	return Promise.resolve(hook);
};

const hasPatchPermission = (hook) => {
	const homeworkService = hook.app.service('/homework');
	return homeworkService
		.get(hook.id, {
			query: { $populate: ['courseId'] },
			account: { userId: hook.params.account.userId },
		})
		.then((homework) => {
			// allow only students to archive their own homeworks
			const isStudent =
				homework.courseId &&
				homework.courseId.userIds &&
				!!homework.courseId.userIds.find((userId) => equalIds(userId, hook.params.account.userId));
			// allow this student to only change archived
			const onlyChangesArchived = Object.keys(hook.data).length === 1 && Array.isArray(hook.data.archived);

			if (isStudent && onlyChangesArchived) {
				// allow the user to only remove him/herself from the archived array (reactivate homework for this user)
				const removedStudents = homework.archived.filter(
					(studentId) => !hook.data.archived.find((stId) => equalIds(studentId, stId))
				);
				const removesOnlySelf =
					removedStudents.length === 1 && equalIds(removedStudents[0], hook.params.account.userId);

				// allow the user to only add him/herself to the archived array (archive homework for this user)
				const addedStudents = hook.data.archived.filter(
					(studentId) => !homework.archived.find((stId) => equalIds(studentId, stId))
				);
				const addsOnlySelf = addedStudents.length === 1 && equalIds(addedStudents[0], hook.params.account.userId);

				if (removesOnlySelf || addsOnlySelf) {
					return hook;
				}
			}

			// if user is a student of that course and the only
			// difference of in the archived array is the current student it, let it pass.
			if (hasHomeworkPermission(hook.params.account.userId, homework)) {
				return hook;
			}
			throw new Forbidden();
		})
		.catch((err) => {
			throw new GeneralError(
				{ message: "[500 INTERNAL ERROR] - can't reach homework service @isTeacher function" },
				err
			);
		});
};

const hasCreatePermission = async (context) => {
	const { data } = context;
	const { userId } = context.params.account;
	const { schoolId, roles } = await context.app.service('users').get(userId, { query: { $populate: 'roles' } });
	const isStudent = roles.find((r) => r.name === 'student');
	data.schoolId = schoolId;
	data.teacherId = userId;

	if (isStudent) {
		data.private = true;
		delete data.lessonId;
		delete data.courseId;
	}

	if (data.courseId) {
		const course = await context.app.service('courses').get(data.courseId);
		const userInCourse =
			course.userIds.some((id) => equalIds(id, userId)) ||
			course.teacherIds.some((id) => equalIds(id, userId)) ||
			course.substitutionIds.some((id) => equalIds(id, userId));
		if (!userInCourse) throw new NotFound('course not found');
	}

	if (data.lessonId) {
		const lesson = await context.app.service('lessons').get(data.lessonId);
		if (!(data.courseId && equalIds(lesson.courseId, data.courseId))) {
			throw new NotFound('lesson not found. did you forget to pass the correct course?');
		}
	}
	context.data = data;
};

const restrictHomeworkDeletion = async (context) => {
	// expect authenticated user
	const { userId } = context.params.account;
	if (isValidId(userId) !== true) throw new NotAuthenticated('missing a valid authenticated user id', { userId });
	// expect homeworkId given
	const homeworkId = context.id;
	if (isValidId(homeworkId) !== true) throw new NotFound('missing a valid homework id', { homeworkId });

	// expect homework to be deleted to exist
	const homeworkWithPopulatedCourse = await context.app
		.service('homework')
		.get(homeworkId, { query: { $populate: ['courseId'] } });

	if (homeworkWithPopulatedCourse === null) throw new NotFound();

	if (hasHomeworkPermission(userId, homeworkWithPopulatedCourse)) return context;

	throw new Forbidden('homework deletion failed', { homeworkId, userId });
};

const logDeletionAttempt = (context) => {
	logger.alert(`user ${context.params.account.userId} tries to delete homework ${context.id}`);
};

const logDeletionPermit = (context) => {
	logger.alert(`user ${context.params.account.userId} permitted to delete homework ${context.id}`);
};

exports.before = () => ({
	all: [authenticate('jwt')],
	find: [
		iff(isProvider('external'), [
			globalHooks.hasPermission('HOMEWORK_VIEW'),
			globalHooks.mapPaginationQuery.bind(this),
			populateWithCourse,
		]),
		globalHooks.addCollation,
	],
	get: [iff(isProvider('external'), [globalHooks.hasPermission('HOMEWORK_VIEW'), populateWithCourse])],
	create: [iff(isProvider('external'), globalHooks.hasPermission('HOMEWORK_CREATE'), hasCreatePermission)],
	update: [iff(isProvider('external'), globalHooks.hasPermission('HOMEWORK_EDIT'))],
	patch: [
		iff(isProvider('external'), [
			globalHooks.hasPermission('HOMEWORK_EDIT'),
			globalHooks.permitGroupOperation,
			hasPatchPermission,
		]),
	],
	remove: [
		iff(isProvider('external'), [
			globalHooks.hasPermission('HOMEWORK_CREATE'),
			globalHooks.permitGroupOperation,
			logDeletionAttempt,
			restrictHomeworkDeletion,
			logDeletionPermit,
		]),
	],
});

exports.after = {
	all: [],
	find: [iff(isProvider('external'), [hasViewPermissionAfter, addStats])],
	get: [iff(isProvider('external'), [hasViewPermissionAfter, addStats])],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
