import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { TestXApiKeyClient, cleanupCollections } from '@shared/testing';
import { EntityManager } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '../../../server/admin-api.server.module';
import { deletionRequestEntityFactory } from '../../entity/testing';
import { DeletionRequestEntity } from '../../entity';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest delete (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let testXApiKeyClient: TestXApiKeyClient;
	const API_KEY = '1ab2c3d4e5f61ab2c3d4e5f6';

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

	const setup = async () => {
		await cleanupCollections(em);
		const deletionRequest = deletionRequestEntityFactory.build();

		await em.persistAndFlush(deletionRequest);
		em.clear();

		return { deletionRequest };
	};

	describe('when deletiong deletionRequest', () => {
		it('should return status 204', async () => {
			const { deletionRequest } = await setup();

			const response = await testXApiKeyClient.delete(deletionRequest.id);

			expect(response.status).toEqual(204);
		});

		it('should actually delete deletionRequest', async () => {
			const { deletionRequest } = await setup();

			await testXApiKeyClient.delete(deletionRequest.id);

			await expect(em.findOneOrFail(DeletionRequestEntity, deletionRequest.id)).rejects.toThrow();
		});
	});
});
