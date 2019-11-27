const { authenticate } = require('@feathersjs/authentication');
const { BadRequest, Conflict, Forbidden } = require('@feathersjs/errors');

const globalHooks = require('../../../hooks');

const filterRequestedSubmissions = (context) => {
// if no db query was given, try to slim down/restrict db request
	if (Object.keys(context.params.query).length !== 0) {
		return context;
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
/* code do not return any
const filterApplicableSubmissions = (hook) => {
	const data = hook.result.data || hook.result;
	if (hook.params.account) {
		Promise.all(data.filter((e) => {
			const c = JSON.parse(JSON.stringify(e));
			if (!c.teamMembers) {
				c.teamMembers = [];
			}
			if (typeof c.teamMembers[0] === 'object') {
				// map teamMembers list to _id list (if $populate(d) is used)
				c.teamMembers = c.teamMembers.map((e) => e._id);
			}

			let promise;
			if (typeof c.courseGroupId === 'object') {
				promise = Promise.resolve(c.courseGroupId);
			} else if (c.courseGroupId) {
				promise = hook.app.service('courseGroups').get(c.courseGroupId);
			} else {
				promise = Promise.resolve({ userIds: [] });
			}

			return promise.then((courseGroup) => {
				if (c.homeworkId.publicSubmissions // publicSubmissions allowes (everyone can see)
						|| equalIds(c.homeworkId.teacherId, hook.params.account.userId) // or user is teacher
						|| (c.studentId._id
							? equalIds(c.studentId._id, hook.params.account.userId)
							: equalIds(c.studentId, hook.params.account.userId))
						// or is student (only needed for old tasks, in new tasks all users shoudl be in teamMembers)
						|| c.teamMembers && c.teamMembers.includes(hook.params.account.userId.toString()) // or is a teamMember
						|| courseGroup && courseGroup.userIds && courseGroup.userIds.includes(hook.params.account.userId.toString())) { // or in the courseGroup
					return true;
				} if (c.homeworkId.courseId) {
					const courseService = hook.app.service('/courses');
					return courseService.get(c.homeworkId.courseId)
						.then((course) => ((course || {}).teacherIds || []).includes(hook.params.account.userId.toString()) // or user is teacher
												|| ((course || {}).substitutionIds || []).includes(hook.params.account.userId.toString()), // or user is substitution teacher
						)
						.catch((err) => Promise.reject(new BadRequest({ message: "can't reach course service" })));
				}
				return false;
			});
		})).then(() => {
			(hook.result.data) ? (hook.result.total = data.length) : (hook.total = data.length);
			(hook.result.data) ? (hook.result.data = data) : (hook.result = data);
		});
	}
	return Promise.resolve(hook);
};
*/
const stringifyUserId = (hook) => {
	if ((hook.params.account || {}).userId) {
		const currentUserId = hook.params.account.userId.toString();
		hook.params.currentUserId = currentUserId;
		hook.params.account.userId = currentUserId;
	}
	return Promise.resolve(hook);
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
		return Promise.reject(new Conflict({
			message: 'Abgaben ohne TeamMember sind nicht erlaubt!',
		}));
	}
	return Promise.resolve(context);
};

const setTeamMembers = (context) => {
	if (!context.data.teamMembers) { // if student (no grading) is going to submit without teamMembers set
		context.data.teamMembers = [context.params.currentUserId];
	}
	if (!context.data.teamMembers.includes(context.params.currentUserId)) {
		Promise.reject(new Conflict({
			message: 'Du kannst nicht ausschließlich für andere Abgeben. Füge dich selbst zur Abgabe hinzu!',
		}));
	}
	return Promise.resolve(context);
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
		return Promise.reject(new Conflict({ message }));
	}
	return Promise.resolve(context);
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
		return Promise.resolve(context);
	}
	return Promise.resolve(context);
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
	if (!context.data.isTeacher && context.data.homework.teamSubmissions) {
		const { maxTeamMembers } = context.data.homework;
		if (maxTeamMembers) {
			// NOTE the following conditional is a bit hard to understand. 
			// To prevent side effects, I added a pre-conditional above.
			if ((maxTeamMembers || 0) >= 1
				&& ((context.data.teamMembers || []).length > maxTeamMembers)
				|| (context.courseGroupTemp && (context.courseGroupTemp.userIds || []).length > maxTeamMembers)) {
				return Promise.reject(new Conflict({
					message: `Dein Team ist größer als erlaubt! ( maximal ${maxTeamMembers} Teammitglieder erlaubt)`,
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

const canRemoveOwner = (hook) => {
	if (hook.data.teamMembers
&& !hook.data.teamMembers.includes(hook.data.submission.studentId)
&& !hook.data.courseGroupId) {
		if (hook.data.isOwner) {
			return Promise.reject(new Conflict({
				message: 'Du hast diese Abgabe erstellt. Du darfst dich nicht selbst von dieser löschen!',
			}));
		}
		return Promise.reject(new Conflict({
			message: 'Du darfst den Ersteller nicht von der Abgabe löschen!',
		}));
	}
	return Promise.resolve(hook);
};

const canGrade = (hook) => {
	if (!hook.data.isTeacher
&& (Number.isInteger(hook.data.grade) || typeof hook.data.gradeComment === 'string')) { // students try to grade? BLOCK!
		return Promise.reject(new Forbidden());
	}
	return Promise.resolve(hook);
};

const hasEditPermission = (hook) => {
// may check that the teacher can't edit the submission itself (only grading allowed)
	if (hook.data.isTeamMember || hook.data.isTeacher) {
		return Promise.resolve(hook);
	}
	return Promise.reject(new Forbidden());
};

const hasDeletePermission = (hook) => {
	if (hook.data.isTeamMember) {
		return Promise.resolve(hook);
	}
	return Promise.reject(new Forbidden());
};

exports.before = () => ({
	all: [authenticate('jwt'), stringifyUserId],
	find: [
		globalHooks.hasPermission('SUBMISSIONS_VIEW'),
		filterRequestedSubmissions,
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
		maxTeamMembersHook,
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
		maxTeamMembersHook,
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
		maxTeamMembersHook,
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
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
