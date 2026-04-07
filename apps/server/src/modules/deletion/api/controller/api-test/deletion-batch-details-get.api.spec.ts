import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { StatusModel } from '../../../domain/types'; // barrel file
import { DeletionBatchEntity } from '../../../repo/entity'; // barrel file
import { deletionBatchEntityFactory, deletionRequestEntityFactory } from '../../../repo/entity/testing'; // testing need to be changed to top level of the module

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

	beforeEach(async () => {
		await em.nativeDelete('DeletionBatch', {});
	});

	afterAll(async () => {
		await app.close();
	});

	describe('when getting an existing deletion batch', () => {
		const setup = async () => {
			const student = userFactory.asStudent().buildWithId();
			const teacher = userFactory.asTeacher().buildWithId();
			const invalidId = new ObjectId().toHexString();

			const deletionBatch: DeletionBatchEntity = deletionBatchEntityFactory.buildWithId({
				targetRefIds: [student.id],
				skippedIds: [teacher.id],
				invalidIds: [invalidId],
			});

			const successfulRequest = deletionRequestEntityFactory.build({
				batchId: deletionBatch.id,
				targetRefId: student.id,
				status: StatusModel.SUCCESS,
			});

			const failedRequest = deletionRequestEntityFactory.build({
				batchId: deletionBatch.id,
				targetRefId: teacher.id,
				status: StatusModel.FAILED,
			});

			await em.persist([student, teacher, deletionBatch, successfulRequest, failedRequest]).flush();
			em.clear();

			const expectedResponse = {
				id: deletionBatch.id,
				name: deletionBatch.name,
				status: deletionBatch.status,
				validUsers: [student.id],
				invalidUsers: [invalidId],
				skippedUsers: [teacher.id],
				pendingDeletions: [],
				failedDeletions: [teacher.id],
				successfulDeletions: [student.id],
				createdAt: deletionBatch.createdAt.toISOString(),
				updatedAt: deletionBatch.updatedAt.toISOString(),
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
			const batch = deletionBatchEntityFactory.build({
				targetRefIds: [],
				skippedIds: [],
				invalidIds: [],
			});
			await em.persist(batch).flush();
			em.clear();

			const expectedResponse = {
				id: batch.id,
				name: batch.name,
				status: batch.status,
				validUsers: [],
				invalidUsers: [],
				skippedUsers: [],
				pendingDeletions: [],
				failedDeletions: [],
				successfulDeletions: [],
				createdAt: batch.createdAt.toISOString(),
				updatedAt: batch.updatedAt.toISOString(),
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
