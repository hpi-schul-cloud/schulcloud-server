'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');

const filterRequestedSubmissions = hook => {
	// if no db query was given, try to slim down/restrict db request
	if (Object.keys(hook.params.query).length === 0) {
		// if user is given
		//TODO: what if hook.params.account is not set?
		if (hook.params.account) {
			let userService = hook.app.service('users');
			return userService.find({
				query: {
					_id: hook.params.account.userId,
					$populate: ['roles']
				}
			}).then(res => {
				let user = res.data[0];
				user.roles.map(role => {
					// admin/superhero/teacher/demoteacher - retrieve all submissions of users school
					if ((role.permissions || []).includes("SUBMISSIONS_SCHOOL_VIEW")) {
						hook.params.query.$or = [
							{ schoolId: user.schoolId }
						];
					} else {
						// helpdesk/student/demostudent - only get users submissions
						// helpdesk will get no submissions obviously - is that okay?
						hook.params.query.$or = [
							{ studentId: user._id }
						];
					}
				});
			}).catch(err => {
				return Promise.reject(new errors.GeneralError({ "message": "[500 INTERNAL ERROR] - can't reach users service" }));
			});
		}
	}
	return hook;
};

const filterApplicableSubmissions = hook => {
    let data = hook.result.data || hook.result;
    if (hook.params.account) {
        Promise.all(data.filter(function(e) {
            let c = JSON.parse(JSON.stringify(e));
            if (typeof c.teamMembers[0] === 'object') {
                c.teamMembers = c.teamMembers.map(e => { return e._id; }); // map teamMembers list to _id list (if $populate(d) is used)
            }

            let promise;
            if (typeof c.courseGroupId === 'object') {
                promise = Promise.resolve(c.courseGroupId);
            } else if (c.courseGroupId) {
                promise = hook.app.service('courseGroups').get(c.courseGroupId);
            } else {
                promise = Promise.resolve({ userIds: [] });
            }
            return promise.then(courseGroup => {
                if (c.homeworkId.publicSubmissions // publicSubmissions allowes (everyone can see)
                    ||
                    (c.homeworkId.teacherId || {}).toString() == hook.params.account.userId.toString() // or user is teacher
                    ||
                    c.studentId.toString() == hook.params.account.userId.toString() // or is student (only needed for old tasks, in new tasks all users shoudl be in teamMembers)
                    ||
                    c.teamMembers.includes(hook.params.account.userId.toString()) // or is a teamMember
                    ||
                    courseGroup.userIds.includes(hook.params.account.userId.toString())) { // or in the courseGroup
                    return true;
                } else if (c.homeworkId.courseId) {
                    const courseService = hook.app.service('/courses');
                    return courseService.get(c.homeworkId.courseId)
                        .then(course => {
                            return ((course || {}).teacherIds || []).includes(hook.params.account.userId.toString()) // or user is teacher
                                ||
                                ((course || {}).substitutionIds || []).includes(hook.params.account.userId.toString()); // or user is substitution teacher
                        })
                        .catch(err => {
                            return Promise.reject(new errors.GeneralError({ "message": "[500 INTERNAL ERROR] - can't reach course service" }));
                        });
                } else {
                    return false;
                }
            });
        })).then(result => {
            (hook.result.data) ? (hook.result.total = data.length) : (hook.total = data.length);
            (hook.result.data) ? (hook.result.data = data) : (hook.result = data);
        });
    }
    return Promise.resolve(hook);
};

const stringifyUserId = hook => {
    if ((hook.params.account || {}).userId) {
        hook.params.account.userId = hook.params.account.userId.toString();
    }
    return Promise.resolve(hook);
};

const insertSubmissionData = hook => {
    const submissionId = hook.id || hook.data.submissionId;
    if (submissionId) {
        const submissionService = hook.app.service('/submissions');
        return submissionService.get(submissionId, { account: { userId: hook.params.account.userId } })
            .then(submission => {
                hook.data.submission = submission;
                hook.data = JSON.parse(JSON.stringify(hook.data));
                hook.data.isTeamMember = false;
                hook.data.isOwner = false;
                if (hook.data.submission.studentId._id == hook.params.account.userId) {
                    hook.data.isOwner = true;
                    hook.data.isTeamMember = true;
                }

                if ((hook.data.submission.teamMembers || []).includes(hook.params.account.userId)) {
                    hook.data.isTeamMember = true;
                }

                if (hook.data.submission.courseGroupId || hook.data.courseGroupId) {
                    hook.data.isTeamMember = true;
                    (hook.data.submission.teamMembers || []).push(hook.params.account.userId);
                }

                return Promise.resolve(hook);
            })
            .catch(err => {
                return Promise.reject(new errors.GeneralError({ "message": "[500 INTERNAL ERROR] - can't reach submission service" }));
            });
    }
    return Promise.resolve(hook);
};

const insertHomeworkData = hook => {
    const homeworkId = hook.data.homeworkId || (hook.data.submission || {}).homeworkId;
    if (homeworkId) {
        const homeworkService = hook.app.service('/homework');
        return homeworkService.get(homeworkId, { account: { userId: hook.params.account.userId } })
            .then(homework => {
                hook.data.homework = homework;
                // isTeacher?
                hook.data.isTeacher = false;
                if ((hook.data.homework.teacherId == hook.params.account.userId) ||
                    (hook.data.homework.courseId.teacherIds || []).includes(hook.params.account.userId) ||
                    (hook.data.homework.courseId.substitutionIds || []).includes(hook.params.account.userId)) {
                    hook.data.isTeacher = true;
                }
                return Promise.resolve(hook);
            })
            .catch(err => {
                return Promise.reject(new errors.GeneralError({ "message": "[500 INTERNAL ERROR] - can't reach homework service" }));
            });
    }
    return Promise.reject(new errors.BadRequest());
};

const insertSubmissionsData = hook => {
    // get all the submissions for the homework
    const submissionService = hook.app.service('/submissions');
    return submissionService.find({
            query: {
                homeworkId: hook.data.homeworkId,
                $populate: ['studentId']
            }
        }).then((submissions) => {
            hook.data.submissions = submissions.data;
            return Promise.resolve(hook);
        })
        .catch(err => {
            return Promise.reject(new errors.GeneralError({ "message": "[500 INTERNAL ERROR] - can't reach submission service" }));
        });
};

const preventNoTeamMember = hook => {
    if (!(hook.data.submission || {}).teamMembers) {
        hook.data.teamMembers = [hook.params.account.userId];
    }
    if (hook.method == "update" && (!hook.data.teamMembers || hook.data.teamMembers.length == 0)) {
        return Promise.reject(new errors.Conflict({
            "message": "Abgaben ohne TeamMember sind nicht erlaubt!"
        }));
    }
    return Promise.resolve(hook);
};

const setTeamMembers = hook => {
    if (!hook.data.teamMembers) { // if student (no grading) is going to submit without teamMembers set
        hook.data.teamMembers = [hook.params.account.userId];
    }
    if (!hook.data.teamMembers.includes(hook.params.account.userId)) {
        return Promise.reject(new errors.Conflict({
            "message": "Du kannst nicht ausschließlich für andere Abgeben. Füge dich selbst zur Abgabe hinzu!"
        }));
    }
};

const noSubmissionBefore = hook => {
    // check that no one has already submitted for the current User
    let submissionsForMe = hook.data.submissions.filter(submission => { // is there an submission for the current user?
        return (submission.teamMembers.includes(hook.params.account.userId)) ||
            ((submission.studentId || {})._id == hook.params.account.userId);
    });
    if (submissionsForMe.length > 0) {
        return Promise.reject(new errors.Conflict({
            "message": submissionsForMe[0].studentId.firstName + " " + submissionsForMe[0].studentId.lastName + " hat bereits für dich abgegeben!"
        }));
    }
    return Promise.resolve(hook);
};

const noDuplicateSubmissionForTeamMembers = hook => {
    if (!hook.data.isTeacher && hook.data.teamMembers) {
        // check if a teamMember submitted a solution on his own => display names
        let newTeamMembers = hook.data.teamMembers;
        if (hook.data.submission) {
            newTeamMembers = newTeamMembers.filter(teamMember => {
                return !hook.data.submission.teamMembers.includes(teamMember.toString());
            });
        }

        let toRemove = '';
        let submissionsForTeamMembers = hook.data.submissions.filter(submission => {
            for (var i = 0; i < newTeamMembers.length; i++) {
                const teamMember = newTeamMembers[i].toString();
                if (submission.teamMembers.includes(teamMember) ||
                    (((submission.studentId || {})._id || {}).toString() == teamMember)
                ) {
                    toRemove += (toRemove == '') ? '' : ', ';
                    toRemove += submission.studentId.firstName + ' ' + submission.studentId.lastName;
                    return true;
                }
            }
            return false;
        });
        if (submissionsForTeamMembers.length > 0) {
            return Promise.reject(new errors.Conflict({
                "message": toRemove + ((submissionsForTeamMembers.length == 1) ? ' hat' : ' haben') + ' bereits eine Lösung abgegeben! Entferne diese' + ((submissionsForTeamMembers.length == 1) ? 's Mitglied!' : ' Mitglieder!')
            }));
        } else {
            return Promise.resolve(hook);
        }
    }
};

const populateCourseGroup = hook => {
    if (!hook.data.courseGroupId) {
        return Promise.resolve(hook);
    }
    
    return hook.app.service('/courseGroups/').get(hook.data.courseGroupId).then(courseGroup => {
        hook.courseGroupTemp = courseGroup;
        return Promise.resolve(hook);
    });
};

const maxTeamMembers = hook => {
    if (!hook.data.isTeacher && hook.data.homework.teamSubmissions) {
        if ((hook.data.homework.maxTeamMembers || 0) >= 1 &&
            ((hook.data.teamMembers || []).length > hook.data.homework.maxTeamMembers) ||
            (hook.courseGroupTemp && (hook.courseGroupTemp.userIds || []).length > hook.data.homework.maxTeamMembers)) {
            return Promise.reject(new errors.Conflict({
                "message": "Dein Team ist größer als erlaubt! ( maximal " + hook.data.homework.maxTeamMembers + " Teammitglieder erlaubt)"
            }));
        }
    } else {
        if ((hook.data.teamMembers || []).length > 1) {
            return Promise.reject(new errors.Conflict({
                "message": "Teamabgaben sind nicht erlaubt!"
            }));
        }
    }
    return Promise.resolve(hook);
};

const canRemoveOwner = hook => {
    if (hook.data.teamMembers &&
        !hook.data.teamMembers.includes(hook.data.submission.studentId) &&
        !hook.data.courseGroupId) {
        if (hook.data.isOwner) {
            return Promise.reject(new errors.Conflict({
                "message": "Du hast diese Abgabe erstellt. Du darfst dich nicht selbst von dieser löschen!"
            }));
        } else {
            return Promise.reject(new errors.Conflict({
                "message": "Du darfst den Ersteller nicht von der Abgabe löschen!"
            }));
        }
    }
    return Promise.resolve(hook);
};

const canGrade = hook => {
    if (!hook.data.isTeacher &&
        (Number.isInteger(hook.data.grade) || typeof hook.data.gradeComment == "string")) { // students try to grade? BLOCK!
        return Promise.reject(new errors.Forbidden());
    } else {
        return Promise.resolve(hook);
    }
};

const hasEditPermission = hook => {
    // may check that the teacher can't edit the submission itself (only grading allowed)
    if (hook.data.isTeamMember || hook.data.isTeacher) {
        return Promise.resolve(hook);
    } else {
        return Promise.reject(new errors.Forbidden());
    }
};

const hasDeletePermission = hook => {
    if (hook.data.isTeamMember) {
        return Promise.resolve(hook);
    } else {
        return Promise.reject(new errors.Forbidden());
    }
};


exports.before = {
    all: [auth.hooks.authenticate('jwt'), stringifyUserId],
    find: [globalHooks.hasPermission('SUBMISSIONS_VIEW'), filterRequestedSubmissions, globalHooks.mapPaginationQuery.bind(this)],
    get: [globalHooks.hasPermission('SUBMISSIONS_VIEW')],
    create: [globalHooks.hasPermission('SUBMISSIONS_CREATE'), insertHomeworkData, insertSubmissionsData, setTeamMembers, noSubmissionBefore, noDuplicateSubmissionForTeamMembers, populateCourseGroup, maxTeamMembers, canGrade],
    update: [globalHooks.hasPermission('SUBMISSIONS_EDIT'), insertSubmissionData, insertHomeworkData, insertSubmissionsData, hasEditPermission, preventNoTeamMember, canRemoveOwner, noDuplicateSubmissionForTeamMembers, populateCourseGroup, maxTeamMembers, canGrade],
    patch: [globalHooks.hasPermission('SUBMISSIONS_EDIT'), insertSubmissionData, insertHomeworkData, insertSubmissionsData, hasEditPermission, preventNoTeamMember, canRemoveOwner, noDuplicateSubmissionForTeamMembers, populateCourseGroup, maxTeamMembers, globalHooks.permitGroupOperation, canGrade],
    remove: [globalHooks.hasPermission('SUBMISSIONS_CREATE'), insertSubmissionData, insertHomeworkData, insertSubmissionsData, globalHooks.permitGroupOperation, hasDeletePermission]
};

exports.after = {
    all: [],
    find: [filterApplicableSubmissions],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
};
