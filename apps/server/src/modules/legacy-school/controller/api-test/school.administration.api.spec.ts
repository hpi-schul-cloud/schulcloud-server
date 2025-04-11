import { EntityManager } from '@mikro-orm/mongodb';
import { SchoolEntity } from '@modules/school/repo';
import { federalStateEntityFactory, schoolYearEntityFactory, storageProviderFactory } from '@modules/school/testing';
import { adminApiServerConfig } from '@modules/server/admin-api-server.config';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TestApiClient } from '@testing/test-api-client';
import { AdminApiSchoolCreateResponseDto } from '../dto/response/admin-api-school-create.response.dto';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);

		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const apiKeys = adminApiServerConfig().ADMIN_API__ALLOWED_API_KEYS as string[]; // check config/test.json
		testApiClient = new TestApiClient(app, baseRouteName, apiKeys[0], true);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create a school', () => {
		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestApiClient(app, baseRouteName, 'thisisaninvalidapikey', true);

				const response = await client.post('');

				expect(response.status).toEqual(401);
			});
			it('should refuse without token', async () => {
				const client = new TestApiClient(app, baseRouteName, '', true);

				const response = await client.post('');

				expect(response.status).toEqual(401);
			});
		});

		describe('with api token', () => {
			const setup = async () => {
				const federalState = federalStateEntityFactory.build({ name: 'niedersachsen' });
				const year = schoolYearEntityFactory.build();
				const storageProvider = storageProviderFactory.build();
				await em.persistAndFlush([federalState, year, storageProvider]);
				return { federalState, year };
			};

			it('should return school', async () => {
				const { federalState } = await setup();

				const response = await testApiClient.post('', { name: 'schoolname', federalStateName: federalState.name });

				expect(response.status).toEqual(201);
				const result = response.body as AdminApiSchoolCreateResponseDto;
				expect(result.id).toBeDefined();
			});

			it('should have persisted the school', async () => {
				const { federalState } = await setup();

				const response = await testApiClient.post('', { name: 'schoolname', federalStateName: federalState.name });

				const { id } = response.body as AdminApiSchoolCreateResponseDto;
				const loaded = await em.findOneOrFail(SchoolEntity, id);
				expect(loaded).toBeDefined();
			});
		});
	});
});
