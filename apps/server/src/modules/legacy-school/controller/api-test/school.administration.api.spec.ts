import { EntityManager } from '@mikro-orm/mongodb';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { TestApiClient, TestXApiKeyClient, federalStateFactory } from '@shared/testing';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.module';
import { AdminApiSchoolCreateResponseDto } from '../dto/response/admin-api-school-create.response.dto';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let testXApiKeyClient: TestXApiKeyClient;
	let testApiClient: TestApiClient;
	let em: EntityManager;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testXApiKeyClient = new TestXApiKeyClient(app, baseRouteName);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('create a school', () => {
		describe('without token', () => {
			it('should refuse with wrong token', async () => {
				const client = new TestXApiKeyClient(app, baseRouteName, 'thisisaninvalidapikey');
				const response = await client.post('');
				expect(response.status).toEqual(401);
			});
			it('should refuse without token', async () => {
				const response = await testApiClient.post('');
				expect(response.status).toEqual(401);
			});
		});

		describe('with api token', () => {
			const setup = async () => {
				const federalState = federalStateFactory.build({ name: 'niedersachsen' });
				await em.persistAndFlush(federalState);
				return { federalState };
			};

			it('should return school', async () => {
				const { federalState } = await setup();
				const response = await testXApiKeyClient.post('', { name: 'schoolname', federalStateName: federalState.name });
				expect(response.status).toEqual(201);
				const result = response.body as AdminApiSchoolCreateResponseDto;
				expect(result.id).toBeDefined();
			});

			it('should have persisted the school', async () => {
				const { federalState } = await setup();

				const response = await testXApiKeyClient.post('', { name: 'schoolname', federalStateName: federalState.name });

				const { id } = response.body as AdminApiSchoolCreateResponseDto;
				const loaded = await em.findOneOrFail(SchoolEntity, id);
				expect(loaded).toBeDefined();
			});
		});
	});
});
