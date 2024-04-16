import { INestApplication } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerTestModule } from '@modules/server';
import request from 'supertest';
import { of } from 'rxjs';
import { axiosResponseFactory } from '@shared/testing';
import { ConfigModule } from '@nestjs/config';
import { createConfigModuleOptions } from '@src/config';
import { alertTestConfig } from '../../config';
import { AlertResponse } from '../dto';

describe('Alert Controller api', () => {
	const alertPath = '/alert';

	let app: INestApplication;
	let httpService: DeepMocked<HttpService>;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule, ConfigModule.forRoot(createConfigModuleOptions(alertTestConfig))],
			providers: [
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
			],
		}).compile();
		app = module.createNestApplication();
		await app.init();
		httpService = module.get(HttpService);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET]', () => {
		describe('when no incidents', () => {
			const setup = () => {
				jest.spyOn(httpService, 'get').mockImplementation(() => {
					const response = axiosResponseFactory.build({ data: [] });
					return of(response);
				});
			};

			it('should return empty alert list', async () => {
				setup();
				const response = await request(app.getHttpServer()).get(alertPath).expect(200);

				const { data } = response.body as AlertResponse;
				expect(data.length).toBe(0);
			});
		});
	});
});
