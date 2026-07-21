import { EntityManager } from '@mikro-orm/core';
import { type INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { TestApiClientBuilder } from '@testing/test-api-client-builder';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DeletionBatchEntity } from '../../../repo/entity';
import { deletionBatchEntityFactory } from '../../../repo/entity/testing';

const baseRouteName = '/deletion-batches';

describe('deleteBatch', () => {
	let app: INestApplication;
	let em: EntityManager;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		em = module.get(EntityManager);

		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when getting a deletion batch details', () => {
		const setup = async () => {
			const batch = deletionBatchEntityFactory.build();
			await em.persist(batch).flush();
			em.clear();

			return { id: batch.id };
		};

		it('should return status 204', async () => {
			const { id } = await setup();

			const response = await new TestApiClientBuilder(app, baseRouteName).withApiKey(API_KEY).build().delete(id);

			expect(response.status).toEqual(204);
		});

		it('should acttually delete the deletion batch', async () => {
			const { id } = await setup();

			await new TestApiClientBuilder(app, baseRouteName).withApiKey(API_KEY).build().delete(id);

			const dbResult = await em.findOne(DeletionBatchEntity, { id });
			expect(dbResult).toBeNull();
		});
	});

	describe('when calling with invalid id', () => {
		it('should return status 404', async () => {
			const response = await new TestApiClientBuilder(app, baseRouteName)
				.withApiKey(API_KEY)
				.build()
				.delete('invalid-id');

			expect(response.status).toEqual(404);
		});
	});
});
