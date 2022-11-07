import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ServerTestModule } from '@src/modules/server';
import request from 'supertest';

describe('ServerController (e2e)', () => {
	let app: INestApplication;
	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
	});

	afterAll(async () => {
		await app.close();
	});

	it('/ (GET)', () => {
		return request(app.getHttpServer()).get('/').expect(200).expect('Schulcloud Server API');
	});
});
