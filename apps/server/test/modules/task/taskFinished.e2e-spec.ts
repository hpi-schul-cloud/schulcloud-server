import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Request } from 'express';
import { MikroORM, EntityManager } from '@mikro-orm/core';

import { ServerModule } from '@src/server.module';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { TaskListResponse } from '@src/modules/task/controller/dto';
import { ICurrentUser, Course, Submission, Task, User } from '@shared/domain';
import {
	courseFactory,
	userFactory,
	taskFactory,
	createCurrentTestUser,
	cleanUpCollections,
	lessonFactory,
} from '@shared/testing';

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

const modifyCurrentUserId = (currentUser: ICurrentUser, user: User) => {
	currentUser.user.id = user.id;
	currentUser.userId = user.id;
};

describe('task/finished Controller (e2e)', () => {
	// where user is not loggedin -> show always 200, but it should status 401 like if we send a request against backend
	// test setup is not perfect
	let app: INestApplication;
	let orm: MikroORM;
	let em: EntityManager;
	let currentUser: ICurrentUser;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerModule],
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
		orm = app.get(MikroORM);
		em = module.get(EntityManager);
		currentUser = createCurrentTestUser().currentUser;
		api = new API(app, '/tasks/finished');
	});

	afterAll(async () => {
		await orm.close();
		await app.close();
	});

	beforeEach(async () => {
		await Promise.all([
			em.nativeDelete(Course, {}),
			em.nativeDelete(Task, {}),
			em.nativeDelete(Submission, {}),
			em.nativeDelete(User, {}),
		]);
		// await cleanUpCollections(em);
	});

	it('should possible to open it', async () => {
		const response = await api.get();

		expect(response.status).toEqual(200);
	});

	it('should return a paginated result', async () => {
		const { result } = await api.get();

		expect(result).toEqual({
			total: 0,
			data: [],
			limit: 10,
			skip: 0,
		});
	});

	describe('where user is the creator', () => {
		it('should return finsihed tasks', async () => {
			const user = userFactory.build();
			const task = taskFactory.finished(user).build({ teacher: user });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, user);

			const { result } = await api.get();

			expect(result.total).toEqual(1);
		});

		it('should "not" return open tasks', async () => {
			const user = userFactory.build();
			const task = taskFactory.build({ teacher: user });

			await em.persistAndFlush([task]);
			em.clear();

			modifyCurrentUserId(currentUser, user);

			const { result } = await api.get();

			expect(result.total).toEqual(0);
		});
	});

	describe('Where user has write permission in course', () => {
		describe('where courses are finised', () => {
			const setup = () => {
				const untilDate = new Date(Date.now() - 6000);
				const user = userFactory.build();
				const course = courseFactory.build({ teachers: [user], untilDate });

				return { course, user };
			};

			it('should return tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finsihed tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finsihed tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finished draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finsihed tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});
		});

		describe('where courses are open', () => {
			const setup = () => {
				const untilDate = new Date(Date.now() + 6000);
				const user = userFactory.build();
				const course = courseFactory.build({ teachers: [user], untilDate });

				return { course, user };
			};

			it('should "not" return tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should "not" return tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finsihed tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finsihed tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finished draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finsihed tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});
		});
	});

	describe('Where user has read permission in course', () => {
		describe('where courses are finised', () => {
			const setup = () => {
				const untilDate = new Date(Date.now() - 6000);
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user], untilDate });

				return { course, user };
			};

			it('should return tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should return finsihed tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should "not" return finsihed tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should "not" return finished draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finished tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});
		});

		describe('where courses are open', () => {
			const setup = () => {
				const untilDate = new Date(Date.now() + 6000);
				const user = userFactory.build();
				const course = courseFactory.build({ students: [user], untilDate });

				return { course, user };
			};

			it('should "not" return tasks of courses', async () => {
				const { user, course } = setup();
				const task = taskFactory.build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should "not" return tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finished tasks of visible lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: false });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finsihed tasks of hidden lessons', async () => {
				const { user, course } = setup();
				const lesson = lessonFactory.build({ hidden: true });
				const task = taskFactory.finished(user).build({ course, lesson });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});

			it('should "not" return draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should "not" return finished draft tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.draft(true).finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(0);
			});

			it('should return finished tasks', async () => {
				const { user, course } = setup();
				const task = taskFactory.finished(user).build({ course });

				await em.persistAndFlush([task]);
				em.clear();

				modifyCurrentUserId(currentUser, user);

				const { result } = await api.get();

				expect(result.total).toEqual(1);
			});
		});
	});
});
