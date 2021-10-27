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
			const task = taskFactory.private(false).build();
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
