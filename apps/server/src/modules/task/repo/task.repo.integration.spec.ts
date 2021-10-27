import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder } from '@shared/domain';
import {
	userFactory,
	courseFactory,
	lessonFactory,
	taskFactory,
	submissionFactory,
	cleanUpCollections,
} from '@shared/testing';

import { MongoMemoryDatabaseModule } from '@src/modules/database';

import { TaskRepo } from './task.repo';

describe('TaskRepo', () => {
	let module: TestingModule;
	let repo: TaskRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [TaskRepo],
		}).compile();
		repo = module.get(TaskRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanUpCollections(em);
	});

	describe('findAllByParentIds', () => {
		describe('when user is a teacher', () => {
			it('should find tasks by teacherId', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const task1 = taskFactory.build({ teacher: teacher1 });
				const task2 = taskFactory.build({ teacher: teacher2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher1.id });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});

			it('should not find tasks with a course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ teacher, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ teacher, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by courses', () => {
			it('should find tasks by course ids', async () => {
				const teacher = userFactory.build();
				const course1 = courseFactory.build();
				const course2 = courseFactory.build();
				const task1 = taskFactory.build({ teacher, course: course1 });
				const task2 = taskFactory.build({ teacher, course: course2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course2.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task2.name);
			});

			it('should not find tasks with no course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task1 = taskFactory.build({ teacher, course });
				const task2 = taskFactory.build({ teacher });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});

			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ teacher, course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by lessons', () => {
			it('should find tasks by lesson ids', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson1 = lessonFactory.build({ course, hidden: false });
				const lesson2 = lessonFactory.build({ course, hidden: false });
				const task1 = taskFactory.build({ teacher, course, lesson: lesson1 });
				const task2 = taskFactory.build({ teacher, course, lesson: lesson2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson1.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});

			it('should not find tasks with no lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task1 = taskFactory.build({ teacher, course, lesson });
				const task2 = taskFactory.build({ teacher, course });
				const task3 = taskFactory.build({ teacher });

				await em.persistAndFlush([task1, task2, task3]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});
		});

		describe('find by teacher and courses', () => {
			it('should find tasks by teacher and courses', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const course1 = courseFactory.build();
				const course2 = courseFactory.build();
				const task1 = taskFactory.build({ teacher: teacher1 });
				const task2 = taskFactory.build({ teacher: teacher2 });
				const task3 = taskFactory.build({ teacher: teacher1, course: course1 });
				const task4 = taskFactory.build({ teacher: teacher1, course: course2 });
				const task5 = taskFactory.build({ teacher: teacher2, course: course1 });
				const task6 = taskFactory.build({ teacher: teacher2, course: course2 });

				await em.persistAndFlush([task1, task2, task3, task4, task5, task6]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher1.id, courseIds: [course2.id] });
				expect(total).toEqual(3);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task1.name)).toBe(true);
				expect(taskNames.includes(task4.name)).toBe(true);
				expect(taskNames.includes(task6.name)).toBe(true);
			});

			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ teacher, course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id, courseIds: [course.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by teacher and lessons', () => {
			it('should find tasks by teacher and lessons', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const course = courseFactory.build();
				const lesson1 = lessonFactory.build({ course, hidden: false });
				const lesson2 = lessonFactory.build({ course, hidden: false });
				const task1 = taskFactory.build({ teacher: teacher1 });
				const task2 = taskFactory.build({ teacher: teacher2 });
				const task3 = taskFactory.build({ teacher: teacher1, course, lesson: lesson1 });
				const task4 = taskFactory.build({ teacher: teacher1, course, lesson: lesson2 });
				const task5 = taskFactory.build({ teacher: teacher2, course, lesson: lesson1 });
				const task6 = taskFactory.build({ teacher: teacher2, course, lesson: lesson2 });

				await em.persistAndFlush([task1, task2, task3, task4, task5, task6]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher2.id, lessonIds: [lesson1.id] });
				expect(total).toEqual(3);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task2.name)).toBe(true);
				expect(taskNames.includes(task3.name)).toBe(true);
				expect(taskNames.includes(task5.name)).toBe(true);
			});
		});

		describe('find by courses and lessons', () => {
			it('should find tasks by courses and lessons', async () => {
				const teacher = userFactory.build();
				const course1 = courseFactory.build({ name: 'course #1' });
				const course2 = courseFactory.build({ name: 'course #2' });
				const lesson = lessonFactory.build({ course: course2, hidden: false });
				const task1 = taskFactory.build({ teacher, course: course1 });
				const task2 = taskFactory.build({ teacher, course: course2, lesson });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({
					courseIds: [course1.id, course2.id],
					lessonIds: [lesson.id],
				});
				expect(total).toEqual(2);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task1.name)).toBe(true);
				expect(taskNames.includes(task2.name)).toBe(true);
			});
		});

		describe('find by empty ids', () => {
			it('should find no tasks when no ids are given at all', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({});
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find no tasks when course ids are empty', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find no tasks when lesson ids are empty', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('filters', () => {
			it('should filter tasks by draft status = true', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.private(true).build({ teacher });
				const task2 = taskFactory.private(false).build({ teacher });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: true });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task1.id);
			});

			it('should filter tasks by draft status = false', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.private(true).build({ teacher });
				const task2 = taskFactory.private(false).build({ teacher });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: false });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task2.id);
			});

			it('should filter tasks by draft status = null as false', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ teacher });
				Object.assign(task, { private: null });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: false });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task.id);
			});

			// TODO: FIXME - WE DON'T WANT THIS!!! NON-OPTIONAL BOOLEAN PROPERTIES HAVE TO BE DEFINED.
			it('should filter tasks by draft status = undefined as false', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ teacher });

				await em.persistAndFlush([task]);
				em.clear();

				// unset private using a raw query because it's impossible using the ORM
				await em
					.getDriver()
					.getConnection()
					.getCollection('homeworks')
					.updateOne({ _id: task._id }, { $unset: { private: '' } });

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: false });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task.id);
			});

			it('should return tasks with both status when no filter is applied', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.private(true).build({ teacher });
				const task2 = taskFactory.private(false).build({ teacher });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id });
				expect(total).toEqual(2);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task1.name)).toBe(true);
				expect(taskNames.includes(task2.name)).toBe(true);
			});

			it('should filter tasks by dueDate after a given date', async () => {
				const teacher = userFactory.build();
				const threeWeeksinMilliseconds = 1.814e9;
				const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);
				const dueDate2 = new Date();
				const task1 = taskFactory.build({ teacher, dueDate: dueDate1 });
				const task2 = taskFactory.build({ teacher, dueDate: dueDate2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const oneWeekInMilliseconds = 6.048e8;

				const [result, total] = await repo.findAllByParentIds(
					{ teacherId: teacher.id },
					{ afterDueDateOrNone: new Date(Date.now() - oneWeekInMilliseconds) }
				);
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task2.id);
			});

			it('should return tasks if they have no dueDate', async () => {
				const teacher = userFactory.build();
				const threeWeeksinMilliseconds = 1.814e9;
				const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);
				const dueDate2 = new Date();
				const task1 = taskFactory.build({ teacher, dueDate: dueDate1 });
				const task2 = taskFactory.build({ teacher, dueDate: dueDate2 });
				const task3 = taskFactory.build({ teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3]);
				em.clear();

				const oneWeekInMilliseconds = 6.048e8;

				const [result, total] = await repo.findAllByParentIds(
					{ teacherId: teacher.id },
					{ afterDueDateOrNone: new Date(Date.now() - oneWeekInMilliseconds) }
				);
				expect(total).toEqual(2);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task2.name)).toBe(true);
				expect(taskNames.includes(task3.name)).toBe(true);
			});

			it('should return tasks with any dueDate if no filter is applied', async () => {
				const teacher = userFactory.build();
				const threeWeeksinMilliseconds = 1.814e9;
				const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);
				const dueDate2 = new Date();
				const task1 = taskFactory.build({ teacher, dueDate: dueDate1 });
				const task2 = taskFactory.build({ teacher, dueDate: dueDate2 });
				const task3 = taskFactory.build({ teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id });
				expect(total).toEqual(3);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task1.name)).toBe(true);
				expect(taskNames.includes(task2.name)).toBe(true);
				expect(taskNames.includes(task3.name)).toBe(true);
			});
		});

		describe('order', () => {
			it('should order by dueDate asc', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, undefined, {
					order: { dueDate: SortOrder.asc },
				});
				expect(total).toEqual(4);
				expect(result[0].id).toEqual(task4.id);
				expect(result[1].id).toEqual(task3.id);
				expect(result[2].id).toEqual(task1.id);
				expect(result[3].id).toEqual(task2.id);
			});

			it('should order by dueDate desc', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, undefined, {
					order: { dueDate: SortOrder.desc },
				});
				expect(total).toEqual(4);
				expect(result[0].id).toEqual(task2.id);
				expect(result[1].id).toEqual(task1.id);
				expect(result[2].id).toEqual(task3.id);
				expect(result[3].id).toEqual(task4.id);
			});
		});

		describe('pagination', () => {
			it('should skip and limit to the given number of records', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, undefined, {
					order: { dueDate: SortOrder.desc },
					pagination: { skip: 1, limit: 2 },
				});
				expect(total).toEqual(4); // note: this is the total count
				expect(result[0].id).toEqual(task1.id);
				expect(result[1].id).toEqual(task3.id);
			});
		});

		describe('return value', () => {
			it('should populate the course', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ teacher, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);

				expect(result[0].course?.name).toEqual(course.name);
			});

			it('should populate the lesson', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ teacher, course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
				expect(total).toEqual(1);
				expect(result[0].lesson?.hidden).toEqual(false);
			});

			it('should populate the list of submissions', async () => {
				const teacher = userFactory.build();
				const student = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ teacher, course });
				task.submissions.add(submissionFactory.build({ task, student }));

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result[0].submissions.length).toEqual(task.submissions.length);
				expect(result[0].submissions[0].id).toEqual(task.submissions[0].id);
				expect(result[0].submissions[0].createdAt).toEqual(task.submissions[0].createdAt);
			});
		});

		describe('where closed task exist', () => {
			it('should not find task where the task creator has moved it to archived', async () => {
				const creator = userFactory.build();
				const course = courseFactory.build({ teachers: [creator] });
				const task = taskFactory.build({ teacher: creator, course, closed: [creator] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { closed: creator.id });

				expect(total).toEqual(0);
			});

			it('should find task where teacher that is not the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const teacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator, teacher] });
				const task = taskFactory.build({ teacher: creator, course, closed: [teacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { closed: teacher.id });

				expect(total).toEqual(0);
			});

			it('should find task where substitiution teacher that is not the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const substitutionTeacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], substitutionTeachers: [substitutionTeacher] });
				const task = taskFactory.build({ teacher: creator, course, closed: [substitutionTeacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { closed: substitutionTeacher.id });

				expect(total).toEqual(0);
			});

			it('should find task where student moved this task to archived', async () => {
				const creator = userFactory.build();
				const student = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], students: [student] });
				const task = taskFactory.build({ teacher: creator, course, closed: [student] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { closed: student.id });

				expect(total).toEqual(0);
			});
		});
	});
});
