const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, Conflict, Forbidden } = require('@feathersjs/errors');

const { hasPermission, mapPaginationQuery } = require('../../../hooks');

const filterRequestedSubmissions = (context) => {
// if no db query was given, try to slim down/restrict db request
	if (Object.keys(context.params.query).length !== 0) {
		return Promise.resolve(context);
	}

	const { currentUserId } = context.params;

	return context.app.service('users')
		.get(currentUserId, {
			query: {
				$populate: ['roles'],
			},
		}).then((user) => {
			user.roles.forEach((role) => {
			// admin/superhero/teacher/demoteacher - retrieve all submissions of users school
				if ((role.permissions || []).includes('SUBMISSIONS_SCHOOL_VIEW')) {
					context.params.query.$or = [
						{ schoolId: user.schoolId },
					];
				} else {
				// helpdesk/student/demostudent - only get users submissions
				// helpdesk will get no submissions obviously - is that okay?
					context.params.query.$or = [
						{ studentId: user._id },
					];
				}
			});
			return context;
		}).catch((err) => {
			throw new BadRequest({ message: "can't reach users service" }, err);
		});
};

const stringifyUserId = (context) => {
	if ((context.params.account || {}).userId) {
		const currentUserId = context.params.account.userId.toString();
		context.params.currentUserId = currentUserId;
		context.params.account.userId = currentUserId;
	}
	return context;
};

// Add status of requester in context of this requested submission
// This is used to validate the permissions in later hooks
const insertSubmissionData = (context) => {
	const submissionId = context.id || context.data.submissionId;
	const { currentUserId } = context.params;

	if (submissionId) {
		return context.app.service('/submissions')
			.get(submissionId, { account: { userId: currentUserId } })
			.then((submission) => {
				const newData = {
					...context.data,
					submission,
				};
				// parse all bsonIds to id strings
				context.data = JSON.parse(JSON.stringify(newData));
				context.data.isTeamMember = false;
				context.data.isOwner = false;

				if (context.data.submission.studentId === currentUserId) {
					context.data.isOwner = true;
					context.data.isTeamMember = true;
				}

				if ((context.data.submission.teamMembers || []).includes(currentUserId)) {
					context.data.isTeamMember = true;
				}

				if (context.data.submission.courseGroupId || context.data.courseGroupId) {
					context.data.isTeamMember = true;
					(context.data.submission.teamMembers || []).push(currentUserId);
				}

				return context;
			})
			.catch((err) => {
				throw new BadRequest("can't reach submission service", err);
			});
	}
	return Promise.resolve(context);
};

// Additional to insertSubmissionData it check if requester is teacher or not and add it to data.
const insertHomeworkData = (context) => {
	const homeworkId = context.data.homeworkId || (context.data.submission || {}).homeworkId;
	const { currentUserId } = context.params;
	if (homeworkId) {
		return context.app.service('/homework')
			.get(homeworkId, { account: { userId: currentUserId } })
			.then((homework) => {
				// parse all bsonIds to id strings
				context.data.homework = JSON.parse(JSON.stringify(homework));
				context.data.isTeacher = false;
				if ((homework.teacherId === currentUserId)
						|| (homework.courseId.teacherIds || []).includes(currentUserId)
						|| (homework.courseId.substitutionIds || []).includes(currentUserId)) {
					context.data.isTeacher = true;
				}
				return context;
			})
			.catch((err) => {
				throw new BadRequest("can't reach homework service", err);
			});
	}
	return Promise.reject(new BadRequest('No homeworkId exist.'));
};

// get all the submissions for the homework
const insertSubmissionsData = (context) => context.app.service('/submissions')
	.find({
		query: {
			homeworkId: context.data.homeworkId,
			$populate: ['studentId'],
		},
	}).then((submissions) => {
		context.data.submissions = submissions.data;
		return context;
	}).catch((err) => {
		throw new BadRequest("can't reach submission service", err);
	});


const preventNoTeamMember = (context) => {
	const {
		data,
		method,
		params: { currentUserId },
	} = context;

	if (!(data.submission || {}).teamMembers) {
		context.data.teamMembers = [currentUserId];
	}
	if (method === 'update' && (!data.teamMembers || data.teamMembers.length === 0)) {
		throw new Conflict({
			message: 'Abgaben ohne TeamMember sind nicht erlaubt!',
		});
	}
	return context;
};

const setTeamMembers = (context) => {
	if (!context.data.teamMembers) { // if student (no grading) is going to submit without teamMembers set
		context.data.teamMembers = [context.params.currentUserId];
	}
	if (!context.data.teamMembers.includes(context.params.currentUserId)) {
		throw new Conflict({
			message: 'Du kannst nicht ausschließlich für andere Abgeben. Füge dich selbst zur Abgabe hinzu!',
		});
	}
	return context;
};

const noSubmissionBefore = (context) => {
	// check that no one has already submitted for the current User
	// is there an submission for the current user?
	const { currentUserId } = context.params;
	const submissionsForMe = context.data.submissions.filter(
		(submission) => (submission.teamMembers.includes(currentUserId))
		|| ((submission.studentId || {})._id === currentUserId),
	);
	if (submissionsForMe.length > 0) {
		const { firstName, lastName } = submissionsForMe[0].studentId;
		const message = `${firstName} ${lastName} hat bereits für dich abgegeben!`;
		throw new Conflict({ message });
	}
	return context;
};

const noDuplicateSubmissionForTeamMembers = (context) => {
	if (!context.data.isTeacher && context.data.teamMembers) {
		// check if a teamMember submitted a solution on his own => display names
		let newTeamMembers = context.data.teamMembers;
		if (context.data.submission) {
			newTeamMembers = newTeamMembers.filter(
				(teamMember) => !context.data.submission.teamMembers.includes(teamMember.toString()),
			);
		}

		let toRemove = '';
		const submissionsForTeamMembers = context.data.submissions.filter((submission) => {
			for (let i = 0; i < newTeamMembers.length; i += 1) {
				const teamMember = newTeamMembers[i].toString();
				if (submission.teamMembers.includes(teamMember)
						|| (((submission.studentId || {})._id || {}).toString() === teamMember)
				) {
					toRemove += (toRemove === '') ? '' : ', ';
					toRemove += `${submission.studentId.firstName} ${submission.studentId.lastName}`;
					return true;
				}
			}
			return false;
		});
		if (submissionsForTeamMembers.length > 0) {
			const isOne = submissionsForTeamMembers.length === 1;
			const message = `${toRemove + (isOne ? ' hat' : ' haben')} bereits eine Lösung abgegeben! `
			+ `Entferne diese${isOne ? 's Mitglied!' : ' Mitglieder!'}`;
			throw new Conflict({ message });
		}
	}
	return context;
};

const populateCourseGroup = (context) => {
	if (!context.data.courseGroupId) {
		return Promise.resolve(context);
	}

	return context.app.service('/courseGroups/')
		.get(context.data.courseGroupId)
		.then((courseGroup) => {
			context.courseGroupTemp = courseGroup;
			return context;
		});
};

const maxTeamMembersHook = (context) => {
	const teamMembers = (context.data.teamMembers || []).length;
	if (!context.data.isTeacher && context.data.homework.teamSubmissions) {
		const { maxTeamMembers } = context.data.homework;

		if (maxTeamMembers) {
			const courseGroupTempUserIds = context.courseGroupTemp && (context.courseGroupTemp.userIds || []).length;
			// NOTE the following conditional is a bit hard to understand.
			// To prevent side effects, I added a pre-conditional above.
			const homeworkTeamMemberExist = (maxTeamMembers || 0) >= 1;
			const newTeamMemberMoreThenAllowed = teamMembers > maxTeamMembers;
			const moreThenUserInTempGroup = courseGroupTempUserIds > maxTeamMembers;

			if (homeworkTeamMemberExist && (newTeamMemberMoreThenAllowed || moreThenUserInTempGroup)) {
				throw new Conflict({
					message: `Dein Team ist größer als erlaubt! ( maximal ${maxTeamMembers} Teammitglieder erlaubt)`,
				});
			}
		}
	} else if (teamMembers > 1) {
		throw new Conflict({
			message: 'Teamabgaben sind nicht erlaubt!',
		});
	}
	return context;
};

const canRemoveOwner = (context) => {
	const {
		teamMembers, submission, courseGroupId, isOwner,
	} = context.data;

	if (teamMembers && !teamMembers.includes(submission.studentId) && !courseGroupId) {
		if (isOwner) {
			throw new Conflict({
				message: 'Du hast diese Abgabe erstellt. Du darfst dich nicht selbst von dieser löschen!',
			});
		}
		throw new Conflict({
			message: 'Du darfst den Ersteller nicht von der Abgabe löschen!',
		});
	}
	return context;
};

const canGrade = (context) => {
	const { gradeComment, grade, isTeacher } = context;
	if (!isTeacher && (Number.isInteger(grade) || typeof gradeComment === 'string')) { // students try to grade? BLOCK!
		throw new Forbidden();
	}
	return context;
};

const hasEditPermission = (context) => {
// may check that the teacher can't edit the submission itself (only grading allowed)
	if (context.data.isTeamMember || context.data.isTeacher) {
		return context;
	}
	throw new Forbidden();
};

const hasDeletePermission = (context) => {
	if (context.data.isTeamMember) {
		return context;
	}
	throw new Forbidden();
};

exports.before = () => ({
	all: [authenticate('jwt'), stringifyUserId],
	find: [
		hasPermission('SUBMISSIONS_VIEW'),
		filterRequestedSubmissions,
		mapPaginationQuery.bind(this),
	],
	get: [hasPermission('SUBMISSIONS_VIEW')],
	create: [
		hasPermission('SUBMISSIONS_CREATE'),
		insertHomeworkData, insertSubmissionsData,
		setTeamMembers,
		noSubmissionBefore,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembersHook,
		canGrade,
	],
	update: [
		hasPermission('SUBMISSIONS_EDIT'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		hasEditPermission,
		preventNoTeamMember,
		canRemoveOwner,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembersHook,
		canGrade],
	patch: [
		hasPermission('SUBMISSIONS_EDIT'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		hasEditPermission,
		preventNoTeamMember,
		canRemoveOwner,
		noDuplicateSubmissionForTeamMembers,
		populateCourseGroup,
		maxTeamMembersHook,
		//	globalHooks.permitGroupOperation,
		canGrade,
	],
	remove: [
		hasPermission('SUBMISSIONS_CREATE'),
		insertSubmissionData,
		insertHomeworkData,
		insertSubmissionsData,
		//	globalHooks.permitGroupOperation,
		hasDeletePermission,
	],
});

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
