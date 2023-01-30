import { Test, TestingModule } from '@nestjs/testing';
import { KeycloakModule } from '@shared/infra/identity-management/keycloak/keycloak.module';
import { LoggerModule } from '@src/core/logger';
import { MongoMemoryDatabaseModule } from '@shared/infra/database';
import { ConfigModule } from '@nestjs/config';
import { SystemRepo } from '@shared/repo';
import { SystemTypeEnum } from '@shared/domain';
import { cleanupCollections, systemFactory } from '@shared/testing';
import { MongoEntityManager } from '@mikro-orm/mongodb';
import { DefaultEncryptionService, IEncryptionService } from '@shared/infra/encryption';
import { KeycloakSystemService } from './keycloak-system.service';

describe('KeycloakSystemService (Integration)', () => {
	let module: TestingModule;
	let kcSystemService: KeycloakSystemService;
	let encryptionService: IEncryptionService;
	let em: MongoEntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [
				KeycloakModule,
				LoggerModule,
				ConfigModule.forRoot({
					isGlobal: true,
					load: [
						() => {
							return {
								AES_KEY: 'my_super_secret_key',
							};
						},
					],
				}),
				MongoMemoryDatabaseModule.forRoot({ allowGlobalContext: true }),
			],
			providers: [SystemRepo],
		}).compile();
		em = module.get(MongoEntityManager);
		kcSystemService = module.get(KeycloakSystemService);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		kcSystemService.resetCache();
		await cleanupCollections(em);
	});

	describe('getClientId', () => {
		describe('when no keycloak system exists', () => {
			it('should throw an error', async () => {
				await expect(kcSystemService.getClientId()).rejects.toThrow('No Keycloak system found');
			});
		});

		describe('when client id is not set', () => {
			const setup = async () => {
				await em.persistAndFlush(systemFactory.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK }));
			};

			it('should throw an error', async () => {
				await setup();
				await expect(kcSystemService.getClientId()).rejects.toThrow('No client id set');
			});
		});

		describe('when client id is set', () => {
			const setup = async () => {
				const system = systemFactory
					.withOauthConfig()
					.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK });
				await em.persistAndFlush(system);
				return system.oauthConfig?.clientId;
			};

			it('should return client id', async () => {
				const clientId = await setup();
				expect(clientId).toBeDefined();
				await expect(kcSystemService.getClientId()).resolves.toBe(clientId);
			});
		});
	});

	describe('getClientSecret', () => {
		describe('when no keycloak system exists', () => {
			it('should throw an error', async () => {
				await expect(kcSystemService.getClientSecret()).rejects.toThrow('No Keycloak system found');
			});
		});

		describe('when client secret is not set', () => {
			const setup = async () => {
				await em.persistAndFlush(systemFactory.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK }));
			};

			it('should throw an error', async () => {
				await setup();
				await expect(kcSystemService.getClientSecret()).rejects.toThrow('No client secret set');
			});
		});

		describe('when client secret is set', () => {
			const setup = async () => {
				const system = systemFactory
					.withOauthConfig()
					.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK });
				const clientSecret = system.oauthConfig?.clientSecret;
				if (!system.oauthConfig) throw new Error();
				system.oauthConfig.clientSecret = encryptionService.encrypt(system.oauthConfig.clientSecret);
				await em.persistAndFlush(system);
				return clientSecret;
			};

			it('should return decrypted client secret', async () => {
				const clientSecret = await setup();
				expect(clientSecret).toBeDefined();
				await expect(kcSystemService.getClientSecret()).resolves.toBe(clientSecret);
			});
		});
	});

	describe('getTokenEndpoint', () => {
		describe('when no keycloak system exists', () => {
			it('should throw an error', async () => {
				await expect(kcSystemService.getClientSecret()).rejects.toThrow('No Keycloak system found');
			});
		});

		describe('when token endpoint is not set', () => {
			const setup = async () => {
				await em.persistAndFlush(systemFactory.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK }));
			};

			it('should throw an error', async () => {
				await setup();
				await expect(kcSystemService.getTokenEndpoint()).rejects.toThrow('No token endpoint set');
			});
		});

		describe('when token endpoint is set', () => {
			const setup = async () => {
				const system = systemFactory
					.withOauthConfig()
					.buildWithId({ alias: 'Keycloak', type: SystemTypeEnum.KEYCLOAK });
				await em.persistAndFlush(system);
				return system.oauthConfig?.tokenEndpoint;
			};

			it('should return token endpoint', async () => {
				const tokenEndpoint = await setup();
				expect(tokenEndpoint).toBeDefined();
				await expect(kcSystemService.getTokenEndpoint()).resolves.toBe(tokenEndpoint);
			});
		});
	});
});
