import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OauthConfigEntity, SchoolEntity, SystemEntity } from '@shared/domain/entity';
import { schoolEntityFactory, systemEntityFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { Response } from 'supertest';
import { PublicSystemListResponse, PublicSystemResponse } from '../dto';

const baseRouteName = '/systems';

describe('System (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = module.createNestApplication();
		await app.init();
		em = module.get(EntityManager);
		testApiClient = new TestApiClient(app, baseRouteName);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('[GET] systems/public', () => {
		describe('when the endpoint is called', () => {
			const setup = async () => {
				const system1: SystemEntity = systemEntityFactory.buildWithId();
				const system2: SystemEntity = systemEntityFactory.withOauthConfig().buildWithId();
				const system2OauthConfig: OauthConfigEntity = system2.oauthConfig as OauthConfigEntity;

				await em.persistAndFlush([system1, system2]);
				em.clear();

				return { system1, system2, system2OauthConfig };
			};

			it('should return a list of all systems', async () => {
				const { system1, system2, system2OauthConfig } = await setup();

				const response: Response = await testApiClient.get(`/public`).expect(200);

				expect(response.body).toEqual<PublicSystemListResponse>({
					data: [
						{
							id: system1.id,
							type: system1.type,
							alias: system1.alias,
							displayName: system1.displayName,
						},
						{
							id: system2.id,
							type: system2.type,
							alias: system2.alias,
							displayName: system2.displayName,
							oauthConfig: {
								clientId: system2OauthConfig.clientId,
								idpHint: system2OauthConfig.idpHint,
								issuer: system2OauthConfig.issuer,
								authEndpoint: system2OauthConfig.authEndpoint,
								grantType: system2OauthConfig.grantType,
								jwksEndpoint: system2OauthConfig.jwksEndpoint,
								provider: system2OauthConfig.provider,
								logoutEndpoint: system2OauthConfig.logoutEndpoint,
								responseType: system2OauthConfig.responseType,
								tokenEndpoint: system2OauthConfig.tokenEndpoint,
								redirectUri: system2OauthConfig.redirectUri,
								scope: system2OauthConfig.scope,
							},
						},
					],
				});
			});
		});
	});

	describe('[GET] systems/public/:systemId', () => {
		describe('when the endpoint is called with a known systemId', () => {
			const setup = async () => {
				const system1: SystemEntity = systemEntityFactory.buildWithId();
				const system2: SystemEntity = systemEntityFactory.buildWithId();

				await em.persistAndFlush([system1, system2]);
				em.clear();

				return { system1, system2 };
			};

			it('should return the system', async () => {
				const { system1 } = await setup();

				const response: Response = await testApiClient.get(`/public/${system1.id}`).expect(200);

				expect(response.body).toEqual<PublicSystemResponse>({
					id: system1.id,
					type: system1.type,
					alias: system1.alias,
					displayName: system1.displayName,
				});
			});
		});
	});

	describe('[DELETE] systems/:systemId', () => {
		describe('when the endpoint is called with a known systemId', () => {
			const setup = async () => {
				const system: SystemEntity = systemEntityFactory.withLdapConfig({ provider: 'general' }).buildWithId();
				const school: SchoolEntity = schoolEntityFactory.build({ systems: [system] });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([system, adminAccount, adminUser, school]);
				em.clear();

				const adminClient = await testApiClient.login(adminAccount);

				return {
					system,
					adminClient,
				};
			};

			it('should delete the system', async () => {
				const { system, adminClient } = await setup();

				const response = await adminClient.delete(system.id);

				expect(response.status).toEqual(HttpStatus.NO_CONTENT);
				expect(await em.findOne(SystemEntity, { id: system.id })).toBeNull();
			});
		});

		describe('when not authenticated', () => {
			it('should return unauthorized', async () => {
				const response = await testApiClient.delete(new ObjectId().toHexString());

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});
	});
});
