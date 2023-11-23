import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { cleanupCollections, systemEntityFactory } from '@shared/testing';
import { SystemProps } from '../domain';
import { SystemRepo } from './system.repo';

describe(SystemRepo.name, () => {
	let module: TestingModule;
	let repo: SystemRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [SystemRepo],
		}).compile();

		repo = module.get(SystemRepo);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('findById', () => {
		describe('when the system exists', () => {
			const setup = async () => {
				const oauthConfig = new OauthConfigEntity({
					clientId: '12345',
					clientSecret: 'mocksecret',
					idpHint: 'mock-oauth-idpHint',
					tokenEndpoint: 'http://mock.de/mock/auth/public/mockToken',
					grantType: 'authorization_code',
					redirectUri: 'http://mockhost:3030/api/v3/sso/oauth/',
					scope: 'openid uuid',
					responseType: 'code',
					authEndpoint: 'http://mock.de/auth',
					provider: 'mock_type',
					logoutEndpoint: 'http://mock.de/logout',
					issuer: 'mock_issuer',
					jwksEndpoint: 'http://mock.de/jwks',
				});
				const ldapConfig = new LdapConfigEntity({
					url: 'ldaps:mock.de:389',
					active: true,
					provider: 'mock_provider',
				});
				const system: SystemEntity = systemEntityFactory.buildWithId({
					type: 'oauth',
					url: 'https://mock.de',
					alias: 'alias',
					displayName: 'displayName',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
					provisioningUrl: 'https://provisioningurl.de',
					oauthConfig,
					ldapConfig,
				});

				await em.persistAndFlush([system]);
				em.clear();

				return {
					system,
					oauthConfig,
					ldapConfig,
				};
			};

			it('should return the system', async () => {
				const { system, oauthConfig, ldapConfig } = await setup();

				const result = await repo.findById(system.id);

				expect(result?.getProps()).toEqual<SystemProps>({
					id: system.id,
					type: system.type,
					url: system.url,
					displayName: system.displayName,
					alias: system.alias,
					provisioningStrategy: system.provisioningStrategy,
					provisioningUrl: system.provisioningUrl,
					oauthConfig: {
						issuer: oauthConfig.issuer,
						provider: oauthConfig.provider,
						jwksEndpoint: oauthConfig.jwksEndpoint,
						redirectUri: oauthConfig.redirectUri,
						idpHint: oauthConfig.idpHint,
						authEndpoint: oauthConfig.authEndpoint,
						clientSecret: oauthConfig.clientSecret,
						grantType: oauthConfig.grantType,
						logoutEndpoint: oauthConfig.logoutEndpoint,
						responseType: oauthConfig.responseType,
						tokenEndpoint: oauthConfig.tokenEndpoint,
						clientId: oauthConfig.clientId,
						scope: oauthConfig.scope,
					},
					ldapConfig: {
						url: ldapConfig.url,
						provider: ldapConfig.provider,
						active: !!ldapConfig.active,
					},
				});
			});
		});

		describe('when the system does not exist', () => {
			it('should return null', async () => {
				const result = await repo.findById(new ObjectId().toHexString());

				expect(result).toBeNull();
			});
		});
	});
});
