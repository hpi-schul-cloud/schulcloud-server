import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { deletionBatchEntityFactory } from '../../../repo/entity/testing'; // testing need to be changed to top level of the module
import { DeletionBatchListResponse } from '../dto/response/deletion-batch-list.response'; // barrel file

const baseRouteName = '/deletion-batches';

describe('getBatches ', () => {
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

	describe('when getting deletion batches', () => {
		const setup = async () => {
			const student1 = userFactory.asStudent().buildWithId();
			const student2 = userFactory.asStudent().buildWithId();
			const student3 = userFactory.asStudent().buildWithId();
			const teacher1 = userFactory.asTeacher().buildWithId();
			const teacher2 = userFactory.asTeacher().buildWithId();
			const invalidId1 = new ObjectId().toHexString();
			const invalidId2 = new ObjectId().toHexString();
			const now = new Date();
			const tenSecondsAgo = new Date(now.getTime() - 10 * 1000);

			const batch1 = deletionBatchEntityFactory.build({
				targetRefIds: [student1.id, student2.id],
				skippedIds: [teacher1.id],
				invalidIds: [invalidId1],
				createdAt: tenSecondsAgo,
			});
			const batch2 = deletionBatchEntityFactory.build({
				targetRefIds: [student3.id],
				skippedIds: [teacher2.id],
				invalidIds: [invalidId2],
				createdAt: now,
			});
			await em.persist([student1, student2, student3, teacher1, teacher2, batch1, batch2]).flush();
			em.clear();

			const deletionBatchListResponse1 = {
				id: batch1.id,
				name: batch1.name,
				status: batch1.status,
				usersByRole: [{ roleName: 'student', userCount: 2 }],
				skippedUsersByRole: [{ roleName: 'teacher', userCount: 1 }],
				invalidUsers: [invalidId1],
			};
			const deletionBatchListResponse2 = {
				id: batch2.id,
				name: batch2.name,
				status: batch2.status,
				usersByRole: [{ roleName: 'student', userCount: 1 }],
				skippedUsersByRole: [{ roleName: 'teacher', userCount: 1 }],
				invalidUsers: [invalidId2],
			};

			return { deletionBatchListResponse1, deletionBatchListResponse2 };
		};

		it('should return status 200', async () => {
			const response = await testApiClient.get();

			expect(response.status).toEqual(200);
		});

		it('should return a paginated list of deletion batches', async () => {
			const { deletionBatchListResponse1, deletionBatchListResponse2 } = await setup();

			const response = await testApiClient.get();
			const result = response.body as DeletionBatchListResponse;

			expect(result.total).toEqual(2);
			expect(result.data).toEqual([
				expect.objectContaining(deletionBatchListResponse2),
				expect.objectContaining(deletionBatchListResponse1),
			]);
		});
	});
});
