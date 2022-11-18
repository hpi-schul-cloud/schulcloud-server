import { MikroORM } from '@mikro-orm/core';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	schoolFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';

describe('Task Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('isDraft is called', () => {
		describe('when task is draft', () => {
			const setup = () => {
				const task = taskFactory.draft().buildWithId();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isDraft()).toEqual(true);
			});
		});

		describe('when task is not a draft', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isDraft()).toEqual(false);
			});
		});

		describe('when task private status is undefined', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();
				Object.assign(task, { private: undefined });

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isDraft()).toEqual(false);
			});
		});
	});

	describe('isPublished', () => {
		describe('when task isPublished', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task is a draft', () => {
			const setup = () => {
				const task = taskFactory.draft().buildWithId();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is not reached', () => {
			const setup = () => {
				const task = taskFactory.isPlanned().buildWithId();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is reached', () => {
			const setup = () => {
				const task = taskFactory.isPublished().buildWithId();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task avaible is not defined', () => {
			const setup = () => {
				const task = taskFactory.buildWithId({ availableDate: undefined });

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});
	});

	describe('areSubmissionsPublic', () => {
		it('should return false if publicSubmissions is undefined', () => {
			const task = taskFactory.buildWithId();

			const result = task.areSubmissionsPublic();

			expect(result).toBe(false);
		});

		it('should return false if publicSubmissions is false', () => {
			const task = taskFactory.buildWithId({ publicSubmissions: false });

			const result = task.areSubmissionsPublic();

			expect(result).toBe(false);
		});

		it('should return false if publicSubmissions is true', () => {
			const task = taskFactory.buildWithId({ publicSubmissions: true });

			const result = task.areSubmissionsPublic();

			expect(result).toBe(true);
		});
	});

	describe('isPlanned', () => {
		describe('when task is a draft', () => {
			const setup = () => {
				const task = taskFactory.draft().buildWithId();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPlanned()).toEqual(false);
			});
		});

		describe('when task available Date is not reached', () => {
			const setup = () => {
				const task = taskFactory.isPlanned().buildWithId();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPlanned()).toEqual(true);
			});
		});

		describe('when task available Date is reached', () => {
			const setup = () => {
				const task = taskFactory.isPublished().buildWithId();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPlanned()).toEqual(false);
			});
		});

		describe('when task available Date is undefined', () => {
			const setup = () => {
				const task = taskFactory.buildWithId({ availableDate: undefined });

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPlanned()).toEqual(false);
			});
		});
	});

	describe('createTeacherStatusForUser is called', () => {
		describe('when parent is a user', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				return { task, user };
			};

			it('should be create correct status with maxSubmissions = 1', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.maxSubmissions).toEqual(1);
			});
		});

		describe('when parent is a course', () => {
			const setup = () => {
				const maxSubmission = 3;
				const user = userFactory.buildWithId();
				const course = courseFactory.studentsWithId(maxSubmission).buildWithId();
				const task = taskFactory.buildWithId({ creator: user, course });

				return { task, user, maxSubmission };
			};

			it('should be create correct status with maxSubmissions of course students', () => {
				const { task, user, maxSubmission } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.maxSubmissions).toEqual(maxSubmission);
			});

			// unique
		});

		// bad to split it in coursegroup lesson and course lesson,
		// but we have no test case as fallback for this situations in code
		describe('when parent is a lesson in a coursegroup', () => {
			const setup = () => {
				const maxSubmission = 3;
				const user = userFactory.buildWithId();
				const courseGroup = courseGroupFactory.studentsWithId(maxSubmission).buildWithId();
				const lesson = lessonFactory.buildWithId({ courseGroup });
				const task = taskFactory.buildWithId({ creator: user, lesson });

				return { task, user, maxSubmission };
			};

			it('should be create correct status with maxSubmissions of coursegroup students', () => {
				const { task, user, maxSubmission } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.maxSubmissions).toEqual(maxSubmission);
			});
		});

		describe('when parent is a lesson in a course', () => {
			const setup = () => {
				const maxSubmission = 3;
				const user = userFactory.buildWithId();
				const course = courseFactory.studentsWithId(maxSubmission).buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const task = taskFactory.buildWithId({ creator: user, lesson });

				return { task, user, maxSubmission };
			};

			it('should be create correct status with maxSubmissions of course students', () => {
				const { task, user, maxSubmission } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.maxSubmissions).toEqual(maxSubmission);
			});
		});

		describe('when submitted submissions exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission1 = submissionFactory.studentWithId().buildWithId();
				const submission2 = submissionFactory.studentWithId().buildWithId();
				const submission3 = submissionFactory.studentWithId().buildWithId();

				const submissions = [submission1, submission2, submission3];
				const task = taskFactory.buildWithId({ creator: user, submissions });

				return { task, user, submittedSubmissionNumber: submissions.length };
			};

			it('should be create correct status with  total user number in submitted', () => {
				const { task, user, submittedSubmissionNumber } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(submittedSubmissionNumber);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(0);
			});
		});

		describe('when submitted team submissions exists', () => {
			const setup = () => {
				const submissionWithTeamMemberNumber = 3;

				const user = userFactory.buildWithId();
				const teamSubmission = submissionFactory.teamMembersWithId(submissionWithTeamMemberNumber).buildWithId();
				const task = taskFactory.buildWithId({ creator: user, submissions: [teamSubmission] });

				const submittedSubmissionNumber = submissionWithTeamMemberNumber + 1;

				return { task, user, submittedSubmissionNumber };
			};

			it('should be create correct status with total user number in submitted', () => {
				const { task, user, submittedSubmissionNumber } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(submittedSubmissionNumber);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(0);
			});
		});

		describe('when graded submissions exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission1 = submissionFactory.graded().studentWithId().build();
				const submission2 = submissionFactory.graded().studentWithId().build();
				const submission3 = submissionFactory.graded().studentWithId().build();

				const submissions = [submission1, submission2, submission3];
				const task = taskFactory.buildWithId({ creator: user, submissions });

				return { task, user, submissionNumber: submissions.length };
			};

			it('should be create correct status with  total user number in submitted', () => {
				const { task, user, submissionNumber } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(submissionNumber);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user, submissionNumber } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(submissionNumber);
			});
		});

		describe('when graded team submissions exists', () => {
			const setup = () => {
				const submissionNumber = 3;
				const user = userFactory.buildWithId();
				const submissions = [
					submissionFactory.graded().studentWithId().teamMembersWithId(submissionNumber).buildWithId(),
				];
				const task = taskFactory.buildWithId({ creator: user, submissions });

				const gradedSubmissionUsers = submissionNumber + 1;

				return { task, user, gradedSubmissionUsers };
			};

			it('should be create correct status with total user number in submitted', () => {
				const { task, user, gradedSubmissionUsers } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(gradedSubmissionUsers);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user, gradedSubmissionUsers } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(gradedSubmissionUsers);
			});
		});

		describe('when task is a draft', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.draft().buildWithId({ creator: user });

				jest.spyOn(task, 'isDraft').mockImplementationOnce(() => true);

				return { task, user };
			};

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isDraft).toEqual(true);
			});
		});

		describe('when task is not a draft', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.draft().buildWithId({ creator: user });

				jest.spyOn(task, 'isDraft').mockImplementationOnce(() => false);

				return { task, user };
			};

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isDraft).toEqual(false);
			});
		});

		describe('when task is a finished for the user', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.isPublished().buildWithId({ creator: user, finished: [user] });

				return { task, user };
			};

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isFinished).toEqual(true);
			});
		});

		// ..that is really nothing what the task should be knowen, but it exist also exist the test for it.
		describe('when user is a submissionTeacher in parent that is a course', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const task = taskFactory.isPublished().buildWithId({ creator: user, course });

				return { task, user };
			};

			it('should be create correct status for isSubstitutionTeacher', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isSubstitutionTeacher).toEqual(true);
			});
		});
	});
	/*
	describe('createStudentStatusForUser', () => {
		it('should call isSubmittedForUser and return 1 instant of true for property submitted', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			const spy = jest.spyOn(task, 'isSubmittedForUser').mockImplementation(() => true);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.submitted).toEqual(1);

			spy.mockReset();
		});

		it('should call isSubmittedForUser and return 0 instant of false for property submitted', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			const spy = jest.spyOn(task, 'isSubmittedForUser').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.submitted).toEqual(0);

			spy.mockReset();
		});

		it('should call isGradedForUser and return 1 instant of true for property graded', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			const spy = jest.spyOn(task, 'isGradedForUser').mockImplementation(() => true);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.graded).toEqual(1);

			spy.mockReset();
		});

		it('should call isGradedForUser and return 0 instant of false for property graded', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			const spy = jest.spyOn(task, 'isGradedForUser').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.graded).toEqual(0);

			spy.mockReset();
		});

		it('should return 1 for property maxSubmissions', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();

			const result = task.createStudentStatusForUser(user);

			expect(result.maxSubmissions).toEqual(1);
		});

		it('should call isDraft and return the result as isDraft property', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			const spy = jest.spyOn(task, 'isDraft').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.isDraft).toEqual(false);

			spy.mockReset();
		});

		it('should return false for property isSubstitutionTeacher', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();

			const result = task.createStudentStatusForUser(user);

			expect(result.isSubstitutionTeacher).toEqual(false);
		});
	});
*/
	describe('getParentData', () => {
		describe('when a course is set', () => {
			it('should return the name, id and color of the course', () => {
				const course = courseFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });
				expect(task.getParentData().courseName).toEqual(course.name);
				expect(task.getParentData().courseId).toEqual(course.id);
				expect(task.getParentData().color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.buildWithId();
					const lesson = lessonFactory.buildWithId({ course });
					const task = taskFactory.buildWithId({ course, lesson });
					expect(task.getParentData().lessonName).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.buildWithId();
					const task = taskFactory.buildWithId({ course });
					expect(task.getParentData().lessonName).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = taskFactory.buildWithId();
				expect(task.getParentData().courseName).toEqual('');
				expect(task.getParentData().color).toEqual('#ACACAC');
			});
		});
	});

	/*
	describe('finishForUser', () => {
		it('should add the user to the finished collection', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			task.finishForUser(user);
			expect(task.isFinishedForUser(user)).toBe(true);
		});

		it('should make sure the user is added only once', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();
			task.finishForUser(user);
			task.finishForUser(user);
			expect(task.finished.count()).toBe(1);
		});

		it('should not overwrite other users in the finished collection', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ finished: [user1] });
			task.finishForUser(user2);
			expect(task.isFinishedForUser(user1)).toBe(true);
			expect(task.isFinishedForUser(user2)).toBe(true);
		});
	});
*/
	/*
	describe('restoreForUser', () => {
		it('should remove the user from the finished collection', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ finished: [user] });
			task.restoreForUser(user);
			expect(task.isFinishedForUser(user)).toBe(false);
		});

		it('should make sure the task can be restored even if already done ', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ finished: [user] });
			task.restoreForUser(user);
			task.restoreForUser(user);
			expect(task.finished.count()).toBe(0);
		});

		it('should not remove other users from the finished collection', () => {
			const user1 = userFactory.buildWithId();
			const user2 = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ finished: [user1, user2] });
			task.restoreForUser(user2);
			expect(task.isFinishedForUser(user1)).toBe(true);
			expect(task.isFinishedForUser(user2)).toBe(false);
		});
	});
*/
	describe('publish', () => {
		it('should become not a draft', () => {
			const task = taskFactory.draft().buildWithId();
			task.publish();
			expect(task.isDraft()).toEqual(false);
		});

		it('should set availableDate', () => {
			const task = taskFactory.draft().buildWithId();
			const dateBefore = new Date(Date.now());
			task.publish();
			expect(task.availableDate).toBeDefined();
			expect((task.availableDate as Date) >= dateBefore).toEqual(true);
		});
	});

	describe('unpublish', () => {
		it('should become a draft', () => {
			const task = taskFactory.buildWithId();
			task.unpublish();
			expect(task.isDraft()).toEqual(true);
		});
	});

	describe('getSchoolId', () => {
		it('schould return schoolId from school', () => {
			const school = schoolFactory.buildWithId();
			const task = taskFactory.buildWithId({ school });
			const schoolId = task.getSchoolId();

			expect(schoolId).toEqual(school.id);
		});
	});
});
