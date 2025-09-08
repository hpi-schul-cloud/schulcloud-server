import { EntityManager } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { lessonFactory } from '@modules/lesson/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { taskFactory } from '../../testing';
import { TaskListResponse } from '../dto/task.response';

describe('Task controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let apiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		apiClient = new TestApiClient(app, '/tasks/finished');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('task/finished without permission', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		it('should return status 401', async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const task = taskFactory.finished(teacherUser).build({ creator: teacherUser });

			await em.persistAndFlush([task, teacherAccount, teacherUser]);
			em.clear();

			const response = await apiClient.get();

			expect(response.status).toEqual(401);
		});
	});

	describe('task/finished as a teacher', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		it('should "not" find task if the user is not part of the parent anymore.', async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [] });
			const task = taskFactory.finished(teacherUser).build({ course });

			await em.persistAndFlush([task, teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);
			const response = await loggedInClient.get();
			const result = response.body as TaskListResponse;

			expect(result.total).toEqual(0);
		});

		it('should return finished tasks of user', async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });
			const task = taskFactory.finished(teacherUser).build({ course });

			await em.persistAndFlush([task, teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);
			const response = await loggedInClient.get();
			const result = response.body as TaskListResponse;

			expect(result.total).toEqual(1);
		});

		it('should return status for privileged members if user has write permission in for tasks', async () => {
			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ substitutionTeachers: [teacherUser] });
			const task = taskFactory.finished(teacherUser).build({ course });

			await em.persistAndFlush([task, teacherAccount, teacherUser]);
			em.clear();

			const loggedInClient = await apiClient.login(teacherAccount);
			const response = await loggedInClient.get();
			const result = response.body as TaskListResponse;

			expect(result.data).toHaveLength(1);
			// can only be true for privileged status
			expect(result.data[0].status.isSubstitutionTeacher).toBe(true);
		});
	});

	describe('task/finished as a student', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		describe('api endpoint', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should possible to open it', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(200);
			});

			it('should return a paginated result', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});
		});

		describe('when user is the creator', () => {
			it('should return finished tasks', async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const task = taskFactory.finished(studentUser).build({ creator: studentUser });

				await em.persistAndFlush([task, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should return finished draft tasks', async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const task = taskFactory.finished(studentUser).draft().build({ creator: studentUser });

				await em.persistAndFlush([task, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(1);
			});

			it('should "not" return open tasks', async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const task = taskFactory.build({ creator: studentUser });

				await em.persistAndFlush([task, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await apiClient.login(studentAccount);
				const response = await loggedInClient.get();
				const result = response.body as TaskListResponse;

				expect(result.total).toEqual(0);
			});
		});

		describe('when user has write permission in course', () => {
			describe('when courses are finised', () => {
				const setup = () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseEntityFactory.isFinished().build({ teachers: [studentUser] });

					return { course, studentAccount, studentUser };
				};

				it('should return tasks of courses', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return open draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return finished draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const { studentAccount: otherAccount, studentUser: otherUser } = UserAndAccountTestFactory.buildStudent();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: otherUser });

					await em.persistAndFlush([task, studentAccount, studentUser, otherAccount, otherUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.finished(studentUser).build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});
			});

			describe('when courses are open', () => {
				const setup = () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseEntityFactory.isOpen().build({ teachers: [studentUser] });

					return { course, studentAccount, studentUser };
				};

				it('should "not" return tasks of courses', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should "not" return tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const { studentAccount: otherAccount, studentUser: otherUser } = UserAndAccountTestFactory.buildStudent();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: otherUser });

					await em.persistAndFlush([task, studentAccount, studentUser, otherAccount, otherUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.finished(studentUser).build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});
			});
		});

		describe('when user has read permission in course', () => {
			describe('when courses are finised', () => {
				const setup = () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseEntityFactory.isFinished().build({ students: [studentUser] });

					return { course, studentAccount, studentUser };
				};

				it('should return tasks of courses', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should "not" return finished tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return open draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should return finished draft tasks of user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const { studentAccount: otherAccount, studentUser: otherUser } = UserAndAccountTestFactory.buildStudent();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: otherUser });

					await em.persistAndFlush([task, studentAccount, studentUser, otherAccount, otherUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.finished(studentUser).build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});
			});

			describe('when courses are open', () => {
				const setup = () => {
					const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
					const course = courseEntityFactory.isOpen().build({ students: [studentUser] });

					return { course, studentAccount, studentUser };
				};

				it('should "not" return tasks of courses', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should "not" return tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should "not" return finished tasks of hidden lessons', async () => {
					const { course, studentAccount, studentUser } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(studentUser).build({ course, lesson });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should "not" return draft tasks of the user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished draft tasks of the user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: studentUser });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { course, studentAccount, studentUser } = setup();
					const { studentAccount: otherAccount, studentUser: otherUser } = UserAndAccountTestFactory.buildStudent();
					const task = taskFactory.draft().finished(studentUser).build({ course, creator: otherUser });

					await em.persistAndFlush([task, studentAccount, studentUser, otherAccount, otherUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { course, studentAccount, studentUser } = setup();
					const task = taskFactory.finished(studentUser).build({ course });

					await em.persistAndFlush([task, studentAccount, studentUser]);
					em.clear();

					const loggedInClient = await apiClient.login(studentAccount);
					const response = await loggedInClient.get();
					const result = response.body as TaskListResponse;

					expect(result.total).toEqual(1);
				});
			});
		});
	});
});
