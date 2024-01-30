import { InternalServerErrorException } from '@nestjs/common';
import {
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	schoolEntityFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';

describe('Task Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('isDraft is called', () => {
		describe('when task is draft', () => {
			const setup = () => {
				const task = taskFactory.draft().buildWithId();

				return { task };
			};

			it('should return true', () => {
				const { task } = setup();

				expect(task.isDraft()).toEqual(true);
			});
		});

		describe('when task is not a draft', () => {
			const setup = () => {
				const task = taskFactory.buildWithId();

				return { task };
			};

			it('should return false', () => {
				const { task } = setup();

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

				return { task };
			};

			it('should return true', () => {
				const { task } = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task is a draft', () => {
			const setup = () => {
				const task = taskFactory.draft().buildWithId();

				return { task };
			};

			it('should return false', () => {
				const { task } = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is not reached', () => {
			const setup = () => {
				const task = taskFactory.isPlanned().buildWithId();

				return { task };
			};

			it('should return false', () => {
				const { task } = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is reached', () => {
			const setup = () => {
				const task = taskFactory.isPublished().buildWithId();

				return { task };
			};

			it('should return true', () => {
				const { task } = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task available date is not defined', () => {
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
		describe('when submissions are not populated', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });
				Object.assign(task, { submissions: undefined });

				return { task, user };
			};

			it('should be throw an error', () => {
				const { task, user } = setup();

				expect(() => {
					task.createTeacherStatusForUser(user);
				}).toThrowError(InternalServerErrorException);
			});
		});

		describe('when finished is not populated', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({});
				Object.assign(task, { finished: undefined });

				return { task, user };
			};

			it('should throw an internal server exception', () => {
				const { task, user } = setup();

				expect(() => {
					task.createTeacherStatusForUser(user);
				}).toThrowError(InternalServerErrorException);
			});
		});

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
				const user = userFactory.buildWithId();
				const course = courseFactory.studentsWithId(3).buildWithId();
				const lesson = lessonFactory.buildWithId({ course });
				const task = taskFactory.buildWithId({ creator: user, lesson });

				return { task, user };
			};

			it('should be create correct status with maxSubmissions of course students', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.maxSubmissions).toEqual(3);
			});
		});

		describe('when submitted submissions exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission1 = submissionFactory.submitted().studentWithId().buildWithId();
				const submission2 = submissionFactory.submitted().studentWithId().buildWithId();
				const submission3 = submissionFactory.submitted().studentWithId().buildWithId();

				const spy1 = jest.spyOn(submission1, 'getSubmitterIds');
				const spy2 = jest.spyOn(submission2, 'getSubmitterIds');
				const spy3 = jest.spyOn(submission3, 'getSubmitterIds');

				const submissions = [submission1, submission2, submission3];
				const task = taskFactory.buildWithId({ creator: user, submissions });

				jest.spyOn(task, 'isDraft').mockImplementationOnce(() => false);

				return { task, user, spy1, spy2, spy3 };
			};

			it('should be call submission.getSubmitterIds for each submission', () => {
				const { task, user, spy1, spy2, spy3 } = setup();

				task.createTeacherStatusForUser(user);

				expect(spy1).toBeCalledTimes(1);
				expect(spy2).toBeCalledTimes(1);
				expect(spy3).toBeCalledTimes(1);
			});

			it('should be create correct status with  total user number in submitted', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(3);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(0);
			});

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isSubstitutionTeacher).toBe(false);
			});

			it('should be create correct status for isFinished', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isFinished).toEqual(false);
			});
		});

		describe('when graded submissions exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission1 = submissionFactory.submitted().graded().studentWithId().build();
				const submission2 = submissionFactory.submitted().graded().studentWithId().build();
				const submission3 = submissionFactory.submitted().graded().studentWithId().build();

				const spy1 = jest.spyOn(submission1, 'getSubmitterIds');
				const spy2 = jest.spyOn(submission2, 'getSubmitterIds');
				const spy3 = jest.spyOn(submission3, 'getSubmitterIds');

				const submissions = [submission1, submission2, submission3];
				const task = taskFactory.buildWithId({ creator: user, submissions });

				return { task, user, spy1, spy2, spy3 };
			};

			it('should be call submission.getSubmitterIds for each submission', () => {
				const { task, user, spy1, spy2, spy3 } = setup();

				task.createTeacherStatusForUser(user);

				// one for graded and one for submitted status
				expect(spy1).toBeCalledTimes(2);
				expect(spy2).toBeCalledTimes(2);
				expect(spy3).toBeCalledTimes(2);
			});

			it('should be create correct status with  total user number in submitted', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.submitted).toEqual(3);
			});

			it('should be create correct status with total user number in graded', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.graded).toEqual(3);
			});

			it('should return isDraft false for not draft task', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isDraft).toEqual(false);
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

		describe('when task is a finished for the user', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.isPublished().buildWithId({ creator: user, finished: [user] });

				return { task, user };
			};

			it('should be create correct status for isFinished', () => {
				const { task, user } = setup();

				const status = task.createTeacherStatusForUser(user);

				expect(status.isFinished).toEqual(true);
			});
		});

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

	describe('createStudentStatusForUser is called', () => {
		describe('when submissions are not populated', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({});
				Object.assign(task, { submissions: undefined });

				return { task, user };
			};

			it('should throw an internal server exception', () => {
				const { task, user } = setup();

				expect(() => {
					task.createStudentStatusForUser(user);
				}).toThrowError(InternalServerErrorException);
			});
		});

		describe('when finished is not populated', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({});
				Object.assign(task, { finished: undefined });

				return { task, user };
			};

			it('should throw an internal server exception', () => {
				const { task, user } = setup();

				expect(() => {
					task.createStudentStatusForUser(user);
				}).toThrowError(InternalServerErrorException);
			});
		});

		describe('when a valid status is return', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId();

				jest.spyOn(task, 'isDraft').mockImplementationOnce(() => false);

				return { task, user };
			};

			it('should always display maxSubmissions 1', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.maxSubmissions).toEqual(1);
			});

			it('should always display isSubstitutionTeacher false', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isSubstitutionTeacher).toEqual(false);
			});

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isDraft).toEqual(false);
			});

			it('should be create correct status for isFinished', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isFinished).toEqual(false);
			});
		});

		describe('when submitted submissions for this user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId({ student: user });

				const task = taskFactory.buildWithId({ submissions: [submission] });

				return { task, user };
			};

			it('should be return 1', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.submitted).toEqual(1);
			});
		});

		describe('when no submitted submissions for this user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();

				const task = taskFactory.buildWithId({ submissions: [] });

				return { task, user };
			};

			it('should be return 0', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.submitted).toEqual(0);
			});
		});

		describe('when graded submissions for this user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.graded().buildWithId({ student: user });

				const task = taskFactory.buildWithId({ submissions: [submission] });

				return { task, user };
			};

			it('should be return 1', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.graded).toEqual(1);
			});
		});

		describe('when no submitted submissions for this user exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const submission = submissionFactory.submitted().buildWithId({ student: user });

				const task = taskFactory.buildWithId({ submissions: [submission] });

				return { task, user };
			};

			it('should be return 0', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.graded).toEqual(0);
			});
		});

		describe('when task is a draft', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.draft().buildWithId();

				jest.spyOn(task, 'isDraft').mockImplementationOnce(() => true);

				return { task, user };
			};

			it('should be create correct status for isDraft', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isDraft).toEqual(true);
			});
		});

		describe('when task is a finished for the user', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.isPublished().buildWithId({ finished: [user] });

				return { task, user };
			};

			it('should be create correct status for isFinished', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isFinished).toEqual(true);
			});
		});

		describe('when user is a submissionTeacher in parent that is a course', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const course = courseFactory.buildWithId({ substitutionTeachers: [user] });
				const task = taskFactory.isPublished().buildWithId({ creator: user, course });

				return { task, user };
			};

			it('should always return false for isSubstitutionTeacher', () => {
				const { task, user } = setup();

				const status = task.createStudentStatusForUser(user);

				expect(status.isSubstitutionTeacher).toEqual(false);
			});
		});
	});

	describe('getParentData', () => {
		describe('when a course is set', () => {
			it('should return the name, id and color of the course', () => {
				const course = courseFactory.buildWithId();
				const task = taskFactory.buildWithId({ course });

				const result = task.getParentData();

				expect(result.courseName).toEqual(course.name);
				expect(result.courseId).toEqual(course.id);
				expect(result.color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.buildWithId();
					const lesson = lessonFactory.buildWithId({ course });
					const task = taskFactory.buildWithId({ course, lesson });

					const result = task.getParentData();

					expect(result.lessonName).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.buildWithId();
					const task = taskFactory.buildWithId({ course });

					const result = task.getParentData();

					expect(result.lessonName).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = taskFactory.buildWithId();

				const result = task.getParentData();

				expect(result.courseName).toEqual('');
				expect(result.color).toEqual('#ACACAC');
			});
		});
	});

	describe('finishForUser', () => {
		it('should add the user to the finished collection', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId();

			task.finishForUser(user);

			expect(task.finished.contains(user)).toBe(true);
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

			expect(task.finished.contains(user1)).toBe(true);
			expect(task.finished.contains(user2)).toBe(true);
		});
	});

	describe('restoreForUser', () => {
		it('should remove the user from the finished collection', () => {
			const user = userFactory.buildWithId();
			const task = taskFactory.buildWithId({ finished: [user] });

			task.restoreForUser(user);

			expect(task.finished.contains(user)).toBe(false);
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

			expect(task.finished.contains(user1)).toBe(true);
			expect(task.finished.contains(user2)).toBe(false);
		});
	});

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
			const school = schoolEntityFactory.buildWithId();
			const task = taskFactory.buildWithId({ school });

			const schoolId = task.getSchoolId();

			expect(schoolId).toEqual(school.id);
		});
	});

	describe('removeCreatorId is called', () => {
		describe('WHEN creatorId exists', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ creator: user });

				return { task };
			};

			it('should set it to undefined', () => {
				const { task } = setup();

				const result = task.removeCreatorId();

				expect(result).toBe(undefined);
			});
		});
	});

	describe('removeUserFromFinished', () => {
		describe('when user exist in Finished array', () => {
			const setup = () => {
				const user1 = userFactory.buildWithId();
				const user2 = userFactory.buildWithId();
				const task = taskFactory.buildWithId({ finished: [user1, user2] });

				return { user1, user2, task };
			};

			it('should remove user form finished collection', () => {
				const { task, user1 } = setup();

				task.removeUserFromFinished(user1.id);

				expect(task.finished.contains(user1)).toBe(false);
			});

			it('should remove only user selected, not other users in finished collection', () => {
				const { task, user1, user2 } = setup();

				task.removeUserFromFinished(user1.id);

				expect(task.finished.contains(user1)).toBe(false);
				expect(task.finished.contains(user2)).toBe(true);
			});
		});
	});
});
