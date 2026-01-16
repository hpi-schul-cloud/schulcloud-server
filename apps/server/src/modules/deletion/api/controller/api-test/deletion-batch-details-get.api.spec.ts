import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@modules/role';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { StatusModel } from '../../../domain/types'; // barrel file
import { DeletionBatchEntity } from '../../../repo/entity'; // barrel file
import { deletionBatchEntityFactory, deletionRequestEntityFactory } from '../../../repo/entity/testing'; // testing need to be changed to top level of the module
import { DeletionBatchDetailsResponse } from '../dto/response/deletion-batch-details.response'; // barrel file

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
			const student = userFactory.asStudent().buildWithId();
			const teacher = userFactory.asTeacher().buildWithId();
			const invalidId = new ObjectId().toHexString();

			const deletionBatch: DeletionBatchEntity = deletionBatchEntityFactory.build({
				targetRefIds: [student.id],
				skippedIds: [teacher.id],
				invalidIds: [invalidId],
			});
			const deletionRequest = deletionRequestEntityFactory.build({
				targetRefId: student.id,
				status: StatusModel.SUCCESS,
			});

			await em.persist([student, teacher, deletionBatch, deletionRequest]).flush();
			em.clear();

			const expectedResponse: DeletionBatchDetailsResponse = {
				id: deletionBatch.id,
				pendingDeletions: [],
				failedDeletions: [],
				successfulDeletions: [student.id],
				invalidIds: [invalidId],
				skippedDeletions: [
					{
						ids: [teacher.id],
						roleName: RoleName.TEACHER,
					},
				],
			};

			return { id: deletionBatch.id, expectedResponse };
		};

		it('should return status 200', async () => {
			const { id } = await setup();

			const response = await testApiClient.get(id);

			expect(response.status).toEqual(200);
		});

		it('should return the deletion batch', async () => {
			const { id, expectedResponse } = await setup();

			const response = await testApiClient.get(id);

			const responseBody = response.body as DeletionBatchEntity;

			expect(responseBody).toEqual(expectedResponse);
		});
	});

	describe('when calling with invalid id', () => {
		it('should return status 404', async () => {
			const response = await testApiClient.get('invalid-id');

			expect(response.status).toEqual(404);
		});
	});

	describe('when batch has no ids', () => {
		const setup = async () => {
			const batch = deletionBatchEntityFactory.build();
			await em.persist(batch).flush();
			em.clear();

			const expectedResponse: DeletionBatchDetailsResponse = {
				id: batch.id,
				pendingDeletions: [],
				failedDeletions: [],
				successfulDeletions: [],
				invalidIds: [],
				skippedDeletions: [],
			};

			return { id: batch.id, expectedResponse };
		};
		it('should return response with empty arrays', async () => {
			const { id, expectedResponse } = await setup();

			const result = await testApiClient.get(id);

			expect(result.status).toEqual(200);
			expect(result.body).toEqual(expectedResponse);
		});
	});
});
