import { EntityManager } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { mediaSourceEntityFactory } from '../../testing';
import { MediaSourceListResponse } from '../response';

describe('MediaSourceController (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleRef.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'media-sources');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('[GET] media-sources', () => {
		describe('when the user is not authorized', () => {
			const setup = async () => {
				const { adminUser, adminAccount } = UserAndAccountTestFactory.buildAdmin();

				await em.persist([adminUser, adminAccount]).flush();
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a unauthorized status', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when media sources are available', () => {
			const setup = async () => {
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero();

				const bilo = mediaSourceEntityFactory.withBiloFormat().build({});

				const vidis = mediaSourceEntityFactory.withVidisFormat().build({});

				await em.persist([superheroUser, superheroAccount, bilo, vidis]).flush();
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return {
					loggedInClient,
				};
			};

			it('should return a list of media sources', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({
					responses: [
						{
							id: expect.any(String),
							name: 'media-source-1',
							sourceId: 'source-id-1',
							format: 'BILDUNGSLOGIN',
						},
						{
							id: expect.any(String),
							name: 'media-source-2',
							sourceId: 'source-id-2',
							format: 'VIDIS',
						},
					],
				});
			});
		});

		describe('when no media sources are available', () => {
			const setup = async () => {
				const { superheroUser, superheroAccount } = UserAndAccountTestFactory.buildSuperhero();

				await em.persist([superheroUser, superheroAccount]).flush();
				em.clear();

				const loggedInClient: TestApiClient = await testApiClient.login(superheroAccount);

				return {
					loggedInClient,
				};
			};

			it('should return an empty array', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get();

				expect(response.body).toEqual<MediaSourceListResponse>({
					responses: [],
				});
			});
		});
	});
});
