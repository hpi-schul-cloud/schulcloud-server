import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ApiValidationError } from '@shared/common';
import { Request } from 'express';
import request from 'supertest';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiServerTestModule } from '../../../server/admin-api.server.module';
import { DeletionExecutionParams } from '../dto';

const baseRouteName = '/deletionExecutions';

class API {
	app: INestApplication;

	constructor(app: INestApplication) {
		this.app = app;
	}

	async post(query?: DeletionExecutionParams) {
		const response = await request(this.app.getHttpServer())
			.post(`${baseRouteName}`)
			.set('Accept', 'application/json')
			.query(query || {});

		return {
			error: response.body as ApiValidationError,
			status: response.status,
		};
	}
}

describe(`deletionExecution (api)`, () => {
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

	describe('when execute deletionRequests with default limit', () => {
		it('should return status 204', async () => {
			const response = await api.post();

			expect(response.status).toEqual(204);
		});
	});
});
