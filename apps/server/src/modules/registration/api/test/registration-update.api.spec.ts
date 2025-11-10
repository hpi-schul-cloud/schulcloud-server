import { EntityManager } from '@mikro-orm/mongodb';
import { serverConfig, ServerConfig, ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { TestApiClient } from '@testing/test-api-client';
import { LanguageType } from '@shared/domain/interface';
import { roomEntityFactory } from '@modules/room/testing';
import { registrationEntityFactory } from '@modules/registration/testing';
import { UpdateRegistrationBodyParams } from '../dto/request/update-registration.body.params';
import { Consent } from '@modules/registration/domain/type';

describe('Registration Controller (API)', () => {
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
		config.FEATURE_REGISTRATION_ENABLED = true;
	});

	afterAll(async () => {
		await app.close();
	});

	describe('PATCH /registrations/:registrationId', () => {
		const setup = async () => {
			const room = roomEntityFactory.buildWithId();
			const registration = registrationEntityFactory.build({
				language: LanguageType.DE,
				roomIds: [room.id],
				consent: [],
			});
			await em.persistAndFlush([registration, room]);
			em.clear();

			const updateParams: UpdateRegistrationBodyParams = {
				consent: [Consent.TERMS_OF_USE, Consent.PRIVACY],
				password: 'newPassword123',
				pin: '5678new',
				language: LanguageType.EN,
				roomIds: [],
			};

			return { registration, room, updateParams };
		};

		describe('when the required parameters are given', () => {
			describe('when the feature is disabled', () => {
				it('should return a 403 error', async () => {
					config.FEATURE_REGISTRATION_ENABLED = false;
					const { registration, updateParams } = await setup();

					const response = await testApiClient.patch(registration.id, updateParams);

					expect(response.status).toBe(HttpStatus.FORBIDDEN);
				});
			});

			it('should update the registration', async () => {
				const { registration, updateParams } = await setup();

				const response = await testApiClient.patch(registration.id, updateParams);
				expect(response.status).toBe(HttpStatus.OK);
				expect(response.body).toEqual({
					id: registration.id,
					registrationHash: registration.registrationHash,
					email: registration.email,
					firstName: registration.firstName,
					lastName: registration.lastName,
					createdAt: registration.createdAt.toISOString(),
					updatedAt: expect.any(String),
					...updateParams,
				});
				expect(response.body.updatedAt).not.toBe(registration.updatedAt.toISOString());
			});
		});
	});
});
