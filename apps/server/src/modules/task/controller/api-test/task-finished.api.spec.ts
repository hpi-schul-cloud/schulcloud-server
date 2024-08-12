import { ICurrentUser, JwtAuthGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server/server.module';
import { TaskListResponse } from '@modules/task/controller/dto';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import {
	cleanupCollections,
	courseFactory,
	lessonFactory,
	mapUserToCurrentUser,
	roleFactory,
	taskFactory,
	userFactory,
} from '@shared/testing';
import { Request } from 'express';
import request from 'supertest';

class API {
	app: INestApplication;

	routeName: string;

	constructor(app: INestApplication, routeName: string) {
		this.app = app;
		this.routeName = routeName;
	}

	async get(query?: string | Record<string, unknown>) {
		const response = await request(this.app.getHttpServer())
			.get(this.routeName)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			result: response.body as TaskListResponse,
			status: response.status,
		};
	}
}

describe('Task controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app, '/tasks/finished');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('task/finished without permission', () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		it('should return status 401', async () => {
			const roles = roleFactory.buildList(1, { permissions: [] });
			const user = userFactory.build({ roles });
			const task = taskFactory.finished(user).build({ creator: user });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);

			const response = await api.get();

			expect(response.status).toEqual(401);
		});
	});

	describe(`task/finished with ${Permission.TASK_DASHBOARD_TEACHER_VIEW_V3} permission`, () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		const setup = () => {
			const roles = roleFactory.buildList(1, {
				permissions: [Permission.TASK_DASHBOARD_TEACHER_VIEW_V3],
			});
			const user = userFactory.build({ roles });

			return user;
		};

		it('should "not" find task if the user is not part of the parent anymore.', async () => {
			const user = setup();
			const course = courseFactory.build({ teachers: [] });
			const task = taskFactory.finished(user).build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});

		it('should return finished tasks of user', async () => {
			const user = setup();
			const course = courseFactory.build({ teachers: [user] });
			const task = taskFactory.finished(user).build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.total).toEqual(1);
		});

		it('should return status for privileged members if user has write permission in for tasks', async () => {
			const user = setup();
			const course = courseFactory.build({ substitutionTeachers: [user] });
			const task = taskFactory.finished(user).build({ course });

			await em.persistAndFlush([task]);
			em.clear();

			currentUser = mapUserToCurrentUser(user);
			const { result } = await api.get();

			expect(result.data).toHaveLength(1);
			// can only be true for privileged status
			expect(result.data[0].status.isSubstitutionTeacher).toBe(true);
		});
	});

	describe(`task/finished with ${Permission.TASK_DASHBOARD_VIEW_V3} permission`, () => {
		beforeEach(async () => {
			await cleanupCollections(em);
		});

		describe('api endpoint', () => {
			const setup = () => {
				const roles = roleFactory.buildList(1, { permissions: [Permission.TASK_DASHBOARD_VIEW_V3] });
				const user = userFactory.build({ roles });

				return user;
			};

			it('should possible to open it', async () => {
				const user = setup();

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				const response = await api.get();

				expect(response.status).toEqual(200);
			});

			it('should return a paginated result', async () => {
				const user = setup();

				await em.persistAndFlush([user]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				const response = await api.get();

				expect(response.result).toEqual({
					total: 0,
					data: [],
					limit: 10,
					skip: 0,
				});
			});
		});

		describe('when user is the creator', () => {
			const setup = () => {
				const roles = roleFactory.buildList(1, { permissions: [Permission.TASK_DASHBOARD_VIEW_V3] });
				const user = userFactory.build({ roles });

				return user;
			};

			it('should return finished tasks', async () => {
				const user = setup();
				const task = taskFactory.finished(user).build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finished draft tasks', async () => {
				const user = setup();
				const task = taskFactory.finished(user).draft().build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return open tasks', async () => {
				const user = setup();
				const task = taskFactory.build({ creator: user });

				await em.persistAndFlush([task]);
				em.clear();

				currentUser = mapUserToCurrentUser(user);
				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});
		});

		describe('when user has write permission in course', () => {
			describe('when courses are finised', () => {
				const setup = () => {
					const roles = roleFactory.buildList(1, {
						permissions: [Permission.TASK_DASHBOARD_VIEW_V3],
					});
					const user = userFactory.build({ roles });
					const course = courseFactory.isFinished().build({ teachers: [user] });

					return { course, user };
				};

				it('should return tasks of courses', async () => {
					const { user, course } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return open draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return finished draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().finished(user).build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { user, course } = setup();
					const otherUser = userFactory.build();
					const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { user, course } = setup();
					const task = taskFactory.finished(user).build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});
			});

			describe('when courses are open', () => {
				const setup = () => {
					const roles = roleFactory.buildList(1, {
						permissions: [Permission.TASK_DASHBOARD_VIEW_V3],
					});
					const user = userFactory.build({ roles });
					const course = courseFactory.isOpen().build({ teachers: [user] });

					return { course, user };
				};

				it('should "not" return tasks of courses', async () => {
					const { user, course } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should "not" return tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().finished(user).build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { user, course } = setup();
					const otherUser = userFactory.build();
					const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { user, course } = setup();
					const task = taskFactory.finished(user).build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});
			});
		});

		describe('when user has read permission in course', () => {
			describe('when courses are finised', () => {
				const setup = () => {
					const roles = roleFactory.buildList(1, { permissions: [Permission.TASK_DASHBOARD_VIEW_V3] });
					const user = userFactory.build({ roles });
					const course = courseFactory.isFinished().build({ students: [user] });

					return { course, user };
				};

				it('should return tasks of courses', async () => {
					const { user, course } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should "not" return finished tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return open draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should return finished draft tasks of user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().finished(user).build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { user, course } = setup();
					const otherUser = userFactory.build();
					const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { user, course } = setup();
					const task = taskFactory.finished(user).build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});
			});

			describe('when courses are open', () => {
				const setup = () => {
					const roles = roleFactory.buildList(1, { permissions: [Permission.TASK_DASHBOARD_VIEW_V3] });
					const user = userFactory.build({ roles });
					const course = courseFactory.isOpen().build({ students: [user] });

					return { course, user };
				};

				it('should "not" return tasks of courses', async () => {
					const { user, course } = setup();
					const task = taskFactory.build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should "not" return tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks of visible lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: false });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should "not" return finished tasks of hidden lessons', async () => {
					const { user, course } = setup();
					const lesson = lessonFactory.build({ course, hidden: true });
					const task = taskFactory.finished(user).build({ course, lesson });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should "not" return draft tasks of the user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished draft tasks of the user', async () => {
					const { user, course } = setup();
					const task = taskFactory.draft().finished(user).build({ course, creator: user });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});

				it('should "not" return finished draft tasks of the other user', async () => {
					const { user, course } = setup();
					const otherUser = userFactory.build();
					const task = taskFactory.draft().finished(user).build({ course, creator: otherUser });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(0);
				});

				it('should return finished tasks', async () => {
					const { user, course } = setup();
					const task = taskFactory.finished(user).build({ course });

					await em.persistAndFlush([task]);
					em.clear();

					currentUser = mapUserToCurrentUser(user);
					const { result } = await api.get();

					expect(result.total).toEqual(1);
				});
			});
		});
	});
});
