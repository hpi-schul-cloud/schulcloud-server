const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const logger = require('winston');

const globalHooks = require('../../../hooks');

const getAverageRating = function (submissions) {
	// Durchschnittsnote berechnen
	if (submissions.length > 0) {
		// Nur bewertete Abgaben einbeziehen
		const submissiongrades = submissions.filter(s => Number.isInteger(s.grade));
		// Abgabe für jedes Teammitglied einzeln werten
		let numSubmissions = 0;
		let gradeSum = 0;
		submissiongrades.forEach((e) => {
			if (e.courseGroupId && (e.courseGroupId.userIds || []) > 0) {
				numSubmissions += e.courseGroupId.userIds.length;
				gradeSum += (e.courseGroupId.userIds * e.grade);
			} else if (e.teamMembers && e.teamMembers.length > 0) {
				numSubmissions += e.teamMembers.length;
				gradeSum += (e.teamMembers.length * e.grade);
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
	return (submission.comment && submission.comment !== '')
        || (submission.fileIds && submission.fileIds.length > 0);
}
function isGraded(submission) {
	return (submission.gradeComment && submission.gradeComment !== '')
        || (submission.grade && Number.isInteger(submission.grade));
}
function isTeacher(userId, homework) {
	const user = userId.toString();
	let isTeacherCheck = (homework.teacherId.toString() === user);
	if (!isTeacherCheck && !homework.private) {
		const isCourseTeacher = homework.courseId.teacherIds.includes(user);
		const isCourseSubstitution = homework.courseId.substitutionIds.includes(user);
		isTeacherCheck = isCourseTeacher || isCourseSubstitution;
	}
	return isTeacherCheck;
}

const hasViewPermissionBefore = (hook) => {
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
	// availableDate < Date.now()
	function hasPermission(e) {
		const isTeacherCheck = (e.teacherId === (hook.params.account || {}).userId.toString())
            || (!e.private && ((e.courseId || {}).teacherIds || []).includes((hook.params.account || {}).userId.toString()))
            || (!e.private && ((e.courseId || {}).substitutionIds || []).includes((hook.params.account || {}).userId.toString()));
		const isStudent = ((e.courseId != null)
            && ((e.courseId || {}).userIds || []).includes(((hook.params.account || {}).userId || '').toString()));
		const published = ((new Date(e.availableDate) < new Date())) && !e.private;
		return isTeacherCheck || (isStudent && published);
	}

	let data = JSON.parse(JSON.stringify(hook.result.data || hook.result));
	if (data[0] !== undefined) {
		data = data.filter(hasPermission);
	} else {
		// check if it is a single homework AND user has view permission
		if (data.schoolId != undefined && !hasPermission(data)) {
			return Promise.reject(new errors.Forbidden("You don't have permissions!"));
		}
	}
	(hook.result.data) ? (hook.result.data = data) : (hook.result = data);
	(hook.result.data) ? (hook.result.total = data.length) : (hook.total = data.length);
	return Promise.resolve(hook);
};

const addStats = (hook) => {
	let data = hook.result.data || hook.result;
	const submissionService = hook.app.service('/submissions');
	const arrayed = !(Array.isArray(data));
	data = (Array.isArray(data)) ? (data) : ([data]);
	return submissionService.find({
		query: {
			homeworkId: { $in: (data.map(n => n._id)) },
			$populate: ['courseGroupId'],
		},
	}).then((submissions) => {
		data = data.map((e) => {
			const c = JSON.parse(JSON.stringify(e)); // don't know why, but without this line it's not working :/

			// save grade in assignment if user is student of this task
			const submission = submissions.data.filter(s => ((c._id.toString() == s.homeworkId.toString()) && (s.grade)));
			if (submission.length == 1 && !isTeacher(hook.params.account.userId, c)) {
				c.grade = submission[0].grade;
			}

			if (!c.private && (
				(((c.courseId || {}).userIds || []).includes(hook.params.account.userId.toString()) && c.publicSubmissions)
                || isTeacher(hook.params.account.userId, c))) {
				const NumberOfCourseMembers = ((c.courseId || {}).userIds || []).length;
				const currentSubmissions = submissions.data.filter(submission => c._id.toString() == submission.homeworkId.toString());
				const validSubmissions = currentSubmissions.filter(isValidSubmission);
				const gradedSubmissions = currentSubmissions.filter(isGraded);
				const NumberOfUsersWithSubmission = validSubmissions.map(e => (e.courseGroupId ? ((e.courseGroupId.userIds || []).length || 1) : ((e.teamMembers || []).length || 1))).reduce((a, b) => a + b, 0);

				const NumberOfGradedUsers = gradedSubmissions.map(e => (e.courseGroupId ? ((e.courseGroupId.userIds || []).length || 1) : ((e.teamMembers || []).length || 1))).reduce((a, b) => a + b, 0);
				const submissionPerc = (NumberOfUsersWithSubmission / NumberOfCourseMembers) * 100;
				const gradePerc = (NumberOfGradedUsers / NumberOfCourseMembers) * 100;

				c.stats = {
					userCount: ((c.courseId || {}).userIds || []).length,
					submissionCount: NumberOfUsersWithSubmission,
					submissionPercentage: (submissionPerc != Infinity) ? submissionPerc.toFixed(2) : undefined,
					gradeCount: NumberOfGradedUsers,
					gradePercentage: (gradePerc != Infinity) ? gradePerc.toFixed(2) : undefined,
					averageGrade: getAverageRating(currentSubmissions),
				};
				c.isTeacher = isTeacher(hook.params.account.userId, c);
			}
			return c;
		});
		if (arrayed) { data = data[0]; }
		(hook.result.data) ? (hook.result.data = data) : (hook.result = data);
		return Promise.resolve(hook);
	});
};

const hasPatchPermission = (hook) => {
	const homeworkService = hook.app.service('/homework');
	return homeworkService.get(hook.id, {
		query: { $populate: ['courseId'] },
		account: { userId: hook.params.account.userId },
	}).then((homework) => {
		// allow only students to archive their own homeworks
		const isStudent = homework.courseId && homework.courseId.userIds && !!homework.courseId.userIds.find(userId => userId.toString() === hook.params.account.userId.toString());
		// allow this student to only change archived
		const onlyChangesArchived = Object.keys(hook.data).length === 1
            && Array.isArray(hook.data.archived);

		if (isStudent && onlyChangesArchived) {
			// allow the user to only remove him/herself from the archived array (reactivate homework for this user)
			const removedStudents = homework.archived.filter(studentId => !hook.data.archived.find(stId => studentId.toString() === stId.toString()));
			const removesOnlySelf = removedStudents.length === 1
                && removedStudents[0].toString() === hook.params.account.userId.toString();

			// allow the user to only add him/herself to the archived array (archive homework for this user)
			const addedStudents = hook.data.archived.filter(studentId => !homework.archived.find(stId => studentId.toString() === stId.toString()));
			const addsOnlySelf = addedStudents.length === 1
                && addedStudents[0].toString() === hook.params.account.userId.toString();

			if (removesOnlySelf || addsOnlySelf) {
				return Promise.resolve(hook);
			}
		}

		// if user is a student of that course and the only difference of in the archived array is the current student it, let it pass.
		if (isTeacher(hook.params.account.userId, homework)) {
			return Promise.resolve(hook);
		}
		return Promise.reject(new errors.Forbidden());
	})
		.catch((err) => {
			logger.warn(err);
			return Promise.reject(new errors.GeneralError({ message: "[500 INTERNAL ERROR] - can't reach homework service @isTeacher function" }));
		});
};

exports.before = () => ({
	all: [auth.hooks.authenticate('jwt')],
	find: [
		globalHooks.hasPermission('HOMEWORK_VIEW'),
		globalHooks.mapPaginationQuery.bind(this),
		hasViewPermissionBefore,
	],
	get: [globalHooks.hasPermission('HOMEWORK_VIEW'), hasViewPermissionBefore],
	create: [globalHooks.hasPermission('HOMEWORK_CREATE')],
	update: [globalHooks.hasPermission('HOMEWORK_EDIT')],
	patch: [globalHooks.hasPermission('HOMEWORK_EDIT'), globalHooks.permitGroupOperation, hasPatchPermission],
	remove: [globalHooks.hasPermission('HOMEWORK_CREATE'), globalHooks.permitGroupOperation],
});

exports.after = {
	all: [],
	find: [hasViewPermissionAfter, addStats],
	get: [hasViewPermissionAfter, addStats],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
