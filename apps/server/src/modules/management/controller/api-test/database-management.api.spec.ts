import { createMock } from '@golevelup/ts-jest';
import { type FeathersServiceProvider } from '@infra/feathers';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ManagementServerTestModule } from '@modules/management/management-server.app.module';
import { ExpressAdapter, type NestExpressApplication } from '@nestjs/platform-express';
import { Test, type TestingModule } from '@nestjs/testing';
import { createCollections } from '@testing/create-collections';
import request from 'supertest';

describe('Database Management Controller (API)', () => {
	let app: NestExpressApplication;
	let orm: MikroORM;
	const sampleCollectionName = 'accounts';
	const legacyIndexService = createMock<ReturnType<FeathersServiceProvider['getService']>>();
	const legacyApp = {
		service: jest.fn().mockReturnValue(legacyIndexService),
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ManagementServerTestModule],
		}).compile();

		app = module.createNestApplication(new ExpressAdapter());
		app.getHttpAdapter().getInstance().set('feathersApp', legacyApp);
		app.useBodyParser('text');
		await app.init();
		orm = module.get(MikroORM);
		await orm.schema.clear();

		const em = module.get(EntityManager);
		await createCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('When post to database management route', () => {
		it('should seed all collections', async () => {
			const result = await request(app.getHttpServer()).post(`/management/database/seed`);

			expect(result.status).toEqual(200);
		});
		it('should seed all collections with sync indexes', async () => {
			const result = await request(app.getHttpServer()).get(`/management/database/seed?with-indexes=true`);

			expect(result.status).toEqual(200);
		}, 30000);
		it('should seed a collection', async () => {
			const result = await request(app.getHttpServer()).post(`/management/database/seed/${sampleCollectionName}`);

			expect(result.status).toEqual(201);
		});
		it('should fail for unknown collection', async () => {
			const result = await request(app.getHttpServer()).post(`/management/database/seed/unknown_collection_name`);

			expect(result.status).toEqual(500);
		});
		it('should export the whole database to filesystem', async () => {
			const result = await request(app.getHttpServer()).post(`/management/database/export`);

			expect(result.status).toEqual(201);
		});
		it('should export a collection to filesystem', async () => {
			const result = await request(app.getHttpServer()).post(`/management/database/export/${sampleCollectionName}`);

			expect(result.status).toEqual(201);
		});
		it('should create indexes', async () => {
			const ensureIndexes = jest.spyOn(orm.schema, 'ensureIndexes');
			legacyIndexService.create.mockImplementationOnce(async () => {
				await Promise.resolve();
				expect(ensureIndexes).not.toHaveBeenCalled();
				return {};
			});

			try {
				const result = await request(app.getHttpServer()).post(`/management/database/sync-indexes`);

				expect(result.status).toEqual(201);
				expect(legacyApp.service).toHaveBeenLastCalledWith('sync-legacy-indexes');
				expect(legacyIndexService.create).toHaveBeenCalledTimes(1);
				expect(ensureIndexes).toHaveBeenCalledTimes(1);
			} finally {
				ensureIndexes.mockRestore();
			}
		});
		it('should require the legacy application reference before syncing ORM indexes', async () => {
			const ensureIndexes = jest.spyOn(orm.schema, 'ensureIndexes');
			app.getHttpAdapter().getInstance().set('feathersApp', undefined);
			try {
				const result = await request(app.getHttpServer()).post(`/management/database/sync-indexes`);

				expect(result.status).toEqual(418);
				expect(ensureIndexes).not.toHaveBeenCalled();
			} finally {
				app.getHttpAdapter().getInstance().set('feathersApp', legacyApp);
				ensureIndexes.mockRestore();
			}
		});
		it('should not sync ORM indexes if legacy index synchronization fails', async () => {
			const ensureIndexes = jest.spyOn(orm.schema, 'ensureIndexes');
			legacyIndexService.create.mockRejectedValueOnce(new Error('Legacy index synchronization failed'));
			try {
				const result = await request(app.getHttpServer()).post(`/management/database/sync-indexes`);

				expect(result.status).toEqual(500);
				expect(ensureIndexes).not.toHaveBeenCalled();
			} finally {
				ensureIndexes.mockRestore();
			}
		});
		it('should encrypt plain text', async () => {
			const plainText = 'somePlainText';
			const key = 'someKey';
			const body = { plainText, key };

			const result = await request(app.getHttpServer())
				.post(`/management/database/encrypt-plain-text`)
				.set('content-type', 'application/json')
				.send(body);

			expect(result.status).toEqual(200);
			// If the test fails because the encryption algorithm has been changed,
			// do not forget to migrate encrypted values from the database accordingly!
			// We can't test for a specific value, because the encryption is non-deterministic.
			expect(result.text).toHaveLength(60);
		});
	});
});
