import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Account, News, NewsTargetModel, User } from '@shared/domain';
import { TestRequest, UserAndAccountTestFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { CreateNewsParams } from '../dto';

describe('News Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let request: TestRequest;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication(); // { httpsOptions: {} }
		await app.init();
		em = module.get(EntityManager);
		request = new TestRequest(app, '/news');
	});

	beforeEach(async () => {
		await Promise.all([em.nativeDelete(News, {}), em.nativeDelete(User, {}), em.nativeDelete(Account, {})]);
	});

	afterAll(async () => {
		await app.close();
	});

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

				const params: CreateNewsParams = {
					title: 'test news',
					content: 'content',
					targetModel: NewsTargetModel.School,
					targetId: school.id,
					displayAt: new Date(),
				};

				return { teacherAccount, params };
			};

			it('should not be possible to create a news', async () => {
				const { teacherAccount, params } = await setup();

				const response = await request.post('', params, teacherAccount);

				expect(response.statusCode).toEqual(201);
				expect(response.body).toMatchObject(params);
			});
		});
	});
});
