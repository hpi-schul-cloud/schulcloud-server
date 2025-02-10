import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
// import { cleanupCollections } from '@testing/cleanup-collections';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DeletionBatchEntity } from '../../../repo/entity';
import { deletionBatchEntityFactory } from '../../../testing';

const baseRouteName = '/deletion-batches';

describe('createBatch', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when deleting a deletion batch', () => {
		const setup = async () => {
			const batch = deletionBatchEntityFactory.build();
			await em.persistAndFlush(batch);
			em.clear();

			return { id: batch.id };
		};

		it('should return status 204', async () => {
			const { id } = await setup();

			const response = await testApiClient.delete(id);

			expect(response.status).toEqual(204);
		});

		it('should acttually delete the deletion batch', async () => {
			const { id } = await setup();

			const response = await testApiClient.delete(id);

			const dbResult = await em.findOne(DeletionBatchEntity, { id });
			expect(dbResult).toBeNull();
		});
	});

	describe('when calling with invalid id', () => {
		it('should return status 404', async () => {
			const response = await testApiClient.delete('invalid-id');

			expect(response.status).toEqual(404);
		});
	});
});
