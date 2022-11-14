import { MikroORM } from '@mikro-orm/core';
import { courseFactory, lessonFactory, schoolFactory, setupEntities, taskFactory, userFactory } from '@shared/testing';

describe('Task Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('isDraft is called', () => {
		describe('when task is draft', () => {
			const setup = () => {
				const task = taskFactory.draft().build();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isDraft()).toEqual(true);
			});
		});

		describe('when task is not a draft', () => {
			const setup = () => {
				const task = taskFactory.build();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isDraft()).toEqual(false);
			});
		});

		describe('when task private status is undefined', () => {
			const setup = () => {
				const task = taskFactory.build();
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
				const task = taskFactory.build();

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task is a draft', () => {
			const setup = () => {
				const task = taskFactory.draft().build();

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is not arrived', () => {
			const setup = () => {
				const task = taskFactory.build({ availableDate: new Date(Date.now() - 10000) });

				return task;
			};

			it('should return false', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(false);
			});
		});

		describe('when task avaible date is arrived', () => {
			const setup = () => {
				const task = taskFactory.build({ availableDate: new Date(Date.now() + 10000) });

				return task;
			};

			it('should return true', () => {
				const task = setup();

				expect(task.isPublished()).toEqual(true);
			});
		});

		describe('when task avaible is not defined', () => {
			const setup = () => {
				const task = taskFactory.build({ availableDate: undefined });

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
			const task = taskFactory.build();

			const result = task.areSubmissionsPublic();

			expect(result).toBe(false);
		});

		it('should return false if publicSubmissions is false', () => {
			const task = taskFactory.build({ publicSubmissions: false });

			const result = task.areSubmissionsPublic();

			expect(result).toBe(false);
		});

		it('should return false if publicSubmissions is true', () => {
			const task = taskFactory.build({ publicSubmissions: true });

			const result = task.areSubmissionsPublic();

			expect(result).toBe(true);
		});
	});

	describe('isPlanned', () => {
		it('should return false for private task', () => {
			const task = taskFactory.draft().build();
			expect(task.isPlanned()).toEqual(false);
		});

		it('should return true before available Date', () => {
			const task = taskFactory.build({ availableDate: new Date(Date.now() + 10000) });
			expect(task.isPlanned()).toEqual(true);
		});

		it('should return false after available Date', () => {
			const task = taskFactory.build({ availableDate: new Date(Date.now() - 10000) });
			expect(task.isPlanned()).toEqual(false);
		});

		it('should return false without available Date', () => {
			const task = taskFactory.build({ availableDate: undefined });
			expect(task.isPlanned()).toEqual(false);
		});
	});

	describe('createTeacherStatusForUser', () => {
		it('should call getNumberOfSubmittedUsers and return the result as submitted property', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getNumberOfSubmittedUsers').mockImplementation(() => 5);

			const result = task.createTeacherStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.submitted).toEqual(5);

			spy.mockReset();
		});

		it('should call getNumberOfGradedUsers and return the result as graded property', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getNumberOfGradedUsers').mockImplementation(() => 5);

			const result = task.createTeacherStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.graded).toEqual(5);

			spy.mockReset();
		});

		it('should call getMaxSubmissions and return the result as maxSubmissions property', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getMaxSubmissions').mockImplementation(() => 5);

			const result = task.createTeacherStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.maxSubmissions).toEqual(5);

			spy.mockReset();
		});

		it('should call isDraft and return the result as isDraft property', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isDraft').mockImplementation(() => true);

			const result = task.createTeacherStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.isDraft).toBe(true);

			spy.mockReset();
		});

		describe('when parent is a course', () => {
			it('should return true if the user is part of it.', () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				course.substitutionTeachers.add(user);
				const task = taskFactory.build({ course });

				const result = task.createTeacherStatusForUser(user);

				expect(result.isSubstitutionTeacher).toBe(true);
			});

			it('should return false if the user not is part of it', () => {
				const user = userFactory.build();
				const course = courseFactory.build();

				const task = taskFactory.build({ course });

				const result = task.createTeacherStatusForUser(user);

				expect(result.isSubstitutionTeacher).toBe(false);
			});
		});
	});

	describe('createStudentStatusForUser', () => {
		it('should call isSubmittedForUser and return 1 instant of true for property submitted', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isSubmittedForUser').mockImplementation(() => true);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.submitted).toEqual(1);

			spy.mockReset();
		});

		it('should call isSubmittedForUser and return 0 instant of false for property submitted', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isSubmittedForUser').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.submitted).toEqual(0);

			spy.mockReset();
		});

		it('should call isGradedForUser and return 1 instant of true for property graded', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isGradedForUser').mockImplementation(() => true);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.graded).toEqual(1);

			spy.mockReset();
		});

		it('should call isGradedForUser and return 0 instant of false for property graded', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isGradedForUser').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.graded).toEqual(0);

			spy.mockReset();
		});

		it('should return 1 for property maxSubmissions', () => {
			const user = userFactory.build();
			const task = taskFactory.build();

			const result = task.createStudentStatusForUser(user);

			expect(result.maxSubmissions).toEqual(1);
		});

		it('should call isDraft and return the result as isDraft property', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'isDraft').mockImplementation(() => false);

			const result = task.createStudentStatusForUser(user);

			expect(spy).toHaveBeenCalled();
			expect(result.isDraft).toEqual(false);

			spy.mockReset();
		});

		it('should return false for property isSubstitutionTeacher', () => {
			const user = userFactory.build();
			const task = taskFactory.build();

			const result = task.createStudentStatusForUser(user);

			expect(result.isSubstitutionTeacher).toEqual(false);
		});
	});

	describe('getParentData', () => {
		describe('when a course is set', () => {
			it('should return the name, id and color of the course', () => {
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				expect(task.getParentData().courseName).toEqual(course.name);
				expect(task.getParentData().courseId).toEqual(course.id);
				expect(task.getParentData().color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.build();
					const lesson = lessonFactory.build({ course });
					const task = taskFactory.build({ course, lesson });
					expect(task.getParentData().lessonName).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.build();
					const task = taskFactory.build({ course });
					expect(task.getParentData().lessonName).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = taskFactory.build();
				expect(task.getParentData().courseName).toEqual('');
				expect(task.getParentData().color).toEqual('#ACACAC');
			});
		});
	});

	describe('finishForUser', () => {
		it('should add the user to the finished collection', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			task.finishForUser(user);
			expect(task.isFinishedForUser(user)).toBe(true);
		});

		it('should make sure the user is added only once', () => {
			const user = userFactory.build();
			const task = taskFactory.build();
			task.finishForUser(user);
			task.finishForUser(user);
			expect(task.finished.count()).toBe(1);
		});

		it('should not overwrite other users in the finished collection', () => {
			const user1 = userFactory.build();
			const user2 = userFactory.build();
			const task = taskFactory.build({ finished: [user1] });
			task.finishForUser(user2);
			expect(task.isFinishedForUser(user1)).toBe(true);
			expect(task.isFinishedForUser(user2)).toBe(true);
		});
	});

	describe('restoreForUser', () => {
		it('should remove the user from the finished collection', () => {
			const user = userFactory.build();
			const task = taskFactory.build({ finished: [user] });
			task.restoreForUser(user);
			expect(task.isFinishedForUser(user)).toBe(false);
		});

		it('should make sure the task can be restored even if already done ', () => {
			const user = userFactory.build();
			const task = taskFactory.build({ finished: [user] });
			task.restoreForUser(user);
			task.restoreForUser(user);
			expect(task.finished.count()).toBe(0);
		});

		it('should not remove other users from the finished collection', () => {
			const user1 = userFactory.build();
			const user2 = userFactory.build();
			const task = taskFactory.build({ finished: [user1, user2] });
			task.restoreForUser(user2);
			expect(task.isFinishedForUser(user1)).toBe(true);
			expect(task.isFinishedForUser(user2)).toBe(false);
		});
	});

	describe('publish', () => {
		it('should become not a draft', () => {
			const task = taskFactory.draft().build();
			task.publish();
			expect(task.isDraft()).toEqual(false);
		});

		it('should set availableDate', () => {
			const task = taskFactory.draft().build();
			const dateBefore = new Date(Date.now());
			task.publish();
			expect(task.availableDate).toBeDefined();
			expect((task.availableDate as Date) >= dateBefore).toEqual(true);
		});
	});

	describe('unpublish', () => {
		it('should become a draft', () => {
			const task = taskFactory.build();
			task.unpublish();
			expect(task.isDraft()).toEqual(true);
		});
	});

	describe('getSchoolId', () => {
		it('schould return schoolId from school', () => {
			const school = schoolFactory.build();
			const task = taskFactory.build({ school });
			const schoolId = task.getSchoolId();

			expect(schoolId).toEqual(school.id);
		});
	});
});
