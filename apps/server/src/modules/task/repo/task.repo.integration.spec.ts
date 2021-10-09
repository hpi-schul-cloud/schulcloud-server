import { EntityManager } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { Lesson, SortOrder, Submission, Task } from '@shared/domain';
import { userFactory } from '@shared/domain/factory';
import { courseFactory } from '@shared/domain/factory/course.factory';

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
		await em.getDriver().dropCollections();
	});

	describe('findAllByParentIds', () => {
		describe('find by teacher', () => {
			it('should find tasks by teacherId', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const task1 = new Task({ name: 'task #1', teacher: teacher1 });
				const task2 = new Task({ name: 'task #2', teacher: teacher2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher1.id });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});
			it('should not find tasks with a course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task = new Task({ name: 'task #1', teacher, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', teacher, lesson });

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
				const task1 = new Task({ name: 'task #1', teacher, parent: course1 });
				const task2 = new Task({ name: 'task #2', teacher, parent: course2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course2.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task2.name);
			});
			it('should not find tasks with no course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task1 = new Task({ name: 'task #1', teacher, parent: course });
				const task2 = new Task({ name: 'task #2', teacher });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});
			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', teacher, parent: course, lesson });

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
				const lesson1 = new Lesson({ course, hidden: false });
				const lesson2 = new Lesson({ course, hidden: false });
				const task1 = new Task({ name: 'task #1', teacher, parent: course, lesson: lesson1 });
				const task2 = new Task({ name: 'task #2', teacher, parent: course, lesson: lesson2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson1.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});
			it('should not find tasks with no lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = new Lesson({ course, hidden: false });
				const task1 = new Task({ name: 'task #1', teacher, parent: course, lesson });
				const task2 = new Task({ name: 'task #2', teacher, parent: course });
				const task3 = new Task({ name: 'task #3', teacher });

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
				const task1 = new Task({ name: 'task #1', teacher: teacher1 });
				const task2 = new Task({ name: 'task #2', teacher: teacher2 });
				const task3 = new Task({ name: 'task #3', teacher: teacher1, parent: course1 });
				const task4 = new Task({ name: 'task #4', teacher: teacher1, parent: course2 });
				const task5 = new Task({ name: 'task #5', teacher: teacher2, parent: course1 });
				const task6 = new Task({ name: 'task #6', teacher: teacher2, parent: course2 });

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
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', teacher, parent: course, lesson });

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
				const lesson1 = new Lesson({ course, hidden: false });
				const lesson2 = new Lesson({ course, hidden: false });
				const task1 = new Task({ name: 'task #1', teacher: teacher1 });
				const task2 = new Task({ name: 'task #2', teacher: teacher2 });
				const task3 = new Task({ name: 'task #3', teacher: teacher1, parent: course, lesson: lesson1 });
				const task4 = new Task({ name: 'task #4', teacher: teacher1, parent: course, lesson: lesson2 });
				const task5 = new Task({ name: 'task #5', teacher: teacher2, parent: course, lesson: lesson1 });
				const task6 = new Task({ name: 'task #6', teacher: teacher2, parent: course, lesson: lesson2 });

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
				const lesson = new Lesson({ course: course2, hidden: false });
				const task1 = new Task({ name: 'task #1', teacher, parent: course1 });
				const task2 = new Task({ name: 'task #2', teacher, parent: course2, lesson });

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
				const task = new Task({ name: 'task #1', teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({});
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it('should find no tasks when course ids are empty', async () => {
				const teacher = userFactory.build();
				const task = new Task({ name: 'task #1', teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
			it('should find no tasks when lesson ids are empty', async () => {
				const teacher = userFactory.build();
				const task = new Task({ name: 'task #1', teacher });

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
				const task1 = new Task({ name: 'task #1', teacher, private: true });
				const task2 = new Task({ name: 'task #2', teacher, private: false });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: true });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task1.id);
			});
			it('should filter tasks by draft status = false', async () => {
				const teacher = userFactory.build();
				const task1 = new Task({ name: 'task #1', teacher, private: true });
				const task2 = new Task({ name: 'task #2', teacher, private: false });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ teacherId: teacher.id }, { draft: false });
				expect(total).toEqual(1);
				expect(result[0].id).toEqual(task2.id);
			});
			it('should return tasks with both status when no filter is applied', async () => {
				const teacher = userFactory.build();
				const task1 = new Task({ name: 'task #1', teacher, private: true });
				const task2 = new Task({ name: 'task #2', teacher, private: false });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: dueDate1 });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: dueDate2 });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: dueDate1 });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: dueDate2 });
				const task3 = new Task({ name: 'task #3', teacher, dueDate: undefined });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: dueDate1 });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: dueDate2 });
				const task3 = new Task({ name: 'task #3', teacher, dueDate: undefined });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = new Task({ name: 'task #3', teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = new Task({ name: 'task #4', teacher, dueDate: undefined });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = new Task({ name: 'task #3', teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = new Task({ name: 'task #4', teacher, dueDate: undefined });

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
				const task1 = new Task({ name: 'task #1', teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = new Task({ name: 'task #2', teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = new Task({ name: 'task #3', teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = new Task({ name: 'task #4', teacher, dueDate: undefined });

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
			it('should populate the parent', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task = new Task({ name: 'task #1', teacher, parent: course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);

				expect(result[0].parent?.name).toEqual(course.name);
			});
			it('should populate the lesson', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = new Lesson({ course, hidden: false });
				const task = new Task({ name: 'task #1', teacher, parent: course, lesson });

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
				const task = new Task({ name: 'task #1', teacher, parent: course });
				task.submissions.add(new Submission({ task, student, comment: 'my solution to the task #1' }));

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result[0].submissions.length).toEqual(task.submissions.length);
				expect(result[0].submissions[0].id).toEqual(task.submissions[0].id);
				expect(result[0].submissions[0].createdAt).toEqual(task.submissions[0].createdAt);
			});
		});
	});
});
