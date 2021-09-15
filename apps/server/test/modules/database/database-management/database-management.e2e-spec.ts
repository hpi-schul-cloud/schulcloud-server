import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MikroORM } from '@mikro-orm/core';

import { ServerAndManagementModule } from '../../../../src/server-and-management.module';

describe('Mongo Management Controller (e2e)', () => {
	describe('When compile ServerAndManagementModule', () => {
		let app: INestApplication;
		let orm: MikroORM;
		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerAndManagementModule],
			}).compile();

			app = module.createNestApplication();
			await app.init();
			orm = module.get(MikroORM);
		});

		afterAll(async () => {
			await app.close();
			await orm.close();
		});

		describe('POST /management/database/seed', () => {
			it('should seed the whole database from filesystem when calling without collection', async () => {
				await request(app.getHttpServer()).post(`/management/database/seed`).expect(201);
			});
			it('should seed a collection from filesystem when calling with collection', async () => {
				await request(app.getHttpServer()).post(`/management/database/seed/accounts`).expect(201);
			});
			it('should export the whole database to filesystem when calling without collection', async () => {
				await request(app.getHttpServer()).post(`/management/database/seed/accounts`).expect(201);
			});
			it('should export a collection to filesystem when calling with collection', async () => {
				await request(app.getHttpServer()).post(`/management/database/export/accounts`).expect(201);
			});
		});
	});
});
