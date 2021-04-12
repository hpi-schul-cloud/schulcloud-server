const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');

const { Forbidden, BadRequest, GeneralError, Conflict } = require('../../../errors');

const globalHooks = require('../../../hooks');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { submissionModel } = require('../model');

const filterRequestedSubmissions = async (context) => {
	const currentUserId = context.params.account.userId;

	// user is submitter
	let permissionQuery = { studentId: currentUserId };

	// user is team member and the homework is not private
	const homeworkService = context.app.service('/homework');
	const subquery = {
		$and: [{ teamMembers: { $in: currentUserId } }, { studentId: { $ne: currentUserId } }],
	};
	const subqueryResult = await submissionModel.find(subquery).exec();
	const teamMeberSubmissions = subqueryResult.map((s) => s._id);
	const subqueryHomeworkIds = subqueryResult.map((s) => s.homeworkId);
	const validHomeworks = await homeworkService.find({
		query: {
			$and: [{ _id: { $in: subqueryHomeworkIds } }, { private: { $ne: true } }],
		},
	});
	const validHomeworksIds = validHomeworks.data.map((h) => h._id);
	const andTeamMebersQuery = {
		$and: [{ _id: { $in: teamMeberSubmissions } }, { homeworkId: { $in: validHomeworksIds } }],
	};

	permissionQuery = { $or: [permissionQuery, andTeamMebersQuery] };

	// user is in course group of the submission and the homework is not private
	try {
		const courseGroupService = context.app.service('/courseGroups');
		const courseGroup = await courseGroupService.find({
			query: {
				userIds: { $in: [currentUserId] },
			},
		});
		const courseGroupIds = courseGroup.data.map((c) => c._id);
		const courseIds = courseGroup.data.map((c) => c.courseId);

		const nonPrivateHomeworks = await homeworkService.find({
			query: {
				$and: [{ courseId: { $in: courseIds } }, { private: { $ne: true } }],
			},
		});
		const nonPrivateHomeworkIds = nonPrivateHomeworks.data.map((h) => h._id);

		const andQueryCondition = {
			$and: [{ courseGroupId: { $in: courseGroupIds } }, { homeworkId: { $in: nonPrivateHomeworkIds } }],
		};

		permissionQuery = { $or: [permissionQuery, andQueryCondition] };
	} catch (err) {
		return Promise.reject(new GeneralError({ message: "can't reach course group service" }));
	}

	const courseService = context.app.service('/courses');
	// user is enrolled in a course with public submissions and the homework is not private
	try {
		const enrolledCourses = await courseService.find({
			query: {
				userIds: { $in: [currentUserId] },
			},
		});
		const enrolledCourseIds = enrolledCourses.data.map((c) => c._id);
		const accessibleHomework = await homeworkService.find({
			query: {
				$and: [{ courseId: { $in: enrolledCourseIds } }, { publicSubmissions: true }, { private: { $ne: true } }],
			},
		});
		const accessibleHomeworkIds = accessibleHomework.data.map((h) => h._id);
		permissionQuery = { $or: [permissionQuery, { homeworkId: { $in: accessibleHomeworkIds } }] };
	} catch (err) {
		return Promise.reject(new GeneralError({ message: "can't reach course service" }));
	}

	// user is responsible for this homework
	try {
		const responsibleCourses = await courseService.find({
			query: {
				$or: [{ teacherIds: { $in: [currentUserId] } }, { substitutionIds: { $in: [currentUserId] } }],
			},
		});
		const accessilbeCourseIds = responsibleCourses.data.map((c) => c._id);
		const accessibleHomework = await homeworkService.find({
			query: {
				$or: [{ teacherId: currentUserId }, { courseId: { $in: accessilbeCourseIds } }],
			},
		});
		const accessibleHomeworkIds = accessibleHomework.data.map((h) => h._id);
		permissionQuery = { $or: [permissionQuery, { homeworkId: { $in: accessibleHomeworkIds } }] };
	} catch (err) {
		return Promise.reject(new GeneralError({ message: "can't reach course service" }));
	}

	// move populates and limit from original query to new query root
	const originalQuery = context.params.query || {};
	const queryPopulates = originalQuery.$populate;
	const queryLimit = originalQuery.$limit;
	delete originalQuery.$populate;
	delete originalQuery.$limit;
	const query = { $and: [originalQuery, permissionQuery] };
	if (queryPopulates) query.$populate = queryPopulates;
	if (queryLimit) query.$limit = queryLimit;

	context.params.query = query;

	return context;
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
		return submissionService
			.get(submissionId, { account: { userId: context.params.account.userId } })
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
			.catch((err) => {
				if (err.code === 403) {
					return Promise.reject(err);
				}
				return Promise.reject(new GeneralError({ message: "can't reach submission service" }));
			});
	}
	return Promise.resolve(context);
};

const insertHomeworkData = (context) => {
	const homeworkId = context.data.homeworkId || (context.data.submission || {}).homeworkId;
	if (homeworkId) {
		const userId = context.params.account.userId.toString();
		const homeworkService = context.app.service('/homework');
		return homeworkService
			.get(homeworkId, {
				account: { userId },
				query: {
					$populate: ['courseId'],
				},
			})
			.then((homework) => {
				context.data.homework = homework;
				// isTeacher?
				context.data.isTeacher = false;
				if (
					equalIds(context.data.homework.teacherId, userId) ||
					(context.data.homework.courseId.teacherIds || []).some((teacherId) => equalIds(teacherId, userId)) ||
					(context.data.homework.courseId.substitutionIds || []).some((subsId) => equalIds(subsId, userId))
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
	return submissionService
		.find({
			query: {
				homeworkId: context.data.homeworkId,
				$select: ['teamMembers'],
				$populate: [{ path: 'studentId', select: ['_id'] }],
			},
		})
		.then((submissions) => {
			context.data.submissions = submissions.data;
			return Promise.resolve(context);
		})
		.catch(() => Promise.reject(new GeneralError({ message: "can't reach submission service" })));
};

const preventNoTeamMember = (context) => {
	if (!(context.data.submission || {}).teamMembers) {
		context.data.teamMembers = [context.params.account.userId];
	}
	if (context.method === 'update' && (!context.data.teamMembers || context.data.teamMembers.length === 0)) {
		return Promise.reject(
			new Conflict({
				message: 'Abgaben ohne TeamMember sind nicht erlaubt!',
			})
		);
	}
	return Promise.resolve(context);
};

const setTeamMembers = (context) => {
	if (!context.data.teamMembers) {
		// if student (no grading) is going to submit without teamMembers set
		context.data.teamMembers = [context.params.account.userId];
	}
	if (!context.data.teamMembers.includes(context.params.account.userId)) {
		return Promise.reject(
			new Conflict({
				message: 'Du kannst nicht ausschließlich für andere Abgeben. Füge dich selbst zur Abgabe hinzu!',
			})
		);
	}
};

const noSubmissionBefore = (context) => {
	// check that no one has already submitted for the current User
	const submissionsForMe = context.data.submissions.filter(
		(
			submission // is there an submission for the current user?
		) =>
			submission.teamMembers.includes(context.params.account.userId) ||
			(submission.studentId || {})._id == context.params.account.userId
	);
	if (submissionsForMe.length > 0) {
		return Promise.reject(
			new Conflict({
				message: 'Die Aufgabe wurde bereits abgegeben!',
			})
		);
	}
	return Promise.resolve(context);
};

const noDuplicateSubmissionForTeamMembers = (context) => {
	if (!context.data.isTeacher && context.data.teamMembers) {
		// check if a teamMember submitted a solution on his own => display names
		let newTeamMembers = context.data.teamMembers;
		if (context.data.submission) {
			newTeamMembers = newTeamMembers.filter(
				(teamMember) => !context.data.submission.teamMembers.includes(teamMember.toString())
			);
		}

		const submissionsForTeamMembers = context.data.submissions.filter((submission) => {
			for (let i = 0; i < newTeamMembers.length; i += 1) {
				const teamMember = newTeamMembers[i].toString();
				if (
					submission.teamMembers.includes(teamMember) ||
					((submission.studentId || {})._id || {}).toString() == teamMember
				) {
					return true;
				}
			}
			return false;
		});
		if (submissionsForTeamMembers.length > 0) {
			return Promise.reject(
				new Conflict({
					message:
						`${
							submissionsForTeamMembers.length +
							(submissionsForTeamMembers.length === 1 ? ' Mitglied hat' : ' Mitglieder haben')
						} bereits eine Lösung abgegeben!` +
						` Entferne diese ${submissionsForTeamMembers.length === 1 ? 's Mitglied!' : ' Mitglieder!'}`,
				})
			);
		}
		return Promise.resolve(context);
	}
};

const populateCourseGroup = (context) => {
	if (!context.data.courseGroupId) {
		return Promise.resolve(context);
	}

	return context.app
		.service('/courseGroups/')
		.get(context.data.courseGroupId)
		.then((courseGroup) => {
			context.courseGroupTemp = courseGroup;
			return Promise.resolve(context);
		});
};

const maxTeamMembers = (context) => {
	if (!context.data.isTeacher && context.data.homework.teamSubmissions) {
		if (context.data.homework.maxTeamMembers) {
			// NOTE the following conditional is a bit hard to understand. To prevent side effects, I added a pre-conditional above.
			if (
				((context.data.homework.maxTeamMembers || 0) >= 1 &&
					(context.data.teamMembers || []).length > context.data.homework.maxTeamMembers) ||
				(context.courseGroupTemp &&
					(context.courseGroupTemp.userIds || []).length > context.data.homework.maxTeamMembers)
			) {
				return Promise.reject(
					new Conflict({
						message: `Dein Team ist größer als erlaubt! ( maximal ${context.data.homework.maxTeamMembers} Teammitglieder erlaubt)`,
					})
				);
			}
		}
	} else if ((context.data.teamMembers || []).length > 1) {
		return Promise.reject(
			new Conflict({
				message: 'Teamabgaben sind nicht erlaubt!',
			})
		);
	}
	return Promise.resolve(context);
};

const canRemoveOwner = (context) => {
	if (
		context.data.teamMembers &&
		!context.data.teamMembers.includes(context.data.submission.studentId) &&
		!context.data.courseGroupId
	) {
		if (context.data.isOwner) {
			return Promise.reject(
				new Conflict({
					message: 'Du hast diese Abgabe erstellt. Du darfst dich nicht selbst von dieser löschen!',
				})
			);
		}
		return Promise.reject(
			new Conflict({
				message: 'Du darfst den Ersteller nicht von der Abgabe löschen!',
			})
		);
	}
	return Promise.resolve(context);
};

const canGrade = (context) => {
	if (
		!context.data.isTeacher &&
		(Number.isInteger(context.data.grade) || typeof context.data.gradeComment === 'string')
	) {
		// students try to grade? BLOCK!
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

const hasViewPermission = async (context, submission, currentUserId) => {
	// user is submitter
	// const submissionUserId = submission.studentId.toString();
	if (equalIds(submission.studentId, currentUserId)) {
		return submission;
	}

	// user is team member (should only be available if team work for this homework is enabled)
	const teamMemberIds = submission.teamMembers ? submission.teamMembers.map((m) => m.toString()) : [];
	if (teamMemberIds.includes(currentUserId)) {
		return submission;
	}

	try {
		const homeworkService = context.app.service('/homework');
		const homework = await homeworkService.get(submission.homeworkId);
		// is private teacher homework
		if (equalIds(homework.teacherId, currentUserId)) {
			return submission;
		}

		if (homework.courseId) {
			const courseService = context.app.service('/courses');
			const course = await courseService.get(homework.courseId);
			const teacherIds = course.teacherIds.map((t) => t.toString());
			const substitutionIds = (course.substitutionIds || []).map((s) => s.toString());

			// user is course or substitution teacher
			if (teacherIds.includes(currentUserId) || substitutionIds.includes(currentUserId)) {
				return submission;
			}

			// user is course student and submissions are public
			const courseStudentIds = course.userIds.map((u) => u.toString());
			if (courseStudentIds.includes(currentUserId) && homework.publicSubmissions) {
				return submission;
			}
		}

		// user is part of a courseGroup
		if (submission.courseGroupId) {
			const courseGroupService = context.app.service('/courseGroups');
			const courseGroup = await courseGroupService.get(submission.courseGroupId);
			const courseGroupStudents = courseGroup.userIds.map((u) => u.toString());
			if (courseGroupStudents.includes(currentUserId)) {
				return submission;
			}
		}
	} catch (err) {
		return Promise.reject(new GeneralError({ message: "can't reach homework service" }));
	}

	// user is someone else and not authorized
	return Promise.resolve();
};

const checkGetSubmissionViewPermission = async (context) => {
	const currentUserId = context.params.account.userId;

	const hasViewPermissionResult = await hasViewPermission(context, context.result, currentUserId);
	if (hasViewPermissionResult) {
		return context;
	}
	// user is someone else and not authorized
	throw new Forbidden();
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
		insertHomeworkData,
		insertSubmissionsData,
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
		canGrade,
	],
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
	find: [],
	get: [checkGetSubmissionViewPermission],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
