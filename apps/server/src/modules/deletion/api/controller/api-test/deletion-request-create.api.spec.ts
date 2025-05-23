import { EntityManager } from '@mikro-orm/mongodb';
import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
		const config = adminApiServerConfig();
		config.ADMIN_API__ALLOWED_API_KEYS = [API_KEY];

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
		describe('when called', () => {
			const setup = () => {
				const deletionRequestToCreate: DeletionRequestBodyParams = {
					targetRef: {
						domain: DomainName.USER,
						id: '653e4833cc39e5907a1e18d2',
					},
				};

				const deletionRequestToImmediateRemoval: DeletionRequestBodyParams = {
					targetRef: {
						domain: DomainName.USER,
						id: '653e4833cc39e5907a1e18d2',
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
				const { deletionRequestToCreate } = setup();

				const response = await testApiClient.post('', deletionRequestToCreate);

				expect(response.status).toEqual(202);
			});

			it('should return the created deletionRequest', async () => {
				const { deletionRequestToCreate } = setup();

				const response = await testApiClient.post('', deletionRequestToCreate);

				const result = response.body as DeletionRequestResponse;
				expect(result.requestId).toBeDefined();
			});

			describe('when the "delete after minutes" param has not been provided', () => {
				it('should set the "deleteAfter" date to the date after the default DELETION_DELETE_AFTER_MINUTES ', async () => {
					const { deletionRequestToCreate, defaultDeleteAfterMinutes, operationalTimeToleranceInSeconds } = setup();

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
					const { deletionRequestToImmediateRemoval, operationalTimeToleranceInSeconds } = setup();

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
					const { deletionRequestToCreate, operationalTimeToleranceInSeconds } = setup();

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
});
