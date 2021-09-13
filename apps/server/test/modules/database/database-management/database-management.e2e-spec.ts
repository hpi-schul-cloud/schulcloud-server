import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MikroORM } from '@mikro-orm/core';

import { ServerModule } from '@src/server.module';
import { Configuration } from '@hpi-schul-cloud/commons';
import { ServerAndManagementModule } from '../../../../src/server-and-management.module';

describe('Mongo Management Controller (e2e)', () => {
	describe('When compile ServerAndManagementModule', () => {
		let app: INestApplication;
		let orm: MikroORM;
		beforeAll(async () => {
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerAndManagementModule],
				providers: [
					// {
					// 	provide: 'SEED_DATA_DIR_PATH',
					// 	useValue: '../../../../../../backup/setup',
					// },
				],
				// TODO use memory database instead
			}).compile();

			app = module.createNestApplication();
			await app.init();
			orm = module.get(MikroORM);
		});

		afterAll(async () => {
			await app.close();
			await orm.close();
		});

		describe('POST /management/seed-database', () => {
			it('should seed the database from filesystem', async () => {
				await request(app.getHttpServer()).post(`/management/seed-database`).expect(201);
			});
		});
	});
	describe('When having ServerModule compiled with publishng the mongo console', () => {
		let app: INestApplication;
		let orm: MikroORM;
		const config = Configuration.toObject({ plainSecrets: true });
		beforeAll(async () => {
			Configuration.set('PUBLISH_MONGO_CONSOLE', true);
			const module: TestingModule = await Test.createTestingModule({
				imports: [ServerModule],
			}).compile();

			app = module.createNestApplication();
			await app.init();
			orm = module.get(MikroORM);
		});

		afterAll(async () => {
			await app.close();
			await orm.close();
			Configuration.reset(config);
		});

		describe('POST /mongo-console/drop', () => {
			it.skip('should allow dropping the database', async () => {
				const response = await request(app.getHttpServer()).post(`/mongo-console/drop`).expect(200);
				// const removedCollections: string[] = response.body as string[];
				// expect(removedCollections).toHaveLength;
			});
		});
	});
});
