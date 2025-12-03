import { EntityManager } from '@mikro-orm/mongodb';
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

	describe('GET /registrations/by-secret/:registrationSecret', () => {
		const setup = async () => {
			const registration = registrationEntityFactory.build();

			await em.persistAndFlush([registration]);
			em.clear();

			const expectedResponse = {
				id: registration.id,
				email: registration.email,
				firstName: registration.firstName,
				lastName: registration.lastName,
				createdAt: registration.createdAt.toISOString(),
				updatedAt: registration.updatedAt.toISOString(),
			};

			return { registration, expectedResponse };
		};

		describe('when the feature is disabled', () => {
			it('should return a 403 error', async () => {
				config.FEATURE_EXTERNAL_PERSON_REGISTRATION_ENABLED = false;
				const { registration } = await setup();

				const response = await testApiClient.get(`/by-hash/${registration.registrationSecret}`);

				expect(response.status).toBe(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the registration exists', () => {
			it('should return a registration', async () => {
				const { registration, expectedResponse } = await setup();
				const response = await testApiClient.get(`/by-hash/${registration.registrationSecret}`);
				console.log(response.body);
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});

		describe('when the registration does not exist', () => {
			it('should return a 404 error', async () => {
				const response = await testApiClient.get('/by-hash/someNonExistingHash');

				expect(response.status).toBe(HttpStatus.NOT_FOUND);
			});
		});
	});
});
