import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { InternalServerTestModule } from '@modules/internal-server/internal-server-test.module';
import { cleanupCollections } from '@testing/cleanup-collections';
import type { Server } from 'node:net';
import { HealthStatuses } from '../../domain';
import { HealthStatusResponse } from '../dto';

class API {
	app: INestApplication<Server>;

	constructor(app: INestApplication<Server>) {
		this.app = app;
	}

	async get(pathSuffix: string) {
		const response = await request(this.app.getHttpServer()).get(`/health${pathSuffix}`);

		return {
			result: response.body as HealthStatusResponse,
			status: response.status,
		};
	}
}

describe('health checks (api)', () => {
	let app: INestApplication<Server>;
	let em: EntityManager;
	let api: API;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [InternalServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		api = new API(app);
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		em.clear();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('the self-only health check', () => {
		it('should return 200 OK HTTP status', async () => {
			const response = await api.get('/self');

			expect(response.status).toEqual(200);
		});

		it(
			`should return '${HealthStatuses.STATUS_PASS}' health status` +
				'and no additional checks info (as none are performed underneath)',
			async () => {
				const response = await api.get('/self');

				expect(response.result.status).toEqual(HealthStatuses.STATUS_PASS);
				expect(response.result.checks).toBeUndefined();
			}
		);
	});

	describe(`the overall health check`, () => {
		it('should return 200 OK HTTP status', async () => {
			const response = await api.get('');

			expect(response.status).toEqual(200);
		});

		it(`should return '${HealthStatuses.STATUS_PASS}' health status and some additional checks info`, async () => {
			const response = await api.get('');

			expect(response.result.status).toEqual(HealthStatuses.STATUS_PASS);
			expect(response.result.checks).toBeDefined();
		});
	});
});
