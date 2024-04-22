import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TestApiClient, cleanupCollections } from '@shared/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { deletionRequestEntityFactory } from '../../../repo/entity/testing';
import { DeletionRequestEntity } from '../../../repo/entity';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest delete (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
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
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('cancelDeletionRequest', () => {
		describe('when deletiong deletionRequest', () => {
			const setup = async () => {
				await cleanupCollections(em);
				const deletionRequest = deletionRequestEntityFactory.build();

				await em.persistAndFlush(deletionRequest);
				em.clear();

				return { deletionRequest };
			};

			it('should return status 204', async () => {
				const { deletionRequest } = await setup();

				const response = await testApiClient.delete(`${deletionRequest.id}`);

				expect(response.status).toEqual(204);
			});

			it('should actually delete deletionRequest', async () => {
				const { deletionRequest } = await setup();

				await testApiClient.delete(`${deletionRequest.id}`);

				await expect(em.findOneOrFail(DeletionRequestEntity, deletionRequest.id)).rejects.toThrow();
			});
		});
	});
});
