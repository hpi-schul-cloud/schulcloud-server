import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.app.module';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { DeletionRequestEntity } from '../../../repo/entity';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest delete (api)`, () => {
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

	describe('cancelDeletionRequest', () => {
		describe('when deletiong deletionRequest', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persistAndFlush(deletionRequest);
				em.clear();

				return { deletionRequest };
			};

			it('should return status 204', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.delete(`${deletionRequest.id}`);

				expect(response.status).toEqual(204);
			});

			it('should actually delete deletionRequest', async () => {
				const { deletionRequest } = await setup();

				await testApiClient.delete(`${deletionRequest.id}`);

				await expect(em.findOneOrFail(DeletionRequestEntity, deletionRequest.id)).rejects.toThrow();
			});
		});
	});
});
