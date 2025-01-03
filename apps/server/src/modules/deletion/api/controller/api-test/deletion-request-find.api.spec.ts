import { XApiKeyGuard } from '@infra/auth-guard';
import { EntityManager } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient, cleanupCollections } from '@shared/testing';
import { Request } from 'express';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { DeletionRequestLogResponse } from '../dto';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest find (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideGuard(XApiKeyGuard)
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
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('getPerformedDeletionDetails', () => {
		describe('when searching for deletionRequest', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persistAndFlush(deletionRequest);
				em.clear();

				return { deletionRequest };
			};
			it('should return status 202', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.get(`${deletionRequest.id}`);

				expect(response.status).toEqual(200);
			});

			it('should return the found deletionRequest', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.get(`${deletionRequest.id}`);
				const result = response.body as DeletionRequestLogResponse;

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(result.targetRef.id).toEqual(deletionRequest.targetRefId);
			});
		});
	});
});
