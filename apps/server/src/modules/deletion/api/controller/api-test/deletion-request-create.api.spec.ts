import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from '@mikro-orm/mongodb';
import { TestXApiKeyClient } from '@shared/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { DeletionRequestBodyProps, DeletionRequestResponse } from '../dto';
import { DeletionRequestEntity } from '../../../repo/entity';
import { DomainName } from '../../../domain/types';

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
	let testXApiKeyClient: TestXApiKeyClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideGuard(AuthGuard('api-key'))
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.headers['X-API-KEY'] = API_KEY;
					return true;
				},
			})
			.compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('createDeletionRequests', () => {
		describe('when called', () => {
			const setup = () => {
				const deletionRequestToCreate: DeletionRequestBodyProps = {
					targetRef: {
						domain: DomainName.USER,
						id: '653e4833cc39e5907a1e18d2',
					},
				};

				const deletionRequestToImmediateRemoval: DeletionRequestBodyProps = {
					targetRef: {
						domain: DomainName.USER,
						id: '653e4833cc39e5907a1e18d2',
					},
					deleteInMinutes: 0,
				};

				const defaultDeleteInMinutes = 43200;

				const operationalTimeToleranceInSeconds = 30;

				return {
					deletionRequestToCreate,
					deletionRequestToImmediateRemoval,
					defaultDeleteInMinutes,
					operationalTimeToleranceInSeconds,
				};
			};

			it('should return status 202', async () => {
				const { deletionRequestToCreate } = setup();

				const response = await testXApiKeyClient.post('', deletionRequestToCreate);

				expect(response.status).toEqual(202);
			});

			it('should return the created deletionRequest', async () => {
				const { deletionRequestToCreate } = setup();

				const response = await testXApiKeyClient.post('', deletionRequestToCreate);

				const result = response.body as DeletionRequestResponse;
				expect(result.requestId).toBeDefined();
			});

			describe('when the "delete in minutes" param has not been provided', () => {
				it(
					'should set the "deletion planned at" date to the date after the default "delete in minutes" value ' +
						'(43200 minutes which is 30 days), with some operational time tolerance',
					async () => {
						const { deletionRequestToCreate, defaultDeleteInMinutes, operationalTimeToleranceInSeconds } = setup();

						const response = await testXApiKeyClient.post('', deletionRequestToCreate);

						const result = response.body as DeletionRequestResponse;
						const createdDeletionRequestId = result.requestId;

						const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

						const isDeletionPlannedAtDateCorrect = isDeletionPlannedWithinAcceptableRange(
							createdItem.createdAt,
							createdItem.deleteAfter,
							defaultDeleteInMinutes,
							operationalTimeToleranceInSeconds
						);

						expect(isDeletionPlannedAtDateCorrect).toEqual(true);
					}
				);
			});

			describe('when the "delete in minutes" param has been set to 0', () => {
				it('should set the "deletion planned at" date to now, with some operational time tolerance', async () => {
					const { deletionRequestToImmediateRemoval, operationalTimeToleranceInSeconds } = setup();

					const response = await testXApiKeyClient.post('', deletionRequestToImmediateRemoval);

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
		});
	});
});
