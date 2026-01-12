import { Configuration } from '@hpi-schul-cloud/commons/lib';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { courseEntityFactory } from '@modules/course/testing';
import { ServerTestModule } from '@modules/server/server.app.module';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { ShareTokenParentType } from '../../domainobject/share-token.do';
import { ShareTokenResponse } from '../dto';

const baseRouteName = '/sharetoken';

describe(`share token creation (api)`, () => {
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

		apiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('with the feature disabled', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([teacherAccount, teacherUser, course]).flush();
			em.clear();

			Configuration.set('FEATURE_COURSE_SHARE', false);

			const loggedInClient = await apiClient.login(teacherAccount);

			return { course, loggedInClient };
		};

		it('should return status 403', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.FORBIDDEN);
		});
	});

	describe('with invalid request data', () => {
		const setup = async () => {
			await cleanupCollections(em);

			const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
			const course = courseEntityFactory.build({ teachers: [teacherUser] });

			await em.persist([teacherAccount, teacherUser, course]).flush();
			em.clear();

			Configuration.set('FEATURE_COURSE_SHARE', true);

			const loggedInClient = await apiClient.login(teacherAccount);

			return { course, loggedInClient };
		};

		it('should return status 400 on empty parent id', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: '',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 404 when parent id is not found', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: new ObjectId().toHexString(),
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.NOT_FOUND);
		});

		it('should return status 400 on invalid parent id', async () => {
			const { loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: 'foobar',
				parentType: ShareTokenParentType.Course,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 on invalid parent type', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: 'invalid',
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is invalid integer', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: 'foo',
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is negative', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: -10,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});

		it('should return status 400 when expiresInDays is not an integer', async () => {
			const { course, loggedInClient } = await setup();

			const response = await loggedInClient.post(undefined, {
				parentId: course.id,
				parentType: ShareTokenParentType.Course,
				expiresInDays: 2.5,
			});

			expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
		});
	});

	describe('with valid course payload', () => {
		describe('with authenticated user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });

				await em.persist([teacherAccount, teacherUser, course]).flush();
				em.clear();

				Configuration.set('FEATURE_COURSE_SHARE', true);

				const loggedInClient = await apiClient.login(teacherAccount);

				return { course, loggedInClient };
			};

			it('should return status 201', async () => {
				const { course, loggedInClient } = await setup();

				const response = await loggedInClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(response.status).toEqual(HttpStatus.CREATED);
			});

			it('should return a valid result', async () => {
				const { course, loggedInClient } = await setup();

				const response = await loggedInClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});
				const result = response.body as ShareTokenResponse;

				expect(result).toEqual({
					token: expect.any(String),
					payload: {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
					},
				});
			});

			describe('when exclusive to school', () => {
				it('should return status 201', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						schoolExclusive: true,
					});

					expect(response.status).toEqual(HttpStatus.CREATED);
				});

				it('should return a valid result', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						schoolExclusive: true,
					});
					const result = response.body as ShareTokenResponse;

					expect(result).toEqual({
						token: expect.any(String),
						payload: {
							parentId: course.id,
							parentType: ShareTokenParentType.Course,
						},
					});
				});
			});

			describe('with expiration duration', () => {
				it('should return status 201', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						expiresInDays: 5,
					});

					expect(response.status).toEqual(HttpStatus.CREATED);
				});

				it('should return a valid result containg the expiration timestamp', async () => {
					const { course, loggedInClient } = await setup();

					const response = await loggedInClient.post(undefined, {
						parentId: course.id,
						parentType: ShareTokenParentType.Course,
						expiresInDays: 5,
					});
					const result = response.body as ShareTokenResponse;

					expect(result).toEqual({
						token: expect.any(String),
						expiresAt: expect.any(String),
						payload: {
							parentId: course.id,
							parentType: ShareTokenParentType.Course,
						},
					});
				});
			});
		});

		describe('with not authenticated user', () => {
			const setup = async () => {
				await cleanupCollections(em);

				const { teacherAccount, teacherUser } = UserAndAccountTestFactory.buildTeacher();
				const course = courseEntityFactory.build({ teachers: [teacherUser] });

				await em.persist([teacherAccount, teacherUser, course]).flush();
				em.clear();

				Configuration.set('FEATURE_COURSE_SHARE', true);

				return { course };
			};

			it('should return status 401', async () => {
				const { course } = await setup();

				const response = await apiClient.post(undefined, {
					parentId: course.id,
					parentType: ShareTokenParentType.Course,
				});

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
