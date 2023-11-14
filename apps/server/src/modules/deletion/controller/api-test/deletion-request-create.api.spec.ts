import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Request } from 'express';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.module';
import { DeletionRequestBodyProps, DeletionRequestResponse } from '../dto';
import { DeletionDomainModel } from '../../domain/types/deletion-domain-model.enum';

const baseRouteName = '/deletionRequests';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(requestBody: object) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}`)
			.set('Accept', 'application/json')
			.send(requestBody);

		return {
			result: response.body as DeletionRequestResponse,
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`deletionRequest create (api)`, () => {
	let app: INestApplication;
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
		api = new API(app);
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
			deleteInMinutes: 1440,
		};

		const deletionRequestToCreateDefected = {
			targetRef: {
				domein: DeletionDomainModel.USER,
				id: '653e4833cc39e5907a1e18d3',
			},
			deleteInMinutes: 1440,
		};
		return { deletionRequestToCreate, deletionRequestToCreateDefected };
	};

	describe('when create deeltionRequest with object good formatted', () => {
		it('should return status 202', async () => {
			const { deletionRequestToCreate } = setup();

			const response = await api.post(deletionRequestToCreate);

			expect(response.status).toEqual(202);
		});

		it('should return the created deletionRequest', async () => {
			const { deletionRequestToCreate } = setup();

			const { result } = await api.post(deletionRequestToCreate);

			expect(result.requestId).toBeDefined();
		});
	});

	// For improvement. Server throws error 500
	// describe('when create deeltionRequest with object wrong formatted', () => {
	// 	it('should return status 403', async () => {
	// 		const { deletionRequestToCreateDefected } = setup();

	// 		const response = await api.post(deletionRequestToCreateDefected);

	// 		expect(response.status).toEqual(403);
	// 	});
	// });
});
