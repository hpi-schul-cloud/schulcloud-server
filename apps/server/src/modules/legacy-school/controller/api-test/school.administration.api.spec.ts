import { EntityManager } from '@mikro-orm/mongodb';
import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchoolEntity } from '@shared/domain/entity';
import { TestApiClient, federalStateFactory } from '@shared/testing/factory';
import { AdminApiServerTestModule } from '@src/modules/server/admin-api.server.module';
import { AuthGuard } from '@nestjs/passport';
import { AdminApiSchoolCreateResponseDto } from '../dto/response/admin-api-school-create.response.dto';

const baseRouteName = '/admin/schools';

describe('Admin API - Schools (API)', () => {
	let app: INestApplication;
	let testApiClient: TestApiClient;
	let em: EntityManager;
	const API_KEY = '7ccd4e11-c6f6-48b0-81eb-cccf7922e7a4';

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [AdminApiServerTestModule],
		})
			.overrideGuard(AuthGuard('api-key'))
			.useValue({
				canActivate(context: ExecutionContext) {
					const req: Request = context.switchToHttp().getRequest();
					return req.headers['x-api-key'] === API_KEY;
				},
			})
			.compile();

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
				expect(response.status).toEqual(403);
			});
			it('should refuse without token', async () => {
				const client = new TestApiClient(app, baseRouteName, '', true);
				const response = await client.post('');
				expect(response.status).toEqual(403);
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
