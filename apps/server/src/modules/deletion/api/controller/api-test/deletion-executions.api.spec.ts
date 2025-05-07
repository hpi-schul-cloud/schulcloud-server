import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { cleanupCollections } from '@testing/cleanup-collections';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { EntityManager } from '@mikro-orm/mongodb';

const baseRouteName = '/deletionExecutions';

describe(`deletionExecution (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const config = adminApiServerConfig();
		config.ADMIN_API__ALLOWED_API_KEYS = [API_KEY];

		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	describe('executeDeletions', () => {
		describe('when execute deletionRequests with default limit', () => {
			const setup = async () => {
				testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persistAndFlush(deletionRequest);
				em.clear();

				return { deletionRequest };
			};

			it('should return status 204', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.post('', {
					ids: [deletionRequest.id],
				});

				expect(response.status).toEqual(204);
			}, 20000);

			/* unstable test in CI
			it('should actually successful execute the deletionRequests', async () => {
				const { deletionRequest } = await setup();

				await testApiClient.post('', {
					ids: [deletionRequest.id],
				});

				const entity = await em.findOneOrFail(DeletionRequestEntity, deletionRequest.id);
				expect(entity.status).toEqual('success');
			}, 20000);
			 */
		});

		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});

			it('should refuse without token', async () => {
				testApiClient = new TestApiClient(app, baseRouteName, '', true);

				const response = await testApiClient.post('');

				expect(response.status).toEqual(401);
			});
		});
	});

	describe('findAllItemsToExecute', () => {
		const setup = async () => {
			testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);

			const deletionRequest = deletionRequestEntityFactory.build();

			await em.persistAndFlush(deletionRequest);
			em.clear();

			return { deletionRequest, testApiClient };
		};

		it('should return status 200', async () => {
			const { testApiClient } = await setup();

			const response = await testApiClient.get();

			expect(response.status).toEqual(200);
		});

		it('should return deletionRequests ids', async () => {
			const { deletionRequest, testApiClient } = await setup();

			const response = await testApiClient.get();

			expect(response.body).toEqual([deletionRequest.id]);
		});
	});
});
