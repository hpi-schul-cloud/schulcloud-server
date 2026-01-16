import { EntityManager } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { DeletionRequestLogResponse } from '../dto';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest find (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('getPerformedDeletionDetails', () => {
		describe('when searching for deletionRequest', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persist(deletionRequest).flush();
				em.clear();

				return { deletionRequest };
			};

			it('should return status 202', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.get(`${deletionRequest.id}`);

				expect(response.status).toEqual(200);
			});

			it('should return the found deletionRequest', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.get(`${deletionRequest.id}`);
				const result = response.body as DeletionRequestLogResponse;

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(result.targetRef.id).toEqual(deletionRequest.targetRefId);
			});
		});
	});
});
