import { EntityManager } from '@mikro-orm/mongodb';
import { AdminApiServerTestModule } from '@modules/server/admin-api.server.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { federalStateFactory } from '@testing/factory/federal-state.factory';
import { schoolYearFactory } from '@testing/factory/schoolyear.factory';
import { storageProviderFactory } from '@testing/factory/storageprovider.factory';
import { TestApiClient } from '@testing/test-api-client';
import { AdminApiSchoolCreateResponseDto } from '../dto/response/admin-api-school-create.response.dto';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;
	const API_KEY = 'someotherkey';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName, API_KEY, true);
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
				const federalState = federalStateFactory.build({ name: 'niedersachsen' });
				const year = schoolYearFactory.build();
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
