import { MikroORM } from '@mikro-orm/core';
import {
	courseFactory,
	lessonFactory,
	taskFactory,
	userFactory,
	submissionFactory,
	setupEntities,
} from '@shared/testing';

import { Task } from './task.entity';

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

	describe('getSubmittedUsers', () => {
		it('should use save private getSubmissionItems methode to fetch submissions', () => {
			const task = taskFactory.build();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spy = jest.spyOn(Task.prototype as any, 'getSubmissionsItems');

			task.getSubmittedUsers();

			expect(spy).toHaveBeenCalled();
		});

		it.todo('should validate if data are loaded');

		describe('when submissions are loaded', () => {
			it('should return a list of submitted userIds', () => {
				const student = userFactory.build();
				student.id = '0123456789ab';

				const task = taskFactory.build();
				const submission = submissionFactory.build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student]);
			});

			it('should work for multiple submissions', () => {
				const student1 = userFactory.build();
				student1.id = '0123456789ab';

				const student2 = userFactory.build();
				student2.id = '0123456789cd';

				const task = taskFactory.build();
				const submission1 = submissionFactory.build({ student: student1, task });
				const submission2 = submissionFactory.build({ student: student2, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student1, student2]);
			});

			it('should work for a user that have multiple submissions', () => {
				const student = userFactory.build();

				const task = taskFactory.build();
				const submission1 = submissionFactory.build({ student, task });
				const submission2 = submissionFactory.build({ student, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student]);
			});
		});
	});

	describe('getNumberOfSubmittedUsers', () => {
		it('should call getSubmittedUsers', () => {
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getSubmittedUsers');

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

	describe('getGradedUsers', () => {
		it('should use save private getSubmissionItems methode to fetch submissions', () => {
			const task = taskFactory.build();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const spy = jest.spyOn(Task.prototype as any, 'getSubmissionsItems');

			task.getGradedUsers();

			expect(spy).toHaveBeenCalled();
		});

		describe('when submissions are loaded', () => {
			it('should only work for graded submissions', () => {
				const student = userFactory.build();
				student.id = '0123456789ab';

				const task = taskFactory.build();
				const submission = submissionFactory.graded().build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student]);
			});

			it('should not work for not graded submissions', () => {
				const student = userFactory.build();
				student.id = '0123456789ab';

				const task = taskFactory.build();
				const submission = submissionFactory.build({ student, task });
				task.submissions.add(submission);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student]);
			});

			it('should return a list of graded userIds', () => {
				const student1 = userFactory.build();
				student1.id = '0123456789ab';

				const student2 = userFactory.build();
				student2.id = '0123456789cd';

				const task = taskFactory.build();
				const submission1 = submissionFactory.graded().build({ student: student1, task });
				const submission2 = submissionFactory.graded().build({ student: student2, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student1, student2]);
			});

			it('should work for multiple graded submissions ', () => {
				const student = userFactory.build();
				student.id = '0123456789ab';

				const task = taskFactory.build();
				const submission1 = submissionFactory.graded().build({ student, task });
				const submission2 = submissionFactory.graded().build({ student, task });
				task.submissions.add(submission1, submission2);

				const result = task.getSubmittedUsers();

				expect(result).toEqual([student]);
			});
		});
	});

	describe('getNumberOfGradedUsers', () => {
		it('should call getGradedUsers', () => {
			const task = taskFactory.build();
			const spy = jest.spyOn(task, 'getGradedUsers');

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
		it('should call getSubmittedUsers and return true if the user is part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.build({ student, task });
			task.submissions.add(submission);

			const spy = jest.spyOn(task, 'getSubmittedUsers');

			const result = task.isSubmittedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(true);

			spy.mockReset();
		});

		it('should call getSubmittedUsers and return false if the user is not part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();

			const spy = jest.spyOn(task, 'getSubmittedUsers').mockReturnValue([]);

			const result = task.isSubmittedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(false);

			spy.mockReset();
		});
	});

	describe('isGradedForUser', () => {
		it('should call getGradedUsers and return true if the user is part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();
			const submission = submissionFactory.graded().build({ student, task });

			task.submissions.add(submission);

			const spy = jest.spyOn(task, 'getGradedUsers');

			const result = task.isGradedForUser(student);

			expect(spy).toHaveBeenCalled();
			expect(result).toBe(true);

			spy.mockReset();
		});

		it('should call getGradedUsers and return false if the user is not part of it.', () => {
			const student = userFactory.build();
			const task = taskFactory.build();

			const spy = jest.spyOn(task, 'getGradedUsers').mockReturnValue([]);

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

	describe('getDescriptions', () => {
		describe('when a course is set', () => {
			it('should return the name and color of the course', () => {
				const course = courseFactory.build();
				const task = taskFactory.build({ course });
				expect(task.getDescriptions().name).toEqual(course.name);
				expect(task.getDescriptions().color).toEqual(course.color);
			});

			describe('when a lesson is set', () => {
				it('should return the lesson name as description', () => {
					const course = courseFactory.build();
					const lesson = lessonFactory.build({ course });
					const task = taskFactory.build({ course, lesson });
					expect(task.getDescriptions().description).toEqual(lesson.name);
				});
			});
			describe('when no lesson is set', () => {
				it('should return an empty string as description', () => {
					const course = courseFactory.build();
					const task = taskFactory.build({ course });
					expect(task.getDescriptions().description).toEqual('');
				});
			});
		});

		describe('when no course is set', () => {
			it('should return the default name and color', () => {
				const task = taskFactory.build();
				expect(task.getDescriptions().name).toEqual('');
				expect(task.getDescriptions().color).toEqual('#ACACAC');
			});
		});
	});
});
