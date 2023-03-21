import { EntityManager, MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NewsTargetModel } from '@shared/domain';
import { TestRequest, UserAndAccountTestFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { legacyApp } from '@src/imports-from-feathers';
import { CreateNewsParams } from '../dto';

const setupFeathersApp = async (app: INestApplication) => {
	const orm = app.get(MikroORM);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const feathersExpress = await legacyApp(orm);
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
	feathersExpress.setup();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const nestExpress = app.getHttpAdapter().getInstance();
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	nestExpress.set('feathersApp', feathersExpress);
};

describe('News Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication(); // { httpsOptions: {} }
		// await setupFeathersApp(app);

		await app.init();
		em = module.get(EntityManager);
		request = new TestRequest(app, '/news');
	});

	beforeEach(() => {
		// await Promise.all([em.nativeDelete(News, {}), em.nativeDelete(User, {}), em.nativeDelete(Account, {})]);
	});

	afterAll(async () => {
		await app.close();
	});

	jest.setTimeout(220000);

	// creating without parent context make no sense, api disign is broken
	describe('create', () => {
		// TODO: maybe move out in additional file? Then uer exits level can be removed
		describe('when user not exists', () => {
			it('should be throw an Unauthorized', async () => {
				const response = await request.post('');

				expect(response.statusCode).toEqual(401);
			});
		});

		describe('when user is a student', () => {
			const setup = async () => {
				const { studentAccount, studentUser, school } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const params: CreateNewsParams = {
					title: 'test news',
					content: 'content',
					targetModel: NewsTargetModel.School,
					targetId: school.id,
					displayAt: new Date(),
				};

				return { studentAccount, params };
			};

			it('should not be possible to create a news', async () => {
				const { studentAccount, params } = await setup();

				const response = await request.post('', params, studentAccount);

				expect(response.statusCode).toEqual(403);
			});
		});

		describe('when user is a teacher', () => {
			const setup = async () => {
				const { teacherAccount, teacherUser, school } = UserAndAccountTestFactory.buildTeacher();

				await em.persistAndFlush([teacherAccount, teacherUser]);
				em.clear();

				const params: CreateNewsParams = {
					title: 'test news',
					content: 'content',
					targetModel: NewsTargetModel.School,
					targetId: school.id,
					displayAt: new Date(),
				};

				return { teacherAccount, params };
			};

			it.only('should not be possible to create a news', async () => {
				const { teacherAccount, params } = await setup();

				const response = await request.post('', params, teacherAccount);

				expect(response.statusCode).toEqual(201); // HttpStatus.OK
				expect(response.body).toMatchObject(params);
			});
		});
	});
});
