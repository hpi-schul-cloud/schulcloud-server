import { EntityManager } from '@mikro-orm/mongodb';
import { roleFactory } from '@modules/management/seed-data/factory/role.factory';
import { schoolEntityFactory } from '@modules/management/seed-data/factory/school.entity.factory';
import { RoleName } from '@modules/role';
import { SchoolPurpose } from '@modules/school/domain';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { registrationEntityFactory } from '../../testing/registration-entity.factory';

describe('Room Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;
	let config: ServerConfig;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'registrations');

		config = serverConfig();
	});

	beforeEach(async () => {
		await cleanupCollections(em);
		config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('POST /registrations/by-secret/:registrationSecret/complete', () => {
		const setup = async () => {
			const registration = registrationEntityFactory.build();
			const externalPersonRole = roleFactory.build({
				name: RoleName.EXTERNALPERSON,
			});
			const externalPersonsSchool = schoolEntityFactory.build({
				name: 'External Persons School',
				purpose: SchoolPurpose.EXTERNAL_PERSON_SCHOOL,
			});
			await em.persistAndFlush([registration, externalPersonRole, externalPersonsSchool]);
			em.clear();

			return { registration, externalPersonRole };
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = false;
				const { registration } = await setup();

				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: 'password123',
				});

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the registration exists', () => {
			it('should return a registration', async () => {
				const { registration } = await setup();
				const response = await testApiClient.post(`/by-secret/${registration.registrationSecret}/complete`, {
					language: 'en',
					password: 'password123',
				});

				expect(response.status).toBe(HttpStatus.CREATED);
			});
		});

		describe('when the registration does not exist', () => {
			it('should return a 404 error', async () => {
				const response = await testApiClient.post('/by-secret/someNonExistingSecret/complete', {
					language: 'en',
					password: 'password123',
				});

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});
	});
});
