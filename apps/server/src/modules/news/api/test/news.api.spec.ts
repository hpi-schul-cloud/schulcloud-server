import { API_VALIDATION_ERROR_TYPE } from '@core/error/server-error-types';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { FeathersAuthorizationService } from '@modules/authorization';
import { ServerTestModule } from '@modules/server/server.app.module';
import { User } from '@modules/user/repo';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import moment from 'moment';
import { NewsTargetModel } from '../../domain';
import { News } from '../../repo';
import { CreateNewsParams, NewsListResponse, NewsResponse, UpdateNewsParams } from '../dto';

describe('News Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let newsApiClient: TestApiClient;
	let teamsApiClient: TestApiClient;

	const courseTargetId = new ObjectId().toHexString();
	const unpublishedCourseTargetId = new ObjectId().toHexString();
	const teamTargetId = new ObjectId().toHexString();
	const targets = [
		{
			targetModel: NewsTargetModel.Course,
			targetIds: [courseTargetId, unpublishedCourseTargetId],
		},
		{
			targetModel: NewsTargetModel.Team,
			targetIds: [teamTargetId],
		},
	];
	const emptyPaginationResponse: NewsListResponse = { data: [], total: 0 };

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		})
			.overrideProvider(FeathersAuthorizationService)
			.useValue({
				checkEntityPermissions() {},
				getPermittedEntities(userId, targetModel) {
					return targets.filter((target) => target.targetModel === targetModel).flatMap((target) => target.targetIds);
				},
				getEntityPermissions() {
					return ['NEWS_VIEW', 'NEWS_EDIT'];
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);

		newsApiClient = new TestApiClient(app, '/news');
		teamsApiClient = new TestApiClient(app, '/team');
	});

	beforeEach(async () => {
		await em.nativeDelete(News, {});
	});

	afterAll(async () => {
		await app.close();
	});

	const newTestNews = (targetModel: NewsTargetModel, targetId: EntityId, user: User, unpublished = false): News => {
		const displayAt = unpublished ? moment().add(1, 'days').toDate() : moment().subtract(1, 'days').toDate();
		const news = News.createInstance(targetModel, {
			school: user.school,
			title: 'test course news',
			content: 'content',
			target: targetId,
			displayAt,
			creator: user.id,
		});

		return news;
	};

	const createTestNews = async (targetModel: NewsTargetModel, targetId: EntityId, user: User, unpublished = false) => {
		const news = newTestNews(targetModel, targetId, user, unpublished);
		await em.persist(news).flush();
		return news;
	};

	describe('GET /news', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await newsApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should get empty response if there is no news', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();
				expect(response.status).toBe(200);
				const { data, total } = response.body as NewsListResponse;
				expect(total).toBe(0);
				expect(data).toHaveLength(0);
			});

			it('should get for /news without parameters', async () => {
				const { loggedInClient, studentUser } = await setup();
				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);
				const expected = {
					data: [news],
					total: 1,
				};
				const response = await loggedInClient.get().expect(200);
				const { data, total } = response.body as NewsListResponse;
				expect(total).toBe(expected.total);
				expect(data.length).toBe(expected.data.length);
				expect(data[0].id).toBe(expected.data[0]._id.toString());
			});

			it('should get for /news with unpublished params only unpublished news', async () => {
				const { loggedInClient, studentUser } = await setup();
				const unpublishedNews = await createTestNews(
					NewsTargetModel.Course,
					unpublishedCourseTargetId,
					studentUser,
					true
				);
				const expected = {
					data: [unpublishedNews],
					total: 1,
				};
				const response = await loggedInClient.get(`?unpublished=true`).expect(200);
				const { data, total } = response.body as NewsListResponse;

				expect(total).toBe(expected.total);
				expect(data.length).toBe(expected.data.length);
				expect(data[0].id).toBe(expected.data[0]._id.toString());
			});
		});

		describe('when user is not authenticated', () => {
			it('should return 401 status', async () => {
				await newsApiClient.get().expect(401);
			});
		});
	});

	describe('GET /news/{id}', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await newsApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should get news by id', async () => {
				const { loggedInClient, studentUser } = await setup();
				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);
				const response = await loggedInClient.get(`${news._id.toHexString()}`).expect(200);
				const body = response.body as NewsResponse;
				expect(body.id).toBe(news._id.toString());
			});

			it('should throw not found if news was not found', async () => {
				const { loggedInClient } = await setup();
				const randomId = new ObjectId().toHexString();
				await loggedInClient.get(`${randomId}`).expect(404);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);

				await em.persist([studentAccount, studentUser]).flush();

				return { news };
			};

			it('should return 401 status', async () => {
				const { news } = await setup();

				await newsApiClient.get(`${news._id.toHexString()}`).expect(401);
			});
		});
	});

	describe('GET /team/{teamId}/news', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const news = await createTestNews(NewsTargetModel.Team, teamTargetId, studentUser);

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await teamsApiClient.login(studentAccount);

				return { loggedInClient, news };
			};

			it('should get team-news by id', async () => {
				const { loggedInClient, news } = await setup();

				const response = await loggedInClient.get(`${teamTargetId}/news`).expect(200);

				const body = response.body as NewsListResponse;
				expect(body.data.map((newsResponse) => newsResponse.id)).toContain(news.id);
			});

			it('should not throw if a team was not found', async () => {
				const { loggedInClient } = await setup();

				const randomId = new ObjectId().toHexString();
				await loggedInClient.get(`${randomId}/news`).expect(200).expect(emptyPaginationResponse);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				const news = await createTestNews(NewsTargetModel.Team, teamTargetId, studentUser);

				await em.persist([studentAccount, studentUser]).flush();

				return { news };
			};

			it('should return 401 status', async () => {
				await setup();

				await teamsApiClient.get(`${teamTargetId}/news`).expect(401);
			});
		});
	});

	describe('POST /news/{id}', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await newsApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should create news by input params', async () => {
				const { loggedInClient } = await setup();
				const courseId = new ObjectId().toString();

				const params: CreateNewsParams = {
					title: 'test course news',
					content: 'content',
					targetModel: NewsTargetModel.Course,
					targetId: courseId,
					displayAt: new Date(),
				};

				const response = await loggedInClient.post().send(params).expect(201);
				const body = response.body as NewsResponse;
				expect(body.id).toBeDefined();
				expect(body.title).toBe(params.title);
				expect(body.targetId).toBe(params.targetId);
				expect(body.displayAt).toBe(params.displayAt?.toISOString());
			});

			it('should throw ApiValidationError if input parameters dont match the required schema', async () => {
				const { loggedInClient } = await setup();

				const params = new CreateNewsParams();
				const res = await loggedInClient.post().send(params).expect(400);
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(res.body.type).toBe(API_VALIDATION_ERROR_TYPE.type);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = () => {
				const courseId = new ObjectId().toString();

				const params: CreateNewsParams = {
					title: 'test course news',
					content: 'content',
					targetModel: NewsTargetModel.Course,
					targetId: courseId,
					displayAt: new Date(),
				};

				return { params };
			};

			it('should return 401 status', async () => {
				const { params } = setup();

				await newsApiClient.post().send(params).expect(401);
			});
		});
	});

	describe('PATCH /news/{id}', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await newsApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should update news by update params', async () => {
				const { loggedInClient, studentUser } = await setup();
				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);

				const params = {
					title: 'updated test news',
					content: 'new content',
					displayAt: new Date(),
				} as UpdateNewsParams;

				const response = await loggedInClient.patch(`${news._id.toHexString()}`).send(params).expect(200);
				const body = response.body as NewsResponse;
				expect(body.id).toBe(news._id.toHexString());
				expect(body.title).toBe(params.title);
				expect(body.content).toBe(params.content);
				expect(body.displayAt).toBe(params.displayAt.toISOString());
			});

			it('should do nothing if path an empty object for update', async () => {
				const { loggedInClient, studentUser } = await setup();

				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);
				const params = {} as UpdateNewsParams;
				await loggedInClient.patch(`${news._id.toString()}`).send(params).expect(200);
			});

			it('should throw an error if trying to update of object which doesnt exists', async () => {
				const { loggedInClient } = await setup();

				const randomId = new ObjectId().toHexString();
				const params = {} as UpdateNewsParams;
				await loggedInClient.patch(`${randomId}`).send(params).expect(404);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const { studentUser } = UserAndAccountTestFactory.buildStudent();
				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);

				const params = {
					title: 'updated test news',
					content: 'new content',
					displayAt: new Date(),
				} as UpdateNewsParams;

				return { params, news };
			};

			it('should return 401 status', async () => {
				const { params, news } = await setup();

				await newsApiClient.patch(`${news._id.toHexString()}`).send(params).expect(401);
			});
		});
	});

	describe('DELETE /news/{id}', () => {
		describe('when user is authenticated', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentAccount, studentUser]).flush();

				const loggedInClient = await newsApiClient.login(studentAccount);

				return { loggedInClient, studentUser };
			};

			it('should delete news', async () => {
				const { loggedInClient, studentUser } = await setup();
				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);
				const newsId = news._id.toHexString();

				await loggedInClient.delete(`${newsId}`).expect(200).expect(newsId);
			});

			it('should throw not found error, if news doesnt exists', async () => {
				const { loggedInClient } = await setup();

				const randomId = new ObjectId().toHexString();
				await loggedInClient.delete(`${randomId}`).expect(404);
			});
		});

		describe('when user is not authenticated', () => {
			const setup = async () => {
				const { studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persist([studentUser]).flush();

				const news = await createTestNews(NewsTargetModel.Course, courseTargetId, studentUser);
				const newsId = news._id.toHexString();

				return { newsId };
			};

			it('should return 401 status', async () => {
				const { newsId } = await setup();

				await newsApiClient.delete(`${newsId}`).expect(401);
			});
		});
	});
});
