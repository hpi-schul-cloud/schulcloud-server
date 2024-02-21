import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemTypeEnum } from '@shared/domain/types';
import { cleanupCollections, systemEntityFactory } from '@shared/testing';
import { System, SystemProps } from '../domain';
import { SystemDomainMapper } from './system-domain.mapper';
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

	describe('findAllForLdapLogin', () => {
		describe('when no system exists', () => {
			it('should return empty array', async () => {
				const result = await repo.findAllForLdapLogin();

				expect(result).toEqual([]);
			});
		});

		describe('when different systems exist', () => {
			const setup = async () => {
				const activeLdapSystem: SystemEntity = systemEntityFactory.buildWithId({
					type: SystemTypeEnum.LDAP,
					ldapConfig: { active: true },
				});
				const inActiveLdapSystem: SystemEntity = systemEntityFactory.buildWithId({
					type: SystemTypeEnum.LDAP,
					ldapConfig: { active: false },
				});
				const activeLdapSystemWithOauthConfig = systemEntityFactory.buildWithId({
					type: SystemTypeEnum.LDAP,
					ldapConfig: {
						active: true,
					},
					oauthConfig: {},
				});
				const otherSystem = systemEntityFactory.buildWithId({ type: SystemTypeEnum.OAUTH });

				await em.persistAndFlush([activeLdapSystem, inActiveLdapSystem, activeLdapSystemWithOauthConfig, otherSystem]);
				em.clear();

				const activeLdapSystemProps = SystemDomainMapper.mapEntityToDomainObjectProperties(activeLdapSystem);
				const activeLdapSystemDo = new System(activeLdapSystemProps);

				const expectedSystems = [activeLdapSystemDo];

				return { expectedSystems };
			};

			it('should return only the systems eligible for LDAP login', async () => {
				const { expectedSystems } = await setup();

				const result = await repo.findAllForLdapLogin();

				expect(result).toEqual(expectedSystems);
			});
		});
	});

	describe('delete', () => {
		describe('when the system exists', () => {
			const setup = async () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();

				await em.persistAndFlush([systemEntity]);
				em.clear();

				const props: SystemProps = SystemDomainMapper.mapEntityToDomainObjectProperties(systemEntity);
				const system: System = new System(props);

				return {
					system,
				};
			};

			it('should delete the system', async () => {
				const { system } = await setup();

				await repo.delete(system);

				expect(await em.findOne(SystemEntity, { id: system.id })).toBeNull();
			});

			it('should return true', async () => {
				const { system } = await setup();

				const result = await repo.delete(system);

				expect(result).toEqual(true);
			});
		});

		describe('when the system does not exists', () => {
			const setup = () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const props: SystemProps = SystemDomainMapper.mapEntityToDomainObjectProperties(systemEntity);
				const system: System = new System(props);

				return {
					system,
				};
			};

			it('should return false', async () => {
				const { system } = setup();

				const result = await repo.delete(system);

				expect(result).toEqual(false);
			});
		});
	});
});
