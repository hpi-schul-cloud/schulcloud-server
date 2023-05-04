import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { JwtAuthGuard } from '@src/modules/authentication/guard/jwt-auth.guard';
import { Request } from 'express';
import request from 'supertest';
import { H5PEditorModule } from '../../h5p-editor.module';

class API {
	constructor(private app: INestApplication) {}

	async get(path: string) {
		return request(this.app.getHttpServer()).get(`/h5p-editor/${path}`);
	}
}

describe('H5PEditor Controller (api)', () => {
	let app: INestApplication;
	let api: API;

	let currentUser: ICurrentUser;

	beforeAll(async () => {
		const module = await Test.createTestingModule({
			imports: [H5PEditorModule],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					req.user = currentUser;
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

	describe('getPlayer', () => {
		it('should return a response', async () => {
			const response = await api.get('dummyID/play');

			expect(response.status).toEqual(200);
		});
	});

	describe('getEditor', () => {
		it('should return a response', async () => {
			const response = await api.get('dummyID/edit');

			expect(response.status).toEqual(200);
		});
	});
});
