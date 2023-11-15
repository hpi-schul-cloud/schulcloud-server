import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Request } from 'express';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { EntityManager } from '@mikro-orm/mongodb';
import { cleanupCollections } from '@shared/testing';
import { AdminApiServerTestModule } from '../../../server/admin-api.server.module';
import { DeletionRequestLogResponse } from '../dto';
import { deletionRequestEntityFactory } from '../../entity/testing';

const baseRouteName = '/deletionRequests';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async get(deletionRequestId: string) {
		const response = await request(this.app.getHttpServer())
			.get(`${baseRouteName}/${deletionRequestId}`)
			.set('Accept', 'application/json');

		return {
			result: response.body as DeletionRequestLogResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`deletionRequest find (api)`, () => {
	let app: INestApplication;
	let em: EntityManager;
	let api: API;
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
		api = new API(app);
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

	describe('when searching for deletionRequest', () => {
		it('should return status 202', async () => {
			const { deletionRequest } = await setup();

			const response = await api.get(deletionRequest.id);

			expect(response.status).toEqual(200);
		});

		it('should return the found deletionRequest', async () => {
			const { deletionRequest } = await setup();

			const { result } = await api.get(deletionRequest.id);

			expect(result.targetRef.id).toEqual(deletionRequest.targetRefId);
		});
	});
});
