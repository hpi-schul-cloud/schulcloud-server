import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/repo';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { DomainName } from '../../../domain/types';
import { DeletionRequestEntity } from '../../../repo/entity';
import { DeletionRequestBodyParams, DeletionRequestResponse } from '../dto';

const baseRouteName = '/deletionRequests';

const getMinDeletionPlannedAt = (creationDate: Date, diffInMinutes: number, toleranceInSeconds: number): Date => {
	const minDeletionPlannedAt = new Date(creationDate.getTime());

	minDeletionPlannedAt.setMinutes(minDeletionPlannedAt.getMinutes() + diffInMinutes);
	minDeletionPlannedAt.setSeconds(minDeletionPlannedAt.getSeconds() - toleranceInSeconds);

	return minDeletionPlannedAt;
};

const getMaxDeletionPlannedAt = (creationDate: Date, diffInMinutes: number, toleranceInSeconds: number): Date => {
	const maxDeletionPlannedAt = new Date(creationDate.getTime());

	maxDeletionPlannedAt.setMinutes(maxDeletionPlannedAt.getMinutes() + diffInMinutes);
	maxDeletionPlannedAt.setSeconds(maxDeletionPlannedAt.getSeconds() + toleranceInSeconds);

	return maxDeletionPlannedAt;
};

const getMinAndMaxDeletionPlannedAt = (creationDate: Date, diffInMinutes: number, toleranceInSeconds: number) => {
	const minDeletionPlannedAt = getMinDeletionPlannedAt(creationDate, diffInMinutes, toleranceInSeconds);
	const maxDeletionPlannedAt = getMaxDeletionPlannedAt(creationDate, diffInMinutes, toleranceInSeconds);

	return { minDeletionPlannedAt, maxDeletionPlannedAt };
};

const isDeletionPlannedWithinAcceptableRange = (
	creationDate: Date,
	deletionPlannedAt: Date,
	diffInMinutes: number,
	toleranceInSeconds: number
) => {
	const { minDeletionPlannedAt, maxDeletionPlannedAt } = getMinAndMaxDeletionPlannedAt(
		creationDate,
		diffInMinutes,
		toleranceInSeconds
	);

	return deletionPlannedAt >= minDeletionPlannedAt && deletionPlannedAt <= maxDeletionPlannedAt;
};

describe(`deletionRequest create (api)`, () => {
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

	describe('createDeletionRequests', () => {
		const setup = async () => {
			const { studentUser, studentAccount } = UserAndAccountTestFactory.buildStudent();

			await em.persist([studentUser, studentAccount]).flush();
			em.clear();

			const deletionRequestToCreate: DeletionRequestBodyParams = {
				targetRef: {
					domain: DomainName.USER,
					id: studentUser.id,
				},
			};

			const deletionRequestToImmediateRemoval: DeletionRequestBodyParams = {
				targetRef: {
					domain: DomainName.USER,
					id: studentUser.id,
				},
				deleteAfterMinutes: 0,
			};

			const defaultDeleteAfterMinutes = 43200;

			const operationalTimeToleranceInSeconds = 30;

			return {
				deletionRequestToCreate,
				deletionRequestToImmediateRemoval,
				defaultDeleteAfterMinutes,
				operationalTimeToleranceInSeconds,
			};
		};

		it('should return status 202', async () => {
			const { deletionRequestToCreate } = await setup();

			const response = await testApiClient.post('', deletionRequestToCreate);

			expect(response.status).toEqual(202);
		});

		it('should return the created deletionRequest', async () => {
			const { deletionRequestToCreate } = await setup();

			const response = await testApiClient.post('', deletionRequestToCreate);

			const result = response.body as DeletionRequestResponse;
			expect(result.requestId).toBeDefined();
		});

		it('should deactivate the user account', async () => {
			const { deletionRequestToCreate } = await setup();

			await testApiClient.post('', deletionRequestToCreate);
			const account = await em.findOne(AccountEntity, { userId: new ObjectId(deletionRequestToCreate.targetRef.id) });
			expect(account?.deactivatedAt).toBeDefined();
		});

		describe('when the "delete after minutes" param has not been provided', () => {
			it('should set the "deleteAfter" date to the date after the default DELETION_DELETE_AFTER_MINUTES ', async () => {
				const { deletionRequestToCreate, defaultDeleteAfterMinutes, operationalTimeToleranceInSeconds } = await setup();

				const response = await testApiClient.post('', deletionRequestToCreate);

				const result = response.body as DeletionRequestResponse;
				const createdDeletionRequestId = result.requestId;

				const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

				const isDeletionPlannedAtDateCorrect = isDeletionPlannedWithinAcceptableRange(
					createdItem.createdAt,
					createdItem.deleteAfter,
					defaultDeleteAfterMinutes,
					operationalTimeToleranceInSeconds
				);

				expect(isDeletionPlannedAtDateCorrect).toEqual(true);
			});
		});

		describe('when the "delete after minutes" param has been set to 0', () => {
			it('should set the "deleteAfter" date to now', async () => {
				const { deletionRequestToImmediateRemoval, operationalTimeToleranceInSeconds } = await setup();

				const response = await testApiClient.post('', deletionRequestToImmediateRemoval);

				const result = response.body as DeletionRequestResponse;
				const createdDeletionRequestId = result.requestId;

				const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

				const isDeletionPlannedAtDateCorrect = isDeletionPlannedWithinAcceptableRange(
					createdItem.createdAt,
					createdItem.deleteAfter,
					0,
					operationalTimeToleranceInSeconds
				);

				expect(isDeletionPlannedAtDateCorrect).toEqual(true);
			});
		});

		describe('when the "delete after minutes" param has been set to > 0', () => {
			it('should set the "deleteAfter" date to now plus "delete after minutes" ', async () => {
				const { deletionRequestToCreate, operationalTimeToleranceInSeconds } = await setup();

				const deleteAfterMinutes = 120;

				deletionRequestToCreate.deleteAfterMinutes = deleteAfterMinutes;

				const response = await testApiClient.post('', deletionRequestToCreate);

				const result = response.body as DeletionRequestResponse;
				const createdDeletionRequestId = result.requestId;

				const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

				const isDeletionPlannedAtDateCorrect = isDeletionPlannedWithinAcceptableRange(
					createdItem.createdAt,
					createdItem.deleteAfter,
					deleteAfterMinutes,
					operationalTimeToleranceInSeconds
				);

				expect(isDeletionPlannedAtDateCorrect).toEqual(true);
			});
		});
	});
});
