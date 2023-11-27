import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from '@mikro-orm/mongodb';
import { TestXApiKeyClient } from '@shared/testing';
import { AdminApiServerTestModule } from '../../../server/admin-api.server.module';
import { DeletionRequestBodyProps, DeletionRequestResponse } from '../dto';
import { DeletionDomainModel } from '../../domain/types';
import { DeletionRequestEntity } from '../../entity';

const baseRouteName = '/deletionRequests';

describe(`deletionRequest create (api)`, () => {
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

	const setup = () => {
		const deletionRequestToCreate: DeletionRequestBodyProps = {
			targetRef: {
				domain: DeletionDomainModel.USER,
				id: '653e4833cc39e5907a1e18d2',
			},
		};

		const deletionRequestToImmediateRemoval: DeletionRequestBodyProps = {
			targetRef: {
				domain: DeletionDomainModel.USER,
				id: '653e4833cc39e5907a1e18d2',
			},
			deleteInMinutes: 0,
		};

		return { deletionRequestToCreate, deletionRequestToImmediateRemoval };
	};

	describe('when create deletionRequest', () => {
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

		it('should create deletionRequest with default deletion time (add 43200 minutes to current time) ', async () => {
			const { deletionRequestToCreate } = setup();

			const response = await testXApiKeyClient.post('', deletionRequestToCreate);

			const result = response.body as DeletionRequestResponse;
			const createdDeletionRequestId = result.requestId;

			const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

			const deletionPlannedAt = createdItem.createdAt;
			deletionPlannedAt.setMinutes(deletionPlannedAt.getMinutes() + 43200);

			expect(createdItem.deleteAfter).toEqual(deletionPlannedAt);
		});

		it('should create deletionRequest with deletion time (0 minutes to current time) ', async () => {
			const { deletionRequestToImmediateRemoval } = setup();

			const response = await testXApiKeyClient.post('', deletionRequestToImmediateRemoval);

			const result = response.body as DeletionRequestResponse;
			const createdDeletionRequestId = result.requestId;

			const createdItem = await em.findOneOrFail(DeletionRequestEntity, createdDeletionRequestId);

			expect(createdItem.createdAt).toEqual(createdItem.deleteAfter);
		});
	});
});
