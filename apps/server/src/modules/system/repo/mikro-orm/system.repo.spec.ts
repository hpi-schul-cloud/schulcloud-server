import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { LdapConfigEntity, OauthConfigEntity, SystemEntity } from '@shared/domain/entity';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemTypeEnum } from '@shared/domain/types';
import { cleanupCollections, systemEntityFactory } from '@shared/testing';
import { SYSTEM_REPO, System, SystemProps, SystemRepo } from '../../domain';
import { SystemEntityMapper } from './mapper/system-entity.mapper';
import { SystemMikroOrmRepo } from './system.repo';

describe(SystemMikroOrmRepo.name, () => {
	let module: TestingModule;
	let repo: SystemRepo;
	let em: EntityManager;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [{ provide: SYSTEM_REPO, useClass: SystemMikroOrmRepo }],
		}).compile();

		repo = module.get(SYSTEM_REPO);
		em = module.get(EntityManager);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(async () => {
		await cleanupCollections(em);
	});

	describe('getSystemById', () => {
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

				const result = await repo.getSystemById(system.id);

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
				const result = await repo.getSystemById(new ObjectId().toHexString());

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

				const activeLdapSystemDo = SystemEntityMapper.mapToDo(activeLdapSystem);

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

	describe('getSystemsByIds', () => {
		describe('when no system exists', () => {
			it('should return empty array', async () => {
				const result = await repo.getSystemsByIds([new ObjectId().toHexString()]);

				expect(result).toEqual([]);
			});
		});

		describe('when different systems exist', () => {
			const setup = async () => {
				const system1: SystemEntity = systemEntityFactory.buildWithId();
				const system2: SystemEntity = systemEntityFactory.buildWithId();
				const system3: SystemEntity = systemEntityFactory.buildWithId();

				await em.persistAndFlush([system1, system2, system3]);
				em.clear();

				const system1Props = SystemEntityMapper.mapToDo(system1);
				const system2Props = SystemEntityMapper.mapToDo(system2);
				const system3Props = SystemEntityMapper.mapToDo(system3);

				const expectedSystems = [system1Props, system2Props, system3Props];
				const systemIds = expectedSystems.map((s) => s.id);

				return { expectedSystems, systemIds };
			};

			it('should return the systems', async () => {
				const { expectedSystems, systemIds } = await setup();

				const result = await repo.getSystemsByIds(systemIds);

				expect(result).toEqual(expectedSystems);
			});
		});

		describe('when throwing an error', () => {
			const setup = () => {
				const systemIds = [new ObjectId().toHexString()];
				const error = new Error('Connection error');
				const spy = jest.spyOn(em, 'find');
				spy.mockRejectedValueOnce(error);

				return {
					systemIds,
					error,
				};
			};

			it('should throw an error', async () => {
				const { systemIds, error } = setup();

				await expect(repo.getSystemsByIds(systemIds)).rejects.toThrow(error);
			});
		});
	});

	describe('delete', () => {
		describe('when the system exists', () => {
			const setup = async () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();

				await em.persistAndFlush([systemEntity]);
				em.clear();

				const props: SystemProps = SystemEntityMapper.mapToDo(systemEntity);
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
		});

		describe('when the system does not exists', () => {
			const setup = () => {
				const systemEntity: SystemEntity = systemEntityFactory.buildWithId();
				const props: SystemProps = SystemEntityMapper.mapToDo(systemEntity);
				const system: System = new System(props);

				return {
					system,
				};
			};

			it('should return void', async () => {
				const { system } = setup();

				const result = await repo.delete(system);

				expect(result).toBeUndefined();
			});
		});
	});

	describe('save', () => {
		describe('when the system is new', () => {
			const setup = () => {
				const system = new System({
					id: new ObjectId().toHexString(),
					type: SystemTypeEnum.OAUTH,
					url: 'https://mock.de',
					alias: 'alias',
					displayName: 'displayName',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
					provisioningUrl: 'https://provisioningurl.de',
				});

				return {
					system,
				};
			};

			it('should throw error because mapDOToEntityProperties is not implement', async () => {
				const { system } = setup();

				await expect(repo.save(system)).rejects.toThrowError('Method `mapDOToEntityProperties` not implemented.');
			});
		});
	});
});
