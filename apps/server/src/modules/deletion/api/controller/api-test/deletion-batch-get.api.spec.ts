import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DeletionBatchEntity } from '../../../repo/entity';
import { deletionBatchEntityFactory } from '../../../testing';

const baseRouteName = '/deletion-batches';

describe('getBatchDetails ', () => {
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

	describe('when getting an existing deletion batch', () => {
		const setup = async () => {
			const batch = deletionBatchEntityFactory.build();
			await em.persistAndFlush(batch);
			em.clear();

			return { id: batch.id };
		};

		it('should return status 200', async () => {
			const { id } = await setup();

			const response = await testApiClient.get(id);

			expect(response.status).toEqual(200);
		});

		it('should return the deletion batch', async () => {
			const { id } = await setup();

			const response = await testApiClient.get(id);

			const deletionBatch = response.body as DeletionBatchEntity;

			expect(deletionBatch.id).toEqual(id);
		});
	});

	describe('when calling with invalid id', () => {
		it('should return status 404', async () => {
			const response = await testApiClient.get('invalid-id');

			expect(response.status).toEqual(404);
		});
	});
});
