import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { INestApplication } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { userFactory } from '@testing/factory/user.factory';
import { ObjectId } from '@mikro-orm/mongodb';
import { RoleName } from '@shared/domain/interface';
import { AdminApiServerTestModule } from '../../../../server/admin-api.server.app.module';
import { DeletionBatchEntity } from '../../../repo/entity';
import { DeletionBatchDetailsResponse } from '../dto/response/deletion-batch-details.response';
import { deletionBatchEntityFactory, deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { StatusModel } from '../../../domain/types';

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

			await em.persistAndFlush([student, teacher, deletionBatch, deletionRequest]);
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
			await em.persistAndFlush(batch);
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
