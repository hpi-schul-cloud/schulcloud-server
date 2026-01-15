import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { deletionBatchEntityFactory } from '../../../repo/entity/testing'; // testing need to be changed to top level of the module
import { DeletionBatchItemResponse } from '../dto/response/deletion-batch-item.response'; // add barrel file

const baseRouteName = '/deletion-batches';

describe('createDeletionRequestsForBatch', () => {
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

	describe('when creating deletion requests for a batch', () => {
		const setup = async () => {
			const student1 = userFactory.asStudent().buildWithId();
			const student2 = userFactory.asStudent().buildWithId();
			const teacher1 = userFactory.asTeacher().buildWithId();
			const invalidId1 = new ObjectId().toHexString();

			const batch = deletionBatchEntityFactory.build({
				targetRefIds: [student1.id, student2.id],
				skippedIds: [teacher1.id],
				invalidIds: [invalidId1],
			});
			await em.persist([student1, student2, teacher1, batch]).flush();
			em.clear();

			return { batch };
		};

		it('should return status 202', async () => {
			const { batch } = await setup();

			const response = await testApiClient.post(`/${batch.id}/execute`);

			expect(response.status).toEqual(202);
			const result = response.body as DeletionBatchItemResponse;
			expect(result.id).toEqual(batch.id);
		});

		it('should update batch status to "queued"', async () => {
			const { batch } = await setup();

			const response = await testApiClient.post(`/${batch.id}/execute`);

			const result = response.body as DeletionBatchItemResponse;
			expect(result.status).toEqual('deletion-requested'); // Assuming the status changes to 'queued'
		});
	});
});
