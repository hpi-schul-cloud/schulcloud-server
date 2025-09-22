import { faker } from '@faker-js/faker/locale/af_ZA';
import { createMock } from '@golevelup/ts-jest';
import { FeathersServiceProvider } from '@infra/feathers';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mongodb';
import { ManagementServerTestModule } from '@modules/management/management-server.app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { createCollections } from '@testing/create-collections';
import request from 'supertest';

describe('Database Management Controller (API)', () => {
	let app: NestExpressApplication;
	let orm: MikroORM;
	const sampleCollectionName = 'accounts';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ManagementServerTestModule],
			providers: [
				{
					provide: FeathersServiceProvider,
					useValue: createMock<FeathersServiceProvider>(),
				},
			],
		})
			.overrideProvider(FeathersServiceProvider)
			.useValue(createMock<FeathersServiceProvider>())
			.compile();

		app = module.createNestApplication(new ExpressAdapter());
		app.useBodyParser('text');
		await app.init();
		orm = module.get(MikroORM);
		await orm.getSchemaGenerator().clearDatabase();

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
		});
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
			const result = await request(app.getHttpServer()).post(`/management/database/sync-indexes`);

			expect(result.status).toEqual(201);
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
