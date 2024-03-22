import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from '@mikro-orm/mongodb';
import { TestXApiKeyClient, cleanupCollections } from '@shared/testing';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { DeletionRequestLogResponse } from '../dto';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest find (api)`, () => {
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

				const response = await testXApiKeyClient.get(`${deletionRequest.id}`);

				expect(response.status).toEqual(200);
			});

			it('should return the found deletionRequest', async () => {
				const { deletionRequest } = await setup();

				const response = await testXApiKeyClient.get(`${deletionRequest.id}`);
				const result = response.body as DeletionRequestLogResponse;

				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
				expect(result.targetRef.id).toEqual(deletionRequest.targetRefId);
			});
		});
	});
});
