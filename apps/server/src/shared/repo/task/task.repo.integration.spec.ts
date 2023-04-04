import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder, Task } from '@shared/domain';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import {
	cleanupCollections,
	courseFactory,
	courseGroupFactory,
	lessonFactory,
	submissionFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { TaskRepo } from './task.repo';

const yesterday = new Date(Date.now() - 86400000);
const tomorrow = new Date(Date.now() + 86400000);

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
		await cleanupCollections(em);
		await em.nativeDelete(Task, {});
	});

	it('should implement entityName getter', () => {
		expect(repo.entityName).toBe(Task);
	});

	describe('findAllByParentIds', () => {
		describe('find by assigned user', () => {
			const createStudent = (id: number) => {
				const student = userFactory.build({
					firstName: `Student ${id}`,
				});

				return student;
			};

			const createTeacher = (id: number) => {
				const student = userFactory.build({
					firstName: `Teacher ${id}`,
				});

				return student;
			};

			const setup = async () => {
				const teachers = [1, 2].map(createTeacher);
				const [teacher1, teacher2] = teachers;
				const students = [1, 2, 3, 4].map(createStudent);
				const [student1, student2, student3, student4] = students;
				const englishCourse = courseFactory.build({
					name: 'english',
					teachers,
					students: [student1, student2, student3],
				});
				const grammerLesson = lessonFactory.build({
					name: 'grammer',
					course: englishCourse,
				});
				const historyCourse = courseFactory.build({
					name: 'history',
					teachers: [teacher1],
					students: [student1, student2, student3],
				});
				const mathsCourse = courseFactory.build({
					name: 'maths',
					teachers: [teacher2],
					students: [student1, student2],
				});
				const algebraLesson = lessonFactory.build({
					name: 'maths',
					course: mathsCourse,
				});

				// create tasks
				const englishTask1 = taskFactory.build({
					name: 'Write an essay',
					course: englishCourse,
					users: [student1, student2],
					creator: teacher1,
				});
				const englishTask2 = taskFactory.build({
					name: 'grammer1',
					creator: teacher1,
					lesson: grammerLesson,
					users: [student1],
				});
				const englishTask3 = taskFactory.build({
					name: 'grammer2',
					creator: teacher1,
					lesson: grammerLesson,
					users: [],
				});
				const englishTask4 = taskFactory.build({
					name: 'grammer3',
					creator: teacher1,
					lesson: grammerLesson,
				});

				const historyTask1 = taskFactory.build({
					name: 'cause of ww2',
					course: historyCourse,
					users: [student1, student2],
				});

				const historyTask2 = taskFactory.build({
					name: 'fall of Rome',
					course: historyCourse,
					users: [student2, student3],
				});

				const historyTask3 = taskFactory.build({
					name: 'DDR culture',
					course: historyCourse,
				});

				const mathsTask1 = taskFactory.build({
					name: 'textbook page 12',
					course: mathsCourse,
					users: [student2],
				});

				const mathsTask2 = taskFactory.build({
					name: 'all primes under million',
					course: mathsCourse,
					users: [student3],
				});

				const mathsTask3 = taskFactory.build({
					name: 'algebra 1',
					lesson: algebraLesson,
					users: [student2],
				});

				await em.persistAndFlush([
					teacher1,
					teacher2,
					student1,
					student2,
					student3,
					student4,
					englishCourse,
					grammerLesson,
					historyCourse,
					mathsCourse,
					algebraLesson,
					englishTask1,
					englishTask2,
					englishTask3,
					englishTask4,
					historyTask1,
					historyTask2,
					historyTask3,
					mathsTask1,
					mathsTask2,
					mathsTask3,
				]);
				em.clear();

				return {
					teacher1,
					teacher2,
					student1,
					student2,
					student3,
					student4,
					englishCourse,
					grammerLesson,
					historyCourse,
					mathsCourse,
					algebraLesson,
					englishTask1,
					englishTask2,
					englishTask3,
					englishTask4,
					historyTask1,
					historyTask2,
					historyTask3,
					mathsTask1,
					mathsTask2,
					mathsTask3,
				};
			};

			it('Assigned users should not affect all courses', async () => {
				const { englishCourse, mathsCourse, historyCourse } = await setup();
				const [result, total] = await repo.findAllByParentIds({
					courseIds: [englishCourse.id, mathsCourse.id, historyCourse.id],
				});
				expect(total).toBe(6);
			});

			it('Filter by assigned users and courses', async () => {
				const { englishCourse, mathsCourse, historyCourse, student1 } = await setup();
				const [result, total] = await repo.findAllByParentIds(
					{
						courseIds: [englishCourse.id, mathsCourse.id, historyCourse.id],
					},
					{
						userId: student1.id,
					}
				);
				expect(total).toBe(3);
			});

			it('Filter by assigned users and lessons in same course', async () => {
				const { grammerLesson, algebraLesson, student1 } = await setup();
				const [result, total] = await repo.findAllByParentIds(
					{
						lessonIds: [grammerLesson.id, algebraLesson.id],
					},
					{
						userId: student1.id,
					}
				);
				expect(total).toBe(2);
				expect(result.map((r) => r.name)).toContain('grammer1');
				expect(result.map((r) => r.name)).toContain('grammer3');
			});

			it('Filter by assigned users and lessons in different courses', async () => {
				const { grammerLesson, algebraLesson, student2 } = await setup();

				const [result, total] = await repo.findAllByParentIds(
					{
						lessonIds: [grammerLesson.id, algebraLesson.id],
					},
					{
						userId: student2.id,
					}
				);
				expect(total).toBe(2);
				expect(result.map((r) => r.name)).toContain('algebra 1');
				expect(result.map((r) => r.name)).toContain('grammer3');
			});

			it('Filter by assigned users and lessons in different courses but with course fallback', async () => {
				const { grammerLesson, algebraLesson, student3 } = await setup();

				const [result, total] = await repo.findAllByParentIds(
					{
						lessonIds: [grammerLesson.id, algebraLesson.id],
					},
					{
						userId: student3.id,
					}
				);
				expect(total).toBe(1);
				expect(result.map((r) => r.name)).toContain('grammer3');
			});
		});

		describe('given populates are set correctly', () => {
			describe('when task parent is a user', () => {
				const setup = async () => {
					const creator = userFactory.build();
					const course = courseFactory.build();
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ creator, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { creator };
				};

				it('should populate all elements correctly', async () => {
					const { creator } = await setup();

					const [result, total] = await repo.findAllByParentIds({ creatorId: creator.id });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ course, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { course };
				};

				it('should populate all elements correctly', async () => {
					const { course } = await setup();

					const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const lesson = lessonFactory.build({ course });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson };
				};

				it('should populate all elements correctly', async () => {
					const { lesson } = await setup();

					const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a coursegroup lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const lesson = lessonFactory.build({ courseGroup });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson };
				};

				it('should populate all elements correctly', async () => {
					const { lesson } = await setup();

					const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.courseGroup).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});
		});

		describe('find by creator', () => {
			it('should find tasks by creatorId', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const task1 = taskFactory.build({ creator: teacher1 });
				const task2 = taskFactory.build({ creator: teacher2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher1.id });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});

			it('should not find tasks with a course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ creator: teacher, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not find tasks with a lesson assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ creator: teacher, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by courses', () => {
			it('should find tasks by course ids', async () => {
				const teacher = userFactory.build();
				const course1 = courseFactory.build();
				const course2 = courseFactory.build();
				const task1 = taskFactory.build({ creator: teacher, course: course1 });
				const task2 = taskFactory.build({ creator: teacher, course: course2 });

				await em.persistAndFlush([task1, task2]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course2.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task2.name);
			});

			it('should not find tasks with no course assigned', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const task1 = taskFactory.build({ creator: teacher, course });
				const task2 = taskFactory.build({ creator: teacher });

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
				const task = taskFactory.build({ creator: teacher, course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should not find private tasks', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ creator: user, course, private: true });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id] });
				expect(total).toBe(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by lessons', () => {
			it('should find tasks by lesson ids', async () => {
				const teacher = userFactory.build();
				const course = courseFactory.build();
				const lesson1 = lessonFactory.build({ course, hidden: false });
				const lesson2 = lessonFactory.build({ course, hidden: false });
				const task1 = taskFactory.build({ creator: teacher, course, lesson: lesson1 });
				const task2 = taskFactory.build({ creator: teacher, course, lesson: lesson2 });

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
				const task1 = taskFactory.build({ creator: teacher, course, lesson });
				const task2 = taskFactory.build({ creator: teacher, course });
				const task3 = taskFactory.build({ creator: teacher });

				await em.persistAndFlush([task1, task2, task3]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
				expect(total).toEqual(1);
				expect(result[0].name).toEqual(task1.name);
			});

			it('should not find private tasks', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ creator: user, course, lesson, private: true });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [lesson.id] });
				expect(total).toBe(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by teacher and courses', () => {
			it('should find tasks by teacher and courses', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const course1 = courseFactory.build();
				const course2 = courseFactory.build();
				const task1 = taskFactory.build({ creator: teacher1 });
				const task2 = taskFactory.build({ creator: teacher2 });
				const task3 = taskFactory.build({ creator: teacher1, course: course1 });
				const task4 = taskFactory.build({ creator: teacher1, course: course2 });
				const task5 = taskFactory.build({ creator: teacher2, course: course1 });
				const task6 = taskFactory.build({ creator: teacher2, course: course2 });

				await em.persistAndFlush([task1, task2, task3, task4, task5, task6]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher1.id, courseIds: [course2.id] });
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
				const task = taskFactory.build({ creator: teacher, course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id, courseIds: [course.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find private tasks created by the user', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ creator: user, course, private: true });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: user.id, courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});

			it('should not find private tasks created by other users', async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ creator: otherUser, course, private: true });

				await em.persistAndFlush([user, task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: user.id, courseIds: [course.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find unavailable tasks created by the user', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ creator: user, course, availableDate: tomorrow });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: user.id, courseIds: [course.id] });
				expect(total).toEqual(1);
				expect(result).toHaveLength(1);
			});
		});

		describe('find by teacher and lessons', () => {
			it('should find tasks by teacher and lessons', async () => {
				const teacher1 = userFactory.build();
				const teacher2 = userFactory.build();
				const course = courseFactory.build();
				const lesson1 = lessonFactory.build({ course, hidden: false });
				const lesson2 = lessonFactory.build({ course, hidden: false });
				const task1 = taskFactory.build({ creator: teacher1 });
				const task2 = taskFactory.build({ creator: teacher2 });
				const task3 = taskFactory.build({ creator: teacher1, course, lesson: lesson1 });
				const task4 = taskFactory.build({ creator: teacher1, course, lesson: lesson2 });
				const task5 = taskFactory.build({ creator: teacher2, course, lesson: lesson1 });
				const task6 = taskFactory.build({ creator: teacher2, course, lesson: lesson2 });

				await em.persistAndFlush([task1, task2, task3, task4, task5, task6]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher2.id, lessonIds: [lesson1.id] });
				expect(total).toEqual(3);
				const taskNames = result.map((o) => o.name);
				expect(taskNames.includes(task2.name)).toBe(true);
				expect(taskNames.includes(task3.name)).toBe(true);
				expect(taskNames.includes(task5.name)).toBe(true);
			});

			it('should not find private tasks created by other users', async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ creator: otherUser, course, private: true });

				await em.persistAndFlush([user, task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: user.id, lessonIds: [lesson.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by courses and lessons', () => {
			it('should find tasks by courses and lessons', async () => {
				const teacher = userFactory.build();
				const course1 = courseFactory.build({ name: 'course #1' });
				const course2 = courseFactory.build({ name: 'course #2' });
				const lesson = lessonFactory.build({ course: course2, hidden: false });
				const task1 = taskFactory.build({ creator: teacher, course: course1 });
				const task2 = taskFactory.build({ creator: teacher, course: course2, lesson });

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

			it('should not find private tasks created by other users', async () => {
				const otherUser = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course, hidden: false });
				const task = taskFactory.build({ creator: otherUser, course, private: true });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [course.id], lessonIds: [lesson.id] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('find by empty ids', () => {
			it('should find no tasks when no ids are given at all', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ creator: teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({});
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find no tasks when course ids are empty', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ creator: teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ courseIds: [] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});

			it('should find no tasks when lesson ids are empty', async () => {
				const teacher = userFactory.build();
				const task = taskFactory.build({ creator: teacher });

				await em.persistAndFlush([task]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ lessonIds: [] });
				expect(total).toEqual(0);
				expect(result).toHaveLength(0);
			});
		});

		describe('filters', () => {
			describe('when due date filter is applied', () => {
				it('should filter tasks by dueDate after a given date', async () => {
					const teacher = userFactory.build();
					const threeWeeksinMilliseconds = 1.814e9;
					const dueDate1 = new Date(Date.now() - threeWeeksinMilliseconds);
					const dueDate2 = new Date();
					const task1 = taskFactory.build({ creator: teacher, dueDate: dueDate1 });
					const task2 = taskFactory.build({ creator: teacher, dueDate: dueDate2 });

					await em.persistAndFlush([task1, task2]);
					em.clear();

					const oneWeekInMilliseconds = 6.048e8;

					const [result, total] = await repo.findAllByParentIds(
						{ creatorId: teacher.id },
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
					const task1 = taskFactory.build({ creator: teacher, dueDate: dueDate1 });
					const task2 = taskFactory.build({ creator: teacher, dueDate: dueDate2 });
					const task3 = taskFactory.build({ creator: teacher, dueDate: undefined });

					await em.persistAndFlush([task1, task2, task3]);
					em.clear();

					const oneWeekInMilliseconds = 6.048e8;

					const [result, total] = await repo.findAllByParentIds(
						{ creatorId: teacher.id },
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
					const task1 = taskFactory.build({ creator: teacher, dueDate: dueDate1 });
					const task2 = taskFactory.build({ creator: teacher, dueDate: dueDate2 });
					const task3 = taskFactory.build({ creator: teacher, dueDate: undefined });

					await em.persistAndFlush([task1, task2, task3]);
					em.clear();

					const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id });
					expect(total).toEqual(3);
					const taskNames = result.map((o) => o.name);
					expect(taskNames.includes(task1.name)).toBe(true);
					expect(taskNames.includes(task2.name)).toBe(true);
					expect(taskNames.includes(task3.name)).toBe(true);
				});
			});

			describe('when availability filter is applied', () => {
				it('should return available and unavailable tasks created by the user', async () => {
					const teacher = userFactory.build();
					const task1 = taskFactory.build({ creator: teacher, availableDate: yesterday });
					const task2 = taskFactory.build({ creator: teacher, availableDate: tomorrow });

					await em.persistAndFlush([task1, task2]);
					em.clear();

					const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id }, { availableOn: new Date() });
					expect(total).toEqual(2);
					expect(result[0].name).toEqual(task1.name);
					expect(result[1].name).toEqual(task2.name);
				});

				it('should return only available tasks created by other users', async () => {
					const teacher = userFactory.build();
					const course = courseFactory.build();
					const task1 = taskFactory.build({ creator: teacher, course, availableDate: yesterday });
					const task2 = taskFactory.build({ creator: teacher, course, availableDate: tomorrow });

					await em.persistAndFlush([task1, task2]);
					em.clear();

					const [result, total] = await repo.findAllByParentIds(
						{ courseIds: [course.id] },
						{ availableOn: new Date() }
					);
					expect(total).toEqual(1);
					expect(result[0].name).toEqual(task1.name);
				});
			});

			describe('when userId filter is applied', () => {
				const setup = async () => {
					const teacher = userFactory.build();
					const student1 = userFactory.build();
					const student2 = userFactory.build();
					const course = courseFactory.build({ teachers: [teacher], students: [student1, student2] });
					const task1 = taskFactory.build({ course, creator: teacher, users: [student1, student2] });
					const task2 = taskFactory.build({ course, creator: teacher, users: [student2] });
					await em.persistAndFlush([task1, task2]);
					em.clear();
					return { teacher, student1, student2, course, task1, task2 };
				};

				it('should filter tasks by assigned user', async () => {
					const { student1, student2, course } = await setup();

					const [, totalStudent1] = await repo.findAllByParentIds({ courseIds: [course.id] }, { userId: student1.id });

					const [, totalStudent2] = await repo.findAllByParentIds({ courseIds: [course.id] }, { userId: student2.id });

					expect(totalStudent1).toEqual(1);
					expect(totalStudent2).toEqual(2);
				});

				it('should return tasks when userId filter is not applied', async () => {
					const { course } = await setup();

					const [, totalStudent1] = await repo.findAllByParentIds({ courseIds: [course.id] }, {});

					const [, totalStudent2] = await repo.findAllByParentIds({ courseIds: [course.id] });

					expect(totalStudent1).toEqual(2);
					expect(totalStudent2).toEqual(2);
				});
			});
		});

		describe('order', () => {
			it('should order by dueDate asc', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ creator: teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id }, undefined, {
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
				const task1 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ creator: teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id }, undefined, {
					order: { dueDate: SortOrder.desc },
				});
				expect(total).toEqual(4);
				expect(result[0].id).toEqual(task2.id);
				expect(result[1].id).toEqual(task1.id);
				expect(result[2].id).toEqual(task3.id);
				expect(result[3].id).toEqual(task4.id);
			});

			it('should order by id asc when no dueDate is set', async () => {
				const teacher = userFactory.build();
				const tasks: Task[] = taskFactory.buildList(30, { creator: teacher, dueDate: undefined });
				await em.persistAndFlush(tasks);
				em.clear();

				const [result] = await repo.findAllByParentIds({ creatorId: teacher.id }, undefined, {
					order: { dueDate: SortOrder.asc },
				});

				const resultIds = result.map((task) => task.id);
				const taskIds = tasks.map((task) => task.id).sort();

				expect(resultIds).toEqual(taskIds);
			});
		});

		describe('pagination', () => {
			it('should skip and limit to the given number of records', async () => {
				const teacher = userFactory.build();
				const task1 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 2000) });
				const task2 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 3000) });
				const task3 = taskFactory.build({ creator: teacher, dueDate: new Date(Date.now() + 1000) });
				const task4 = taskFactory.build({ creator: teacher, dueDate: undefined });

				await em.persistAndFlush([task1, task2, task3, task4]);
				em.clear();

				const [result, total] = await repo.findAllByParentIds({ creatorId: teacher.id }, undefined, {
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
				const task = taskFactory.build({ creator: teacher, course });

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
				const task = taskFactory.build({ creator: teacher, course, lesson });

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
				const task = taskFactory.build({ creator: teacher, course });
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

		describe('when filter finished is false', () => {
			it('should find task when the task creator has moved it to archived', async () => {
				const creator = userFactory.build();
				const teacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator] });
				const task = taskFactory.build({ creator, course, finished: [creator] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: teacher.id, value: false };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(1);
			});

			it('should "not" find task when teacher that is "not" the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const teacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator, teacher] });
				const task = taskFactory.build({ creator, course, finished: [teacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: teacher.id, value: false };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(0);
			});

			it('should "not" find task when substitiution teacher that is "not" the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const substitutionTeacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], substitutionTeachers: [substitutionTeacher] });
				const task = taskFactory.build({ creator, course, finished: [substitutionTeacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: substitutionTeacher.id, value: false };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(0);
			});

			it('should "not" find task when student moved this task to archived', async () => {
				const creator = userFactory.build();
				const student = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], students: [student] });
				const task = taskFactory.build({ creator, course, finished: [student] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: student.id, value: false };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(0);
			});
		});

		describe('when filter finished is true', () => {
			it('should not find task when the task creator has moved it to archived', async () => {
				const creator = userFactory.build();
				const teacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator] });
				const task = taskFactory.build({ creator, course, finished: [creator] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: teacher.id, value: true };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(0);
			});

			it('should find task when teacher that is not the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const teacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator, teacher] });
				const task = taskFactory.build({ creator, course, finished: [teacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: teacher.id, value: true };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(1);
			});

			it('should find task when substitiution teacher that is not the creator moved this task to archived', async () => {
				const creator = userFactory.build();
				const substitutionTeacher = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], substitutionTeachers: [substitutionTeacher] });
				const task = taskFactory.build({ creator, course, finished: [substitutionTeacher] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: substitutionTeacher.id, value: true };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(1);
			});

			it('should find task when student moved this task to archived', async () => {
				const creator = userFactory.build();
				const student = userFactory.build();
				const course = courseFactory.build({ teachers: [creator], students: [student] });
				const task = taskFactory.build({ creator, course, finished: [student] });

				await em.persistAndFlush([task]);
				em.clear();

				const finished = { userId: student.id, value: true };
				const [, total] = await repo.findAllByParentIds({ courseIds: [course.id] }, { finished });

				expect(total).toEqual(1);
			});
		});
	});

	describe('findAllFinishedByParentIds', () => {
		describe('with filters', () => {
			describe('with assigned users filter', () => {
				const setup = () => {
					const teacher = userFactory.build();
					const student1 = userFactory.build();
					const student2 = userFactory.build();
					const course = courseFactory.build();

					const task1 = taskFactory.build({
						creator: teacher,
						course,
						finished: [teacher, student1, student2],
						users: [student1, student2],
					});
					const task2 = taskFactory.build({
						creator: teacher,
						course,
						finished: [teacher, student1, student2],
						users: [student2],
					});
					const task3 = taskFactory.build({
						creator: teacher,
						course,
						finished: [teacher, student1, student2],
					});
					const task4 = taskFactory.build({
						creator: teacher,
						course,
						finished: [],
						users: [student1, student2],
					});
					const task5 = taskFactory.build({
						creator: teacher,
						course,
						finished: [teacher, student1, student2],
						users: [],
					});

					return { teacher, student1, student2, course, task1, task2, task3, task4, task5 };
				};

				it('should return tasks for assigned users', async () => {
					const { course, student1, student2, task1, task2, task3 } = setup();

					await em.persistAndFlush([task1, task2, task3]);
					em.clear();

					const [, totalStudent1] = await repo.findAllFinishedByParentIds(
						{
							creatorId: student1.id,
							openCourseIds: [course.id],
							lessonIdsOfOpenCourses: [],
							finishedCourseIds: [],
							lessonIdsOfFinishedCourses: [],
						},
						{
							userId: student1.id,
						}
					);
					expect(totalStudent1).toEqual(2);
					const [, totalStudent2] = await repo.findAllFinishedByParentIds(
						{
							creatorId: student1.id,
							openCourseIds: [course.id],
							lessonIdsOfOpenCourses: [],
							finishedCourseIds: [],
							lessonIdsOfFinishedCourses: [],
						},
						{
							userId: student2.id,
						}
					);
					expect(totalStudent2).toEqual(3);
				});

				it('should should not return tasks to which student is assigned, but are not finished', async () => {
					const { course, teacher, student1, task4 } = setup();

					await em.persistAndFlush([task4]);
					em.clear();

					const [, totalStudent1] = await repo.findAllFinishedByParentIds(
						{
							creatorId: teacher.id,
							openCourseIds: [course.id],
							lessonIdsOfOpenCourses: [],
							finishedCourseIds: [],
							lessonIdsOfFinishedCourses: [],
						},
						{
							userId: student1.id,
						}
					);
					expect(totalStudent1).toEqual(0);
				});

				it('should not return tasks finished, but for which student is not assigned (should not happen, but data could be inconsistent)', async () => {
					const { course, teacher, student1, task5 } = setup();

					await em.persistAndFlush([task5]);
					em.clear();

					const [, totalStudent1] = await repo.findAllFinishedByParentIds(
						{
							creatorId: teacher.id,
							openCourseIds: [course.id],
							lessonIdsOfOpenCourses: [],
							finishedCourseIds: [],
							lessonIdsOfFinishedCourses: [],
						},
						{
							userId: student1.id,
						}
					);
					expect(totalStudent1).toEqual(0);
				});
			});
		});

		describe('given populates are set correctly', () => {
			describe('when task parent is a user', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build();
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.finished(user).build({ creator: user, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { user };
				};

				it('should populate all elements correctly', async () => {
					const { user } = await setup();

					const [result, total] = await repo.findAllFinishedByParentIds(
						{
							creatorId: user.id,
							openCourseIds: [],
							lessonIdsOfOpenCourses: [],
							finishedCourseIds: [],
							lessonIdsOfFinishedCourses: [],
						},
						{}
					);
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.finished(user).build({ course, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { course, user };
				};

				it('should populate all elements correctly', async () => {
					const { course, user } = await setup();

					const [result, total] = await repo.findAllFinishedByParentIds({
						creatorId: user.id,
						openCourseIds: [course.id],
						lessonIdsOfOpenCourses: [],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					});
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const lesson = lessonFactory.build({ course });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.finished(user).build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson, user };
				};

				it('should populate all elements correctly', async () => {
					const { lesson, user } = await setup();

					const [result, total] = await repo.findAllFinishedByParentIds({
						creatorId: user.id,
						openCourseIds: [],
						lessonIdsOfOpenCourses: [lesson.id],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					});
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a coursegroup lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const lesson = lessonFactory.build({ courseGroup });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.finished(user).build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson, user };
				};

				it('should populate all elements correctly', async () => {
					const { lesson, user } = await setup();

					const [result, total] = await repo.findAllFinishedByParentIds({
						creatorId: user.id,
						openCourseIds: [],
						lessonIdsOfOpenCourses: [lesson.id],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					});
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.courseGroup).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});
		});

		describe('when course is finished', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.isFinished().build();

				return { user, course };
			};

			it('should find open tasks of a course', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should find open tasks of lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ lesson, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [lesson.id],
				});

				expect(total).toEqual(1);
			});

			it('should find finished tasks of lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ lesson, course, finished: [user] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [lesson.id],
				});

				expect(total).toEqual(1);
			});

			it('should find finished tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course, finished: [user] });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should find open draft tasks of users', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft().build({ course, creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should find finished draft tasks of users', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft().finished(user).build({ course, creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should "not" find finished draft tasks of other users', async () => {
				const { user, course } = setup();
				const otherUser = userFactory.build();
				const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});
		});

		describe('when course is open', () => {
			const setup = () => {
				const user = userFactory.build();
				const course = courseFactory.isOpen().build({ students: [user] });

				return { user, course };
			};

			it('should "not" find open tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should "not" find open tasks of lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ lesson, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [lesson.id],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should find finished tasks of lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.finished(user).build({ lesson, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [lesson.id],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should find finished tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should "not" find open draft tasks of users', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft().build({ course, creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should find finished draft tasks of users', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft().finished(user).build({ course, creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should "not" find finished draft tasks of other users', async () => {
				const { user, course } = setup();
				const otherUser = userFactory.build();
				const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [course.id],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});
		});

		describe('when course has no untilDate (means it is still open)', () => {
			const setup = () => {
				const untilDate = undefined;
				const user = userFactory.build();
				const course = courseFactory.build({ untilDate, students: [user] });

				return { user, course };
			};

			it('should "not" find open tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should "not" find open tasks of lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ lesson, course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [lesson.id],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});
		});

		describe('when parent is "not" passed', () => {
			it('should "not" find finished tasks', async () => {
				const user = userFactory.build();
				const course = courseFactory.build({ students: [] });
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should "not" find finished tasks of creator', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course, finished: [user], creator: user });
				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should "not" find finished tasks of creator with lesson', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const lesson = lessonFactory.build({ course });
				const task = taskFactory.build({ course, lesson, finished: [user], creator: user });
				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});
		});

		describe('when task has no parent', () => {
			it('should find finished draft tasks of creator', async () => {
				const user = userFactory.build();
				const task = taskFactory.finished(user).draft().build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should "not" find finished draft tasks of other users', async () => {
				const user = userFactory.build();
				const otherUser = userFactory.build();
				const task = taskFactory.finished(user).draft().build({ creator: otherUser });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should find finished tasks of creator', async () => {
				const user = userFactory.build();
				const task = taskFactory.finished(user).build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(1);
			});

			it('should "not" find open draft tasks of creator', async () => {
				const user = userFactory.build();
				const task = taskFactory.draft().build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});

			it('should "not" find open tasks of creator', async () => {
				const user = userFactory.build();
				const task = taskFactory.build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				const [, total] = await repo.findAllFinishedByParentIds({
					creatorId: user.id,
					openCourseIds: [],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				});

				expect(total).toEqual(0);
			});
		});

		describe('when pagination is passed', () => {
			const setup = (taskCount: number) => {
				const user = userFactory.build();
				const course = courseFactory.build({ untilDate: undefined });
				const tasks = taskFactory.buildList(taskCount, { course, finished: [user] });

				return { user, course, tasks };
			};

			it('should work for skip', async () => {
				const { user, course, tasks } = setup(10);

				await em.persistAndFlush(tasks);
				em.clear();

				const [result, total] = await repo.findAllFinishedByParentIds(
					{
						creatorId: user.id,
						openCourseIds: [course.id],
						lessonIdsOfOpenCourses: [],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					},
					{},
					{ pagination: { skip: 5 } }
				);

				expect(result).toHaveLength(5);
				expect(total).toEqual(10);
			});

			it('should work for limit', async () => {
				const { user, course, tasks } = setup(10);

				await em.persistAndFlush(tasks);
				em.clear();

				const [result, total] = await repo.findAllFinishedByParentIds(
					{
						creatorId: user.id,
						openCourseIds: [course.id],
						lessonIdsOfOpenCourses: [],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					},
					{},
					{ pagination: { limit: 5 } }
				);

				expect(result).toHaveLength(5);
				expect(total).toEqual(10);
			});

			it('should work for combined limit and skip', async () => {
				const { user, course, tasks } = setup(15);

				await em.persistAndFlush(tasks);
				em.clear();

				const [result, total] = await repo.findAllFinishedByParentIds(
					{
						creatorId: user.id,
						openCourseIds: [course.id],
						lessonIdsOfOpenCourses: [],
						finishedCourseIds: [],
						lessonIdsOfFinishedCourses: [],
					},
					{},
					{ pagination: { limit: 5, skip: 5 } }
				);

				expect(result).toHaveLength(5);
				expect(total).toEqual(15);
			});
		});

		it('should sort result by newest dueDate', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ untilDate: undefined });

			const dateSec = (sec) => new Date(Date.now() - sec * 1000);
			const task1 = taskFactory.build({ course, finished: [user], dueDate: dateSec(60) });
			const task2 = taskFactory.build({ course, finished: [user], dueDate: dateSec(90) });
			const task3 = taskFactory.build({ course, finished: [user], dueDate: dateSec(120) });
			const task4 = taskFactory.build({ course, finished: [user], dueDate: dateSec(30) });

			await em.persistAndFlush([task1, task2, task3, task4]);
			em.clear();

			const [tasks] = await repo.findAllFinishedByParentIds(
				{
					creatorId: user.id,
					openCourseIds: [course.id],
					lessonIdsOfOpenCourses: [],
					finishedCourseIds: [],
					lessonIdsOfFinishedCourses: [],
				},
				{},
				{ order: { dueDate: SortOrder.desc } }
			);

			expect(tasks.map((t) => t.id)).toEqual([task4.id, task1.id, task2.id, task3.id]);
		});

		it('should sort it by _id if dueDate is similar.', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ untilDate: undefined });

			const dueDate = new Date();
			const task1 = taskFactory.build({ course, finished: [user], dueDate });
			const task2 = taskFactory.build({ course, finished: [user], dueDate });
			const task3 = taskFactory.build({ course, finished: [user], dueDate });
			const task4 = taskFactory.build({ course, finished: [user], dueDate });

			await em.persistAndFlush([task1, task2, task3, task4]);
			em.clear();

			const [tasks] = await repo.findAllFinishedByParentIds({
				creatorId: user.id,
				openCourseIds: [course.id],
				lessonIdsOfOpenCourses: [],
				finishedCourseIds: [],
				lessonIdsOfFinishedCourses: [],
			});

			expect(tasks.map((t) => t.id)).toEqual([task1.id, task2.id, task3.id, task4.id].sort());
		});

		it('should populate course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user], name: 'test' });
			const task = taskFactory.finished(user).build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			const [tasks] = await repo.findAllFinishedByParentIds({
				creatorId: user.id,
				openCourseIds: [course.id],
				lessonIdsOfOpenCourses: [],
				finishedCourseIds: [],
				lessonIdsOfFinishedCourses: [],
			});

			expect(tasks).toHaveLength(1);
			expect(tasks[0].course?.name).toEqual('test');
		});

		it('should populate lesson', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ teachers: [user] });
			const lesson = lessonFactory.build({ course, name: 'test' });
			const task = taskFactory.finished(user).build({ course, lesson });

			await em.persistAndFlush([task]);
			em.clear();

			const [tasks] = await repo.findAllFinishedByParentIds({
				creatorId: user.id,
				openCourseIds: [],
				lessonIdsOfOpenCourses: [lesson.id],
				finishedCourseIds: [],
				lessonIdsOfFinishedCourses: [],
			});

			expect(tasks).toHaveLength(1);
			expect(tasks[0].lesson?.name).toEqual('test');
		});

		it('should populate submissions of task', async () => {
			const user = userFactory.build();
			const course = courseFactory.build({ students: [user] });
			const lesson = lessonFactory.build({ course });
			const task = taskFactory.finished(user).build({ course, lesson });
			const submission = submissionFactory.build({ task, student: user, comment: 'test' });

			await em.persistAndFlush([task, submission]);
			em.clear();

			const [tasks] = await repo.findAllFinishedByParentIds({
				creatorId: user.id,
				openCourseIds: [],
				lessonIdsOfOpenCourses: [lesson.id],
				finishedCourseIds: [],
				lessonIdsOfFinishedCourses: [],
			});

			expect(tasks).toHaveLength(1);
			expect(tasks[0].submissions).toHaveLength(1);
			expect(tasks[0].submissions[0]?.comment).toEqual('test');
		});
	});

	describe('findBySingleParent', () => {
		/* need to be fixed input params or names not correctly
		describe('given populates are set correctly', () => {
			describe('when task parent is a user', () => {
				const setup = async () => {
					const creator = userFactory.build();
					const course = courseFactory.build();
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ creator, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { creator };
				};

				it('should populate all elements correctly', async () => {
					const { creator } = await setup();

					const [result, total] = await repo.findBySingleParent({ creatorId: creator.id });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ course, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { course };
				};

				it('should populate all elements correctly', async () => {
					const { course } = await setup();

					const [result, total] = await repo.findBySingleParent({ courseId: course.id });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const lesson = lessonFactory.build({ course });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson };
				};

				it('should populate all elements correctly', async () => {
					const { lesson } = await setup();

					const [result, total] = await repo.findBySingleParent({ lessonId: lesson.id });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.course).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a coursegroup lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const lesson = lessonFactory.build({ courseGroup });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { lesson };
				};

				it('should populate all elements correctly', async () => {
					const { lesson } = await setup();

					const [result, total] = await repo.findBySingleParent({ lessonId: lesson.id });
					const task = result[0];

					expect(total).toEqual(1);
					expect(task.lesson).toBeDefined();
					expect(task.lesson?.courseGroup).toBeDefined();
					expect(task.submissions).toBeDefined();
					expect(task.submissions[0].courseGroup).toBeDefined();
				});
			});
		});
		*/

		it('should find all published tasks in course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const task = taskFactory.build({ course });

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id);

			expect(tasks).toHaveLength(1);
		});

		it('should "not" find tasks out of course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const task = taskFactory.build();

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id);

			expect(tasks).toHaveLength(0);
		});

		it('should find drafts', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const task = taskFactory.draft().build({ creator: user, course });

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id);

			expect(tasks).toHaveLength(1);
		});

		it('should "not" find tasks of a lesson in the course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const lesson = lessonFactory.build({ course });
			const task = taskFactory.build({ course, lesson });

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id);

			expect(tasks).toHaveLength(0);
		});

		it('should find all published future tasks in course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const threeWeeksinMilliseconds = 1.814e9;
			const task = taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id);

			expect(tasks).toHaveLength(1);
		});

		it('should "not" find all published future tasks in course', async () => {
			const user = userFactory.build();
			const course = courseFactory.build();
			const threeWeeksinMilliseconds = 1.814e9;
			const task = taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

			await em.persistAndFlush([user, course, task]);

			const [tasks] = await repo.findBySingleParent(user.id, course.id, { noFutureAvailableDate: true });

			expect(tasks).toHaveLength(0);
		});

		describe('when drafts are included', () => {
			it('should return draft', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.draft().build({ course, creator: user });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: true });

				expect(tasks).toHaveLength(1);
			});

			it('should also find published task', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: true });

				expect(tasks).toHaveLength(1);
			});
		});

		describe('when drafts are excluded', () => {
			it('should "not" return draft', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.draft().build({ course, creator: user });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: false });

				expect(tasks).toHaveLength(0);
			});

			it('should find published tasks in course', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: false });

				expect(tasks).toHaveLength(1);
			});
		});

		describe('when future drafts are present', () => {
			it('should return future draft', async () => {
				const user = userFactory.build();
				const course = courseFactory.build({ teachers: [user] });
				const threeWeeksinMilliseconds = 1.814e9;
				const task = taskFactory
					.draft()
					.build({ course, creator: user, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: true });

				expect(tasks).toHaveLength(1);
			});

			it('should "not" return future draft', async () => {
				const user = userFactory.build();
				const course = courseFactory.build({ teachers: [user] });
				const threeWeeksinMilliseconds = 1.814e9;
				const task = taskFactory
					.draft()
					.build({ course, creator: user, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: true, noFutureAvailableDate: true });

				expect(tasks).toHaveLength(0);
			});
		});

		describe('when future drafts are excluded', () => {
			it('should find published future tasks in course', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const threeWeeksinMilliseconds = 1.814e9;
				const task = taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, { draft: false });

				expect(tasks).toHaveLength(1);
			});

			it('should "not" find published future tasks in course', async () => {
				const user = userFactory.build();
				const course = courseFactory.build();
				const threeWeeksinMilliseconds = 1.814e9;
				const task = taskFactory.build({ course, availableDate: new Date(Date.now() + threeWeeksinMilliseconds) });

				await em.persistAndFlush([user, course, task]);

				const [tasks] = await repo.findBySingleParent(user.id, course.id, {
					draft: false,
					noFutureAvailableDate: true,
				});

				expect(tasks).toHaveLength(0);
			});
		});
	});

	describe('findById', () => {
		describe('given populates are set correctly', () => {
			describe('when task parent is a user', () => {
				const setup = async () => {
					const creator = userFactory.build();
					const course = courseFactory.build();
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ creator, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { task };
				};

				it('should populate all elements correctly', async () => {
					const { task } = await setup();

					const result = await repo.findById(task.id);

					expect(result.submissions).toBeDefined();
					expect(result.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ course, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { task };
				};

				it('should populate all elements correctly', async () => {
					const { task } = await setup();

					const result = await repo.findById(task.id);

					expect(result.course).toBeDefined();
					expect(result.submissions).toBeDefined();
					expect(result.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a course lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const lesson = lessonFactory.build({ course });
					const courseGroup = courseGroupFactory.build({ course });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { task };
				};

				it('should populate all elements correctly', async () => {
					const { task } = await setup();

					const result = await repo.findById(task.id);

					expect(result.lesson).toBeDefined();
					expect(result.lesson?.course).toBeDefined();
					expect(result.submissions).toBeDefined();
					expect(result.submissions[0].courseGroup).toBeDefined();
				});
			});

			describe('when task parent is a coursegroup lesson', () => {
				const setup = async () => {
					const user = userFactory.build();
					const course = courseFactory.build({ teachers: [user] });
					const courseGroup = courseGroupFactory.build({ course });
					const lesson = lessonFactory.build({ courseGroup });
					const submission = submissionFactory.build({ courseGroup });

					const task = taskFactory.build({ lesson, submissions: [submission] });

					await em.persistAndFlush([task]);
					em.clear();

					return { task };
				};

				it('should populate all elements correctly', async () => {
					const { task } = await setup();

					const result = await repo.findById(task.id);

					expect(result.lesson).toBeDefined();
					expect(result.lesson?.courseGroup).toBeDefined();
					expect(result.submissions).toBeDefined();
					expect(result.submissions[0].courseGroup).toBeDefined();
				});
			});
		});

		it('should find a task by its id', async () => {
			const task = taskFactory.build({ name: 'important task' });
			await em.persistAndFlush(task);
			em.clear();

			const foundTask = await repo.findById(task.id);
			expect(foundTask.name).toEqual('important task');
		});

		it('should throw error if the task cannot be found by id', async () => {
			const unknownId = new ObjectId().toHexString();
			await expect(async () => {
				await repo.findById(unknownId);
			}).rejects.toThrow();
		});
	});
});
