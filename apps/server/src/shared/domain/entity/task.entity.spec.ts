import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import {
	courseFactory,
	fileFactory,
	lessonFactory,
	schoolFactory,
	setupEntities,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { File } from './file.entity';
import { Submission } from './submission.entity';
import { Task } from './task.entity';
import { User } from './user.entity';

describe('Task Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('isDraft', () => {
		it('should return true by default', () => {
			const task = taskFactory.draft().build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return false if private = false', () => {
			const task = taskFactory.build();
			expect(task.isDraft()).toEqual(false);
		});

		it('should return private property as boolean if defined', () => {
			const task = taskFactory.draft().build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return private property as boolean if undefined', () => {
			const task = taskFactory.build();
			Object.assign(task, { private: undefined });
			expect(task.isDraft()).toEqual(false);
		});
	});

	describe('isPublished', () => {
		it('should return false for private task', () => {
			const task = taskFactory.draft().build();
			expect(task.isPublished()).toEqual(false);
		});

		it('should return false before available Date', () => {
			const task = taskFactory.build({ availableDate: new Date(Date.now() + 10000) });
			expect(task.isPublished()).toEqual(false);
		});

		it('should return true after available Date', () => {
			const task = taskFactory.build({ availableDate: new Date(Date.now() - 10000) });
			expect(task.isPublished()).toEqual(true);
		});

		it('should return true without available Date', () => {
			const task = taskFactory.build({ availableDate: undefined });
			expect(task.isPublished()).toEqual(true);
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

	describe('isFinished', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.build();
		});

		it('should return true if finished contains user', () => {
			const task = taskFactory.finished(user).build();
			expect(task.isFinishedForUser(user)).toEqual(true);
		});

		it('should return true if course is finished', () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });
			jest.spyOn(course, 'isFinished').mockReturnValue(true);
			expect(task.isFinishedForUser(user)).toEqual(true);
		});

		it('should return false if finished does not contain user & course is not finished', () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });
			jest.spyOn(course, 'isFinished').mockReturnValue(false);
			expect(task.isFinishedForUser(user)).toEqual(false);
		});

		it('should return false if finished is undefined & course is not finished', () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });

			Object.assign(task, { finished: undefined });
			jest.spyOn(course, 'isFinished').mockReturnValue(false);
			expect(task.isFinishedForUser(user)).toEqual(false);
		});

		it('should return true if finished is undefined & course is finished', () => {
			const course = courseFactory.build();
			const task = taskFactory.build({ course });

			Object.assign(task, { finished: undefined });
			jest.spyOn(course, 'isFinished').mockReturnValue(true);
			expect(task.isFinishedForUser(user)).toEqual(true);
		});
	});

	describe('getSubmittedUserIds', () => {
		it('should throw if submissions are not loaded', () => {
			const task = taskFactory.build();
			task.submissions.set([orm.em.getReference(Submission, new ObjectId().toHexString())]);

			expect(() => task.getSubmittedUserIds()).toThrowError();
		});

		describe('when submissions are loaded', () => {
			it('should return a list of submitted userIds', () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission = submissionFactory.build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student.id]);
			});

			it('should work for multiple submissions', () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission1 = submissionFactory.build({ student: student1, task });
				const submission2 = submissionFactory.build({ student: student2, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUserIds();

				expect(result.sort()).toEqual([student1.id, student2.id].sort());
			});

			it('should work for a user that have multiple submissions', () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission1 = submissionFactory.build({ student, task });
				const submission2 = submissionFactory.build({ student, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student.id]);
			});
		});
	});

	describe('getNumberOfSubmittedUsers', () => {
		it('should call getSubmittedUserIds', () => {
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getSubmittedUserIds');

			task.getNumberOfSubmittedUsers();

			expect(spy).toHaveBeenCalled();
		});

		it('should count users correctly', () => {
			const student1 = userFactory.build();
			student1.id = '0123456789ab';

			const student2 = userFactory.build();
			student2.id = '0123456789cd';

			const task = taskFactory.build();
			const submission1 = submissionFactory.build({ student: student1, task });
			const submission2 = submissionFactory.build({ student: student2, task });
			task.submissions.add(submission1, submission2);

			const result = task.getNumberOfSubmittedUsers();

			expect(result).toEqual(2);
		});

		it('should count a userId one time', () => {
			const student = userFactory.build();
			student.id = '0123456789ab';

			const task = taskFactory.build();
			const submission1 = submissionFactory.build({ student, task });
			const submission2 = submissionFactory.build({ student, task });
			task.submissions.add(submission1, submission2);

			const result = task.getNumberOfSubmittedUsers();

			expect(result).toEqual(1);
		});
	});

	describe('getGradedUserIds', () => {
		it('should use save private getSubmissionItems methode to fetch submissions', () => {
			const task = taskFactory.build();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spy = jest.spyOn(Task.prototype as any, 'getSubmissionItems');

			task.getGradedUserIds();

			expect(spy).toHaveBeenCalled();
		});

		it('should throw if submissions are not loaded', () => {
			const task = taskFactory.build();
			task.submissions.set([orm.em.getReference(Submission, new ObjectId().toHexString())]);

			expect(() => task.getGradedUserIds()).toThrowError();
		});

		describe('when submissions are loaded', () => {
			it('should only work for graded submissions', () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission = submissionFactory.graded().build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student.id]);
			});

			it('should not work for not graded submissions', () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission = submissionFactory.build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student.id]);
			});

			it('should return a list of graded userIds', () => {
				const student1 = userFactory.buildWithId();
				const student2 = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission1 = submissionFactory.graded().build({ student: student1, task });
				const submission2 = submissionFactory.graded().build({ student: student2, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student1.id, student2.id]);
			});

			it('should work for multiple graded submissions ', () => {
				const student = userFactory.buildWithId();
				const task = taskFactory.build();
				const submission1 = submissionFactory.graded().build({ student, task });
				const submission2 = submissionFactory.graded().build({ student, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUserIds();

				expect(result).toEqual([student.id]);
			});
		});
	});

	describe('getNumberOfGradedUsers', () => {
		it('should call getGradedUserIds', () => {
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getGradedUserIds');

			task.getNumberOfGradedUsers();

			expect(spy).toHaveBeenCalled();
		});

		it('should count userids correctly', () => {
			const student1 = userFactory.build();
			student1.id = '0123456789ab';

			const student2 = userFactory.build();
			student2.id = '0123456789cd';

			const task = taskFactory.build();
			const submission1 = submissionFactory.graded().build({ student: student1, task });
			const submission2 = submissionFactory.graded().build({ student: student2, task });
			task.submissions.add(submission1, submission2);

			const result = task.getNumberOfSubmittedUsers();

			expect(result).toEqual(2);
		});

		it('should count a userId one time', () => {
			const student = userFactory.build();
			student.id = '0123456789ab';

			const task = taskFactory.build();
			const submission1 = submissionFactory.graded().build({ student, task });
			const submission2 = submissionFactory.graded().build({ student, task });
			task.submissions.add(submission1, submission2);

			const result = task.getNumberOfSubmittedUsers();

			expect(result).toEqual(1);
		});
	});

	describe('getMaxSubmissions', () => {
		describe('when no parent exist', () => {
			it('should return 0', () => {
				const task = taskFactory.build();

				const result = task.getMaxSubmissions();

				expect(result).toEqual(0);
			});
		});

		describe('when parent is a course', () => {
			it('should call course.getNumberOfStudents', () => {
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				const spy = jest.spyOn(course, 'getNumberOfStudents');

				task.getMaxSubmissions();

				expect(spy).toHaveBeenCalled();
			});

			it('should return the result', () => {
				const student1 = userFactory.build();
				const student2 = userFactory.build();
				const course = courseFactory.build();
				course.students.add(student1, student2);
				const task = taskFactory.build({ course });

				const result = task.getMaxSubmissions();

				expect(result).toEqual(2);
			});
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

	describe('isSubmittedForUser', () => {
		it('should call getSubmittedUserIds and return true if the user is part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.build({ student, task });
			task.submissions.add(submission);

			const spy = jest.spyOn(task, 'getSubmittedUserIds');

			const result = task.isSubmittedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(true);

			spy.mockReset();
		});

		it('should call getSubmittedUserIds and return false if the user is not part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();

			const spy = jest.spyOn(task, 'getSubmittedUserIds').mockReturnValue([]);

			const result = task.isSubmittedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(false);

			spy.mockReset();
		});
	});

	describe('isGradedForUser', () => {
		it('should call getGradedUserIds and return true if the user is part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.graded().build({ student, task });

			task.submissions.add(submission);

			const spy = jest.spyOn(task, 'getGradedUserIds');

			const result = task.isGradedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(true);

			spy.mockReset();
		});

		it('should call getGradedUserIds and return false if the user is not part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();

			const spy = jest.spyOn(task, 'getGradedUserIds').mockReturnValue([]);

			const result = task.isGradedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(false);

			spy.mockReset();
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

	describe('getFileNames', () => {
		it('should throw if files are not loaded', () => {
			const task = taskFactory.build();
			task.files.set([orm.em.getReference(File, new ObjectId().toHexString())]);

			expect(() => task.getFileNames()).toThrowError();
		});

		describe('when files are loaded', () => {
			it('should return empty array if property files does not exist', () => {
				const user = userFactory.buildWithId({});
				const task = taskFactory.build({ creator: user });
				expect(task.getFileNames()).toEqual([]);
			});

			it('should return empty array if files array is empty', () => {
				const user = userFactory.buildWithId({});
				const task = taskFactory.build({ creator: user, files: [] });
				expect(task.getFileNames()).toEqual([]);
			});

			it('should return array with correct file name', () => {
				const user = userFactory.buildWithId({});
				const file = fileFactory.buildWithId({ creator: user });
				const task = taskFactory.build({ creator: user, files: [file] });
				expect(task.getFileNames()).toEqual([file.name]);
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
