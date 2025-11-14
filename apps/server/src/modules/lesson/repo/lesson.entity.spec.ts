import { MikroORM } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { CourseEntity, CourseGroupEntity } from '@modules/course/repo';
import { courseEntityFactory, courseGroupEntityFactory } from '@modules/course/testing';
import { Submission, Task } from '@modules/task/repo';
import { taskFactory } from '@modules/task/testing';
import { User } from '@modules/user/repo';
import { setupEntities } from '@testing/database';
import { LernstoreResources } from '../api';
import { lessonFactory } from '../testing';
import { materialFactory } from '../testing/material.factory';
import { ComponentProperties, ComponentType, LessonEntity } from './lesson.entity';
import { Material } from './materials.entity';

describe('Lesson Entity', () => {
	let orm: MikroORM;
	const inOneDay = new Date(Date.now() + 8.64e7);

	beforeAll(async () => {
		orm = await setupEntities([User, Task, Submission, LessonEntity, Material, CourseEntity, CourseGroupEntity]);
	});

	describe('numberOfPublishedTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfPublishedTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of public tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(2);
			});

			it('should not count private tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(1);
			});

			it('should not count planned tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPublishedTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('numberOfDraftTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfDraftTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of draft tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(2);
			});

			it('should not count published tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: true });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(1);
			});

			it('should not count planned tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfDraftTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('numberOfPlannedTasks', () => {
		describe('when tasks are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.tasks.set([orm.em.getReference(Task, new ObjectId().toHexString())]);

				expect(() => lesson.getNumberOfPlannedTasks()).toThrow();
			});
		});

		describe('when tasks are populated', () => {
			it('it should return number of planned tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(2);
			});

			it('should not count published tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(1);
			});

			it('should not count draft tasks', () => {
				const course = courseEntityFactory.build();
				const lesson = lessonFactory.build();
				taskFactory.build({ course, lesson, private: true });
				taskFactory.build({ course, lesson, private: false, availableDate: inOneDay });
				taskFactory.build({ course, lesson, private: true, availableDate: inOneDay });

				const result = lesson.getNumberOfPlannedTasks();
				expect(result).toEqual(1);
			});
		});
	});

	describe('getLessonComponents', () => {
		it('should return the content components', () => {
			const expectedTextContent: ComponentProperties = {
				title: 'test component',
				hidden: false,
				component: ComponentType.TEXT,
				content: {
					text: 'this is a text content',
				},
			};
			const lesson = lessonFactory.build({ contents: [expectedTextContent] });
			const result = lesson.getLessonComponents();
			expect(result).toEqual([expectedTextContent]);
		});

		it('should return full lernstore component', () => {
			const expectedLernstoreContent: ComponentProperties = {
				title: 'test component',
				hidden: false,
				component: ComponentType.LERNSTORE,
				content: {
					resources: [
						new LernstoreResources({
							client: 'test client',
							description: 'test description',
							title: 'test title',
							url: 'test url',
						}),
					],
				},
			};
			const lesson = lessonFactory.build({ contents: [expectedLernstoreContent] });
			const result = lesson.getLessonComponents();
			expect(result).toEqual([expectedLernstoreContent]);
		});
	});

	describe('getLessonLinkedTasks', () => {
		it('should return the linked tasks to that lesson', () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build();
			const originalTask = taskFactory.build({ course, lesson });

			const result = lesson.getLessonLinkedTasks();
			expect(result.length).toEqual(1);
			expect(result[0]).toEqual(originalTask);
		});
	});

	describe('getLessonMaterials', () => {
		describe('when materials are not populated', () => {
			it('should throw', () => {
				const lesson = lessonFactory.build();
				lesson.materials.set([orm.em.getReference(Material, new ObjectId().toHexString())]);

				expect(() => lesson.getLessonMaterials()).toThrow();
			});
		});

		describe('when materials are populated', () => {
			it('it should return linked materials to that lesson', () => {
				const materials = materialFactory.buildList(2);
				const lesson = lessonFactory.build({ materials });

				const result = lesson.getLessonMaterials();
				expect(result.length).toEqual(2);
				expect(result[0]).toEqual(materials[0]);
			});
		});
	});

	describe('publish', () => {
		it('should become visible', () => {
			const lesson = lessonFactory.build({ hidden: true });
			lesson.publish();
			expect(lesson.hidden).toEqual(false);
		});
	});

	describe('unpublish', () => {
		it('should become hidden', () => {
			const lesson = lessonFactory.build({ hidden: false });
			lesson.unpublish();
			expect(lesson.hidden).toEqual(true);
		});
	});

	describe('getSchoolId', () => {
		it('schould return schoolId from course group', () => {
			const courseGroup = courseGroupEntityFactory.build();
			const lesson = lessonFactory.build({ courseGroup });
			const schoolId = lesson.getSchoolId();

			expect(schoolId).toEqual(courseGroup.school.id);
		});

		it('schould return schoolId from course', () => {
			const course = courseEntityFactory.build();
			const lesson = lessonFactory.build({ course });
			const schoolId = lesson.getSchoolId();

			expect(schoolId).toEqual(course.school.id);
		});
	});

	describe('getStudentIds is called', () => {
		describe('when course with students exists', () => {
			const setup = () => {
				const studentId1 = new ObjectId().toHexString();
				const studentId2 = new ObjectId().toHexString();
				const studentId3 = new ObjectId().toHexString();
				const studentIds = [studentId1, studentId2, studentId3];

				const course = courseEntityFactory.build();
				const lesson = lessonFactory.buildWithId({ course });

				const spy = jest.spyOn(course, 'getStudentIds').mockReturnValueOnce(studentIds);

				return { lesson, studentIds, spy };
			};

			it('should call getStudentIds in course', () => {
				const { lesson, spy } = setup();

				lesson.getStudentIds();

				expect(spy).toBeCalled();
			});

			it('should return the userIds of the students', () => {
				const { lesson, studentIds } = setup();

				const result = lesson.getStudentIds();

				expect(result.length).toEqual(3);
				expect(result).toContain(studentIds[0]);
				expect(result).toContain(studentIds[1]);
				expect(result).toContain(studentIds[2]);
			});
		});

		describe('when coursegroup with students exists', () => {
			const setup = () => {
				const studentId1 = new ObjectId().toHexString();
				const studentId2 = new ObjectId().toHexString();
				const studentId3 = new ObjectId().toHexString();
				const studentIds = [studentId1, studentId2, studentId3];

				const courseGroup = courseGroupEntityFactory.build();
				const lesson = lessonFactory.buildWithId({ course: courseGroup });

				const spy = jest.spyOn(courseGroup, 'getStudentIds').mockReturnValueOnce(studentIds);

				return { lesson, spy, studentIds };
			};

			it('should call getStudentIds in course', () => {
				const { lesson, spy } = setup();

				lesson.getStudentIds();

				expect(spy).toBeCalled();
			});

			it('should return the userIds of the students', () => {
				const { lesson, studentIds } = setup();

				const result = lesson.getStudentIds();

				expect(result.length).toEqual(3);
				expect(result).toContain(studentIds[0]);
				expect(result).toContain(studentIds[1]);
				expect(result).toContain(studentIds[2]);
			});
		});
	});
});
