import { MongoMemoryDatabaseModule } from '@infra/database';
import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { NotImplementedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SystemTypeEnum } from '@shared/domain/types';
import { cleanupCollections, systemEntityFactory } from '@shared/testing';
import { System, SYSTEM_REPO, SystemProps, SystemRepo, SystemType } from '../../domain';
import { SystemEntity } from '../../entity';
import { systemLdapConfigFactory, systemOauthConfigFactory, systemOidcConfigFactory } from '../../testing';
import { SystemEntityMapper } from './mapper';
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

	describe('find', () => {
		describe('when no filter is provided', () => {
			const setup = async () => {
				const ldapSystem = systemEntityFactory.buildWithId({ type: SystemType.LDAP });
				const oauthSystem = systemEntityFactory.buildWithId({ type: SystemType.OAUTH });

				await em.persistAndFlush([ldapSystem, oauthSystem]);
				em.clear();

				return {
					ldapSystem,
					oauthSystem,
				};
			};

			it('should return all systems', async () => {
				const { ldapSystem, oauthSystem } = await setup();

				const result = await repo.find({});

				expect(result).toEqual([SystemEntityMapper.mapToDo(ldapSystem), SystemEntityMapper.mapToDo(oauthSystem)]);
			});
		});

		describe('when no system matches the filter', () => {
			const setup = async () => {
				const ldapSystem = systemEntityFactory.buildWithId({ type: SystemType.LDAP });

				await em.persistAndFlush([ldapSystem]);
				em.clear();
			};

			it('should return an empty array', async () => {
				await setup();

				const result = await repo.find({ types: [SystemType.OAUTH] });

				expect(result).toEqual([]);
			});
		});

		describe('when a system matches the filter', () => {
			const setup = async () => {
				const ldapSystem = systemEntityFactory.buildWithId({ type: SystemType.LDAP });
				const oauthSystem1 = systemEntityFactory.buildWithId({ type: SystemType.OAUTH });
				const oauthSystem2 = systemEntityFactory.buildWithId({ type: SystemType.OAUTH });

				await em.persistAndFlush([ldapSystem, oauthSystem1, oauthSystem2]);
				em.clear();

				return {
					oauthSystem1,
					oauthSystem2,
				};
			};

			it('should return the systems', async () => {
				const { oauthSystem1, oauthSystem2 } = await setup();

				const result = await repo.find({ types: [SystemType.OAUTH] });

				expect(result).toEqual([SystemEntityMapper.mapToDo(oauthSystem1), SystemEntityMapper.mapToDo(oauthSystem2)]);
			});
		});
	});

	describe('getSystemById', () => {
		describe('when the system exists', () => {
			const setup = async () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const ldapConfig = systemLdapConfigFactory.build();
				const oidcConfig = systemOidcConfigFactory.build();

				const system: SystemEntity = systemEntityFactory.buildWithId({
					type: 'oauth',
					url: 'https://mock.de',
					alias: 'alias',
					displayName: 'displayName',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
					provisioningUrl: 'https://provisioningurl.de',
					oauthConfig,
					ldapConfig,
					oidcConfig,
				});

				await em.persistAndFlush([system]);
				em.clear();

				return {
					system,
					oauthConfig,
					ldapConfig,
					oidcConfig,
				};
			};

			it('should return the system', async () => {
				const { system, oauthConfig, ldapConfig, oidcConfig } = await setup();

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
					oidcConfig: {
						clientId: oidcConfig.clientId,
						clientSecret: oidcConfig.clientSecret,
						idpHint: oidcConfig.idpHint,
						authorizationUrl: oidcConfig.authorizationUrl,
						tokenUrl: oidcConfig.tokenUrl,
						logoutUrl: oidcConfig.logoutUrl,
						userinfoUrl: oidcConfig.userinfoUrl,
						defaultScopes: oidcConfig.defaultScopes,
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
		describe('when the valid system is passed', () => {
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

				// @ts-expect-error Testcase
				// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
				await expect(repo.save(system)).rejects.toThrowError(NotImplementedException);
			});
		});
	});

	describe('findByOauth2Issuer', () => {
		describe('when the system exists', () => {
			const setup = async () => {
				const issuer = 'external-system-issuer';
				const systemEntity: SystemEntity = systemEntityFactory.withOauthConfig({ issuer }).buildWithId();

				await em.persistAndFlush([systemEntity]);
				em.clear();

				return {
					systemEntity,
					issuer,
				};
			};

			it('should return the system', async () => {
				const { systemEntity, issuer } = await setup();

				const result = await repo.findByOauth2Issuer(issuer);

				expect(result).toEqual(SystemEntityMapper.mapToDo(systemEntity));
			});
		});

		describe('when the system does not exist', () => {
			it('should return null', async () => {
				const result = await repo.findByOauth2Issuer('unknown-issuer');

				expect(result).toBeNull();
			});
		});
	});
});
