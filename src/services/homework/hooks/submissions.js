const { authenticate } = require('@feathersjs/authentication');
const { Forbidden, GeneralError, BadRequest, Conflict } = require('@feathersjs/errors');
const {	iff, isProvider } = require('feathers-hooks-common');

const globalHooks = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const filterRequestedSubmissions = async (context) => {
	const hasSchoolView = await globalHooks.hasPermissionNoHook(
		context, context.params.account.userId, 'SUBMISSIONS_SCHOOL_VIEW',
	);
	if (!hasSchoolView) {
		// todo: see team submissions
		context.params.query.studentId = context.params.account.userId;
	}
	return context;
};

const filterApplicableSubmissions = (context) => {
	const data = context.result.data || context.result;
	if (context.params.account) {
		Promise.all(data.filter((e) => {
			const c = JSON.parse(JSON.stringify(e));
			if (!c.teamMembers) {
				c.teamMembers = [];
			}
			if (typeof c.teamMembers[0] === 'object') {
				c.teamMembers = c.teamMembers.map((e) => e._id); // map teamMembers list to _id list (if $populate(d) is used)
			}

			let promise;
			if (typeof c.courseGroupId === 'object') {
				promise = Promise.resolve(c.courseGroupId);
			} else if (c.courseGroupId) {
				promise = context.app.service('courseGroups').get(c.courseGroupId);
			} else {
				promise = Promise.resolve({ userIds: [] });
			}
			return promise.then((courseGroup) => {
				if (c.homeworkId.publicSubmissions // publicSubmissions allowes (everyone can see)
						|| equalIds(c.homeworkId.teacherId, context.params.account.userId) // or user is teacher
						|| (c.studentId._id
							? equalIds(c.studentId._id, context.params.account.userId)
							: equalIds(c.studentId, context.params.account.userId))
						// or is student (only needed for old tasks, in new tasks all users shoudl be in teamMembers)
						|| c.teamMembers && c.teamMembers.includes(context.params.account.userId.toString()) // or is a teamMember
						|| courseGroup && courseGroup.userIds && courseGroup.userIds.includes(context.params.account.userId.toString())) { // or in the courseGroup
					return true;
				} if (c.homeworkId.courseId) {
					const courseService = context.app.service('/courses');
					return courseService.get(c.homeworkId.courseId)
						.then((course) => ((course || {}).teacherIds || []).includes(context.params.account.userId.toString()) // or user is teacher
												|| ((course || {}).substitutionIds || []).includes(context.params.account.userId.toString()), // or user is substitution teacher
						)
						.catch(() => Promise.reject(new GeneralError({ message: "can't reach course service" })));
				}
				return false;
			});
		})).then((result) => {
			(context.result.data) ? (context.result.total = data.length) : (context.total = data.length);
			(context.result.data) ? (context.result.data = data) : (context.result = data);
		});
	}
	return Promise.resolve(context);
};

const stringifyUserId = (context) => {
	if ((context.params.account || {}).userId) {
		context.params.account.userId = context.params.account.userId.toString();
	}
	return Promise.resolve(context);
};

const insertSubmissionData = (context) => {
	const submissionId = context.id || context.data.submissionId;
	if (submissionId) {
		const submissionService = context.app.service('/submissions');
		return submissionService.get(submissionId, { account: { userId: context.params.account.userId } })
			.then((submission) => {
				context.data = {
					...context.data,
					submission,
				};
				context.data = JSON.parse(JSON.stringify(context.data));
				context.data.isTeamMember = false;
				context.data.isOwner = false;
				if (context.data.submission.studentId === context.params.account.userId) {
					context.data.isOwner = true;
					context.data.isTeamMember = true;
				}

				if ((context.data.submission.teamMembers || []).includes(context.params.account.userId)) {
					context.data.isTeamMember = true;
				}

				if (context.data.submission.courseGroupId || context.data.courseGroupId) {
					context.data.isTeamMember = true;
					(context.data.submission.teamMembers || []).push(context.params.account.userId);
				}

				return Promise.resolve(context);
			})
			.catch(() => Promise.reject(new GeneralError({ message: "can't reach submission service" })));
	}
	return Promise.resolve(context);
};

const insertHomeworkData = (context) => {
	const homeworkId = context.data.homeworkId || (context.data.submission || {}).homeworkId;
	if (homeworkId) {
		const userId = context.params.account.userId.toString();
		const homeworkService = context.app.service('/homework');
		return homeworkService.get(homeworkId, {
			account: { userId },
			query: {
				$populate: ['courseId'],
			},
		})
			.then((homework) => {
				context.data.homework = homework;
				// isTeacher?
				context.data.isTeacher = false;
				if ((equalIds(context.data.homework.teacherId, userId))
					|| (context.data.homework.courseId.teacherIds || [])
						.some((teacherId) => equalIds(teacherId, userId))
					|| (context.data.homework.courseId.substitutionIds || [])
						.some((subsId) => equalIds(subsId, userId))
				) {
					context.data.isTeacher = true;
				}
				return Promise.resolve(context);
			})
			.catch(() => Promise.reject(new GeneralError({ message: "can't reach homework service" })));
	}
	return Promise.reject(new BadRequest());
};

const insertSubmissionsData = (context) => {
// get all the submissions for the homework
	const submissionService = context.app.service('/submissions');
	return submissionService.find({
		query: {
			homeworkId: context.data.homeworkId,
			$populate: ['studentId'],
		},
	}).then((submissions) => {
		context.data.submissions = submissions.data;
		return Promise.resolve(context);
	})
		.catch(() => Promise.reject(new GeneralError({ message: "can't reach submission service" })));
};

const preventNoTeamMember = (context) => {
	if (!(context.data.submission || {}).teamMembers) {
		context.data.teamMembers = [context.params.account.userId];
	}
	if (context.method == 'update' && (!context.data.teamMembers || context.data.teamMembers.length == 0)) {
		return Promise.reject(new Conflict({
			message: 'Abgaben ohne TeamMember sind nicht erlaubt!',
		}));
	}
	return Promise.resolve(context);
};

const setTeamMembers = (context) => {
	if (!context.data.teamMembers) { // if student (no grading) is going to submit without teamMembers set
		context.data.teamMembers = [context.params.account.userId];
	}
	if (!context.data.teamMembers.includes(context.params.account.userId)) {
		return Promise.reject(new Conflict({
			message: 'Du kannst nicht ausschließlich für andere Abgeben. Füge dich selbst zur Abgabe hinzu!',
		}));
	}
};

const noSubmissionBefore = (context) => {
// check that no one has already submitted for the current User
	const submissionsForMe = context.data.submissions.filter((submission) => // is there an submission for the current user?
		(submission.teamMembers.includes(context.params.account.userId))
		|| ((submission.studentId || {})._id == context.params.account.userId));
	if (submissionsForMe.length > 0) {
		return Promise.reject(new Conflict({
			message: `${submissionsForMe[0].studentId.firstName} ${submissionsForMe[0].studentId.lastName} hat bereits für dich abgegeben!`,
		}));
	}
	return Promise.resolve(context);
};

const noDuplicateSubmissionForTeamMembers = (context) => {
	if (!context.data.isTeacher && context.data.teamMembers) {
		// check if a teamMember submitted a solution on his own => display names
		let newTeamMembers = context.data.teamMembers;
		if (context.data.submission) {
			newTeamMembers = newTeamMembers.filter((teamMember) => !context.data.submission.teamMembers.includes(teamMember.toString()));
		}

		let toRemove = '';
		const submissionsForTeamMembers = context.data.submissions.filter((submission) => {
			for (let i = 0; i < newTeamMembers.length; i += 1) {
				const teamMember = newTeamMembers[i].toString();
				if (submission.teamMembers.includes(teamMember)
						|| (((submission.studentId || {})._id || {}).toString() == teamMember)
				) {
					toRemove += (toRemove == '') ? '' : ', ';
					toRemove += `${submission.studentId.firstName} ${submission.studentId.lastName}`;
					return true;
				}
			}
			return false;
		});
		if (submissionsForTeamMembers.length > 0) {
			return Promise.reject(new Conflict({
				message: `${toRemove + ((submissionsForTeamMembers.length == 1) ? ' hat' : ' haben')} bereits eine Lösung abgegeben! Entferne diese${(submissionsForTeamMembers.length == 1) ? 's Mitglied!' : ' Mitglieder!'}`,
			}));
		}
		return Promise.resolve(context);
	}
};

const populateCourseGroup = (context) => {
	if (!context.data.courseGroupId) {
		return Promise.resolve(context);
	}

	return context.app.service('/courseGroups/').get(context.data.courseGroupId).then((courseGroup) => {
		context.courseGroupTemp = courseGroup;
		return Promise.resolve(context);
	});
};

const maxTeamMembers = (context) => {
	if (!context.data.isTeacher && context.data.homework.teamSubmissions) {
		if (context.data.homework.maxTeamMembers) {
			// NOTE the following conditional is a bit hard to understand. To prevent side effects, I added a pre-conditional above.
			if ((context.data.homework.maxTeamMembers || 0) >= 1
				&& ((context.data.teamMembers || []).length > context.data.homework.maxTeamMembers)
				|| (context.courseGroupTemp && (context.courseGroupTemp.userIds || []).length > context.data.homework.maxTeamMembers)) {
				return Promise.reject(new Conflict({
					message: `Dein Team ist größer als erlaubt! ( maximal ${context.data.homework.maxTeamMembers} Teammitglieder erlaubt)`,
				}));
			}
		}
	} else if ((context.data.teamMembers || []).length > 1) {
		return Promise.reject(new Conflict({
			message: 'Teamabgaben sind nicht erlaubt!',
		}));
	}
	return Promise.resolve(context);
};

const canRemoveOwner = (context) => {
	if (context.data.teamMembers
&& !context.data.teamMembers.includes(context.data.submission.studentId)
&& !context.data.courseGroupId) {
		if (context.data.isOwner) {
			return Promise.reject(new Conflict({
				message: 'Du hast diese Abgabe erstellt. Du darfst dich nicht selbst von dieser löschen!',
			}));
		}
		return Promise.reject(new Conflict({
			message: 'Du darfst den Ersteller nicht von der Abgabe löschen!',
		}));
	}
	return Promise.resolve(context);
};

const canGrade = (context) => {
	if (!context.data.isTeacher
&& (Number.isInteger(context.data.grade) || typeof context.data.gradeComment === 'string')) { // students try to grade? BLOCK!
		return Promise.reject(new Forbidden());
	}
	return Promise.resolve(context);
};

const hasEditPermission = (context) => {
// may check that the teacher can't edit the submission itself (only grading allowed)
	if (context.data.isTeamMember || context.data.isTeacher) {
		return Promise.resolve(context);
	}
	return Promise.reject(new Forbidden());
};

const hasDeletePermission = (context) => {
	if (context.data.isTeamMember) {
		return Promise.resolve(context);
	}
	return Promise.reject(new Forbidden());
};

const hasViewPermission = async (context) => {
	const currentUserId = context.params.account.userId;

	// user is submitter
	const submissionUserId = context.result.studentId.toString();
	if (submissionUserId === currentUserId) {
		return Promise.resolve(context);
	}

	// user is team member (should only be available if team work for this homework is enabled)
	const teamMemberIds = context.result.teamMembers.map((m) => m.toString());
	if (teamMemberIds.includes(currentUserId)) {
		return Promise.resolve(context);
	}

	try {
		const homeworkService = context.app.service('/homework');
		const courseService = context.app.service('/courses');
		const homework = await homeworkService.get(context.result.homeworkId);
		const course = await courseService.get(homework.courseId);
		const teacherIds = course.teacherIds.map((t) => t.toString());
		const substitutionIds = course.substitutionIds.map((s) => s.toString())

		// user is course or substitution teacher
		if (teacherIds.includes(currentUserId) || substitutionIds.includes(currentUserId)) {
			return Promise.resolve(context);
		}

		// user is course student and submissions are public
		const courseStudentIds = course.userIds.map((u) => u.toString());
		if (courseStudentIds.includes(currentUserId) && homework.publicSubmissions) {
			return Promise.resolve(context);
		}
	} catch (err) {
		Promise.reject(new GeneralError({ message: "can't reach homework service" }));
	}

	// user is someone else and not authorized
	return Promise.reject(new Forbidden());
};

exports.before = () => ({
	all: [authenticate('jwt'), stringifyUserId],
	find: [
		iff(isProvider('external'), globalHooks.restrictToCurrentSchool),
		globalHooks.hasPermission('SUBMISSIONS_VIEW'),
		iff(isProvider('external'), filterRequestedSubmissions),
		globalHooks.mapPaginationQuery.bind(this),
	],
	get: [globalHooks.hasPermission('SUBMISSIONS_VIEW')],
	create: [
		globalHooks.hasPermission('SUBMISSIONS_CREATE'),
		insertHomeworkData, insertSubmissionsData,
		setTeamMembers,
		noSubmissionBefore,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembers,
		canGrade,
	],
	update: [
		globalHooks.hasPermission('SUBMISSIONS_EDIT'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		hasEditPermission,
		preventNoTeamMember,
		canRemoveOwner,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembers,
		canGrade],
	patch: [
		globalHooks.hasPermission('SUBMISSIONS_EDIT'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		hasEditPermission,
		preventNoTeamMember,
		canRemoveOwner,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembers,
		globalHooks.permitGroupOperation,
		canGrade,
	],
	remove: [
		globalHooks.hasPermission('SUBMISSIONS_CREATE'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		globalHooks.permitGroupOperation,
		hasDeletePermission,
	],
});

exports.after = {
	all: [],
	find: [filterApplicableSubmissions],
	get: [hasViewPermission],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
