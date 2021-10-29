import { courseFactory, lessonFactory, taskFactory, userFactory, setupEntities } from '@shared/testing';

describe('Task Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('isDraft', () => {
		it('should return true by default', () => {
			const task = taskFactory.build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return false if private = false', () => {
			const task = taskFactory.draft(false).build();
			expect(task.isDraft()).toEqual(false);
		});

		it('should return private property as boolean if defined', () => {
			const task = taskFactory.build();
			expect(task.isDraft()).toEqual(true);
		});

		it('should return private property as boolean if undefined', () => {
			const task = taskFactory.build();
			Object.assign(task, { private: undefined });
			expect(task.isDraft()).toEqual(false);
		});
	});

	describe('getSubmittedUserIds', () => {
		it('should use save private getSubmissionItems methode to fetch submissions', () => {

		});

		it('should return a list of submitted userIds' () => {

		});

		it('should work for multiple submissions' () => {

		});
	});

	describe('getNumberOfSubmittedUsers', () => {
		it('should count userids correctly' () => {

		});

		it('should count a userId one time' () => {

		});
	});

	describe('getGradedUserIds', () => {
		it('should use save private getSubmissionItems methode to fetch submissions', () => {

		});

		it('should only work for graded submissions', () => {

		})

		it('should return a list of graded userIds' () => {

		});

		it('should work for multiple graded submissions ' () => {

		});
	});

	describe('getNumberOfGradedUsers', () => {
		it('should count userids correctly' () => {

		});

		it('should count a userId one time' () => {

		});
	});

	describe('getMaxSubmissions', () => {
		describe('when no parent exist', () => {
			it('should return 0', () => {

			});
		});

		describe('when parent is a course', () => {
			it('should call course.getNumberOfStudents and return the result', () => {

			});
		});
	});

	describe('createTeacherStatusForUser', () => {
		describe('when parent is a course', () => {
			it('should call getSubstitutionTeacherIds and return true if userId is part of it.', () => {

			});

			it('should call getSubstitutionTeacherIds and return false if userId not is part of it', () => {

			});
		});

		it('should call getNumberOfSubmittedUsers and return the result as submitted property', () => {

		});

		it('should call getNumberOfGradedUsers and return the result as graded property', () => {

		});

		it('should call getMaxSubmissions and return the result as maxSubmissions property', () => {

		});

		it('should call isDraft and return the result as isDraft property', () => {

		});
	});

	describe('isSubmittedForUser', () => {
		it('should call getNumberOfSubmittedUsers and return true if userId is part of it.', () => {

		});

		it('should call getNumberOfSubmittedUsers and return false if userId is not part of it.', () => {

		});
	});

	describe('isGradedForUser', () => {
		it('should call getGradedUserIds and return true if userId is part of it.', () => {

		});

		it('should call getGradedUserIds and return false if userId is not part of it.', () => {

		});
	});

	describe('createStudentStatusForUser', () => {
		it('should call isSubmittedForUser and return 1 instant of true for submitted property', () => {

		});

		it('should call isSubmittedForUser and return 0 instant of false for submitted property', () => {

		});

		it('should call isGradedForUser and return 1 instant of true for graded property', () => {

		});

		it('should call isGradedForUser and return 0 instant of false for graded property', () => {

		});

		it('should return 1 for maxSubmissions', () => {

		});

		it('should call isDraft and return the result as isDraft property', () => {

		});

		it('should return false for isSubstitutionTeacher', () => {

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

	describe('isSubstitutionTeacher', () => {
		it('should return true if it is a substitution teacher', () => {
			const teacher = userFactory.build({ firstName: 'sub', lastName: 'teacher' });
			const course = courseFactory.build({ substitutionTeachers: [teacher] });
			const task = taskFactory.build({ name: 'task #1', course });

			const boolean = task.isSubstitutionTeacher(teacher.id);

			expect(boolean).toEqual(true);
		});

		it('should return false if it is a normal teacher', () => {
			const teacher = userFactory.build({ firstName: 'sub', lastName: 'teacher' });
			const course = courseFactory.build({ teachers: [teacher] });
			const task = taskFactory.build({ name: 'task #1', course });

			const boolean = task.isSubstitutionTeacher(teacher.id);

			expect(boolean).toEqual(false);
		});

		it('should return false if it no course exist', () => {
			const teacher = userFactory.build({ firstName: 'sub', lastName: 'teacher' });
			const task = taskFactory.build({ name: 'task #1' });

			const boolean = task.isSubstitutionTeacher(teacher.id);

			expect(boolean).toEqual(false);
		});
	});
});
