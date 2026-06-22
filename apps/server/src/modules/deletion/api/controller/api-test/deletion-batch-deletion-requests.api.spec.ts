import { EntityManager } from '@mikro-orm/core';
import { ObjectId } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { userFactory } from '@modules/user/testing';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { DomainName, StatusModel } from '../../../domain/types';
import { DeletionLogEntity, DeletionRequestEntity } from '../../../repo/entity';
import {
	deletionBatchEntityFactory,
	deletionLogEntityFactory,
	deletionRequestEntityFactory,
} from '../../../repo/entity/testing';
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

	describe('when resetting failed deletion requests for a batch', () => {
		const setup = async () => {
			const student1 = userFactory.asStudent().buildWithId();
			const student2 = userFactory.asStudent().buildWithId();

			const batch = deletionBatchEntityFactory.build({
				targetRefIds: [student1.id, student2.id],
			});

			const failedRequest = deletionRequestEntityFactory.build({
				batchId: batch.id,
				targetRefId: student1.id,
				targetRefDomain: DomainName.USER,
				status: StatusModel.FAILED,
			});
			const successfulRequest = deletionRequestEntityFactory.build({
				batchId: batch.id,
				targetRefId: student2.id,
				targetRefDomain: DomainName.USER,
				status: StatusModel.SUCCESS,
			});

			const failedRequestLog = deletionLogEntityFactory.build({
				deletionRequestId: new ObjectId(failedRequest.id),
			});
			const successfulRequestLog = deletionLogEntityFactory.build({
				deletionRequestId: new ObjectId(successfulRequest.id),
			});

			await em
				.persist([student1, student2, batch, failedRequest, successfulRequest, failedRequestLog, successfulRequestLog])
				.flush();
			em.clear();

			return { batch, student1, student2, failedRequest, successfulRequest };
		};

		it('should reset failed request to registered and delete logs for reset request ids', async () => {
			const { batch, student1, failedRequest, successfulRequest } = await setup();

			const response = await testApiClient.post(`/${batch.id}/retry-failed`, {
				targetRefIds: [student1.id],
			});

			expect(response.status).toEqual(204);

			const resetRequest = await em.findOneOrFail(DeletionRequestEntity, { id: failedRequest.id });
			expect(resetRequest.status).toEqual(StatusModel.REGISTERED);

			const untouchedRequest = await em.findOneOrFail(DeletionRequestEntity, { id: successfulRequest.id });
			expect(untouchedRequest.status).toEqual(StatusModel.SUCCESS);

			const deletedLog = await em.findOne(DeletionLogEntity, { deletionRequestId: new ObjectId(failedRequest.id) });
			expect(deletedLog).toBeNull();

			const untouchedLog = await em.findOne(DeletionLogEntity, {
				deletionRequestId: new ObjectId(successfulRequest.id),
			});
			expect(untouchedLog).not.toBeNull();
		});

		it('should support reset-failed alias endpoint', async () => {
			const { batch, student1 } = await setup();

			const response = await testApiClient.post(`/${batch.id}/reset-failed`, {
				targetRefIds: [student1.id],
			});

			expect(response.status).toEqual(204);
		});

		it('should return 400 when targetRefIds are not part of batch', async () => {
			const { batch } = await setup();
			const unknownTargetRefId = new ObjectId().toHexString();

			const response = await testApiClient.post(`/${batch.id}/retry-failed`, {
				targetRefIds: [unknownTargetRefId],
			});

			expect(response.status).toEqual(400);
		});
	});
});
