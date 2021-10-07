import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MikroORM } from '@mikro-orm/core';
import { ManagementModule } from '../../../src/modules/management/management.module';

describe('Database Management Controller (e2e)', () => {
	let app: INestApplication;
	let orm: MikroORM;
	const sampleCollectionName = 'accounts';
	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ManagementModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		orm = module.get(MikroORM);
	});

	afterAll(async () => {
		await app.close();
		await orm.close();
	});

	describe('When post to database management route', () => {
		it('should seed all collections', async () => {
			await request(app.getHttpServer()).post(`/management/database/seed`).expect(201);
		});
		it('should seed a collection', async () => {
			await request(app.getHttpServer()).post(`/management/database/seed/${sampleCollectionName}`).expect(201);
		});
		it('should fail for unknown collection', async () => {
			await request(app.getHttpServer()).post(`/management/database/seed/unknown_collection_name`).expect(500);
		});
		it('should export the whole database to filesystem', async () => {
			await request(app.getHttpServer()).post(`/management/database/export`).expect(201);
		});
		it('should export a collection to filesystem', async () => {
			await request(app.getHttpServer()).post(`/management/database/export/${sampleCollectionName}`).expect(201);
		});
	});
});
