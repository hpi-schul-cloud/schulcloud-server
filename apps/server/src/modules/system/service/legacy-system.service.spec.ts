import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { IdentityManagementOauthService } from '@infra/identity-management';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { OauthConfigEntity, SystemEntity } from '@shared/domain/entity';
import { SystemTypeEnum } from '@shared/domain/types';
import { LegacySystemRepo } from '@shared/repo';
import { systemEntityFactory } from '@shared/testing/factory';
import { SystemMapper } from '../mapper';
import { LegacySystemService } from './legacy-system.service';

describe(LegacySystemService.name, () => {
	let module: TestingModule;
	let systemService: LegacySystemService;
	let systemRepoMock: DeepMocked<LegacySystemRepo>;
	let kcIdmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LegacySystemService,
				{
					provide: LegacySystemRepo,
					useValue: createMock<LegacySystemRepo>(),
				},
				{
					provide: IdentityManagementOauthService,
					useValue: createMock<IdentityManagementOauthService>(),
				},
			],
		}).compile();
		systemRepoMock = module.get(LegacySystemRepo);
		systemService = module.get(LegacySystemService);
		kcIdmOauthServiceMock = module.get(IdentityManagementOauthService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		describe('when identity management is available', () => {
			const standaloneSystem = systemEntityFactory.buildWithId({ alias: 'standaloneSystem' });
			const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });
			const oauthSystem = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'oauthSystem' });
			const setup = (system: SystemEntity) => {
				systemRepoMock.findById.mockResolvedValue(system);
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(true);
				kcIdmOauthServiceMock.getOauthConfig.mockResolvedValue(oauthSystem.oauthConfig as OauthConfigEntity);
			};

			it('should return found system', async () => {
				setup(standaloneSystem);
				const result = await systemService.findById(standaloneSystem.id);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(standaloneSystem));
			});

			it('should return found system with generated oauth config for oidc systems', async () => {
				setup(oidcSystem);
				if (oauthSystem.oauthConfig === undefined) {
					fail('oauth system has no oauth configuration');
				}
				const result = await systemService.findById(oidcSystem.id);
				expect(result).toEqual(
					expect.objectContaining({
						id: oidcSystem.id,
						type: SystemTypeEnum.OAUTH,
						alias: oidcSystem.alias,
						displayName: oidcSystem.displayName,
						url: oidcSystem.url,
						provisioningStrategy: oidcSystem.provisioningStrategy,
						provisioningUrl: oidcSystem.provisioningUrl,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						oauthConfig: expect.objectContaining({
							clientId: oauthSystem.oauthConfig.clientId,
							clientSecret: oauthSystem.oauthConfig.clientSecret,
							idpHint: oidcSystem.oidcConfig?.idpHint,
							redirectUri: oauthSystem.oauthConfig.redirectUri + oidcSystem.id,
							grantType: oauthSystem.oauthConfig.grantType,
							tokenEndpoint: oauthSystem.oauthConfig.tokenEndpoint,
							authEndpoint: oauthSystem.oauthConfig.authEndpoint,
							responseType: oauthSystem.oauthConfig.responseType,
							scope: oauthSystem.oauthConfig.scope,
							provider: oauthSystem.oauthConfig.provider,
							logoutEndpoint: oauthSystem.oauthConfig.logoutEndpoint,
							issuer: oauthSystem.oauthConfig.issuer,
							jwksEndpoint: oauthSystem.oauthConfig.jwksEndpoint,
						}),
					})
				);
			});
		});

		describe('when identity management is not available', () => {
			const standaloneSystem = systemEntityFactory.buildWithId();
			const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId();
			const setup = (system: SystemEntity) => {
				systemRepoMock.findById.mockResolvedValue(system);
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(false);
			};

			it('should return found system', async () => {
				setup(standaloneSystem);
				const result = await systemService.findById(standaloneSystem.id);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(standaloneSystem));
			});

			it('should throw and not generate oauth config for oidc systems', async () => {
				setup(oidcSystem);
				await expect(systemService.findById(oidcSystem.id)).rejects.toThrow(EntityNotFoundError);
			});
		});
	});

	describe('findByType', () => {
		describe('when identity management is available', () => {
			const ldapSystem = systemEntityFactory.withLdapConfig().buildWithId({ alias: 'ldapSystem' });
			const oauthSystem = systemEntityFactory.withOauthConfig().buildWithId({ alias: 'oauthSystem' });
			const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });
			const setup = () => {
				systemRepoMock.findAll.mockResolvedValue([ldapSystem, oauthSystem, oidcSystem]);
				systemRepoMock.findByFilter.mockImplementation((type: SystemTypeEnum) => {
					if (type === SystemTypeEnum.LDAP) return Promise.resolve([ldapSystem]);
					if (type === SystemTypeEnum.OAUTH) return Promise.resolve([oauthSystem]);
					if (type === SystemTypeEnum.OIDC) return Promise.resolve([oidcSystem]);
					return Promise.resolve([]);
				});
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(true);
				kcIdmOauthServiceMock.getOauthConfig.mockResolvedValue(oauthSystem.oauthConfig as OauthConfigEntity);
			};

			it('should return all systems', async () => {
				setup();
				const result = await systemService.findByType();
				expect(result).toEqual(
					expect.arrayContaining([
						...SystemMapper.mapFromEntitiesToDtos([ldapSystem, oauthSystem]),
						expect.objectContaining({
							alias: oidcSystem.alias,
							displayName: oidcSystem.displayName,
						}),
					])
				);
			});

			it('should return found systems', async () => {
				setup();
				const result = await systemService.findByType(SystemTypeEnum.LDAP);
				expect(result).toStrictEqual(SystemMapper.mapFromEntitiesToDtos([ldapSystem]));
			});

			it('should return found systems with generated oauth config for oidc systems', async () => {
				setup();
				if (oauthSystem.oauthConfig === undefined) {
					fail('oauth system has no oauth configuration');
				}
				const resultingSystems = await systemService.findByType(SystemTypeEnum.OAUTH);

				expect(resultingSystems).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							type: SystemTypeEnum.OAUTH,
							alias: oidcSystem.alias,
							displayName: oidcSystem.displayName,
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							oauthConfig: expect.objectContaining({
								clientId: oauthSystem.oauthConfig.clientId,
								clientSecret: oauthSystem.oauthConfig.clientSecret,
								idpHint: oidcSystem.oidcConfig?.idpHint,
								redirectUri: oauthSystem.oauthConfig.redirectUri + oidcSystem.id,
								grantType: oauthSystem.oauthConfig.grantType,
								tokenEndpoint: oauthSystem.oauthConfig.tokenEndpoint,
								authEndpoint: oauthSystem.oauthConfig.authEndpoint,
								responseType: oauthSystem.oauthConfig.responseType,
								scope: oauthSystem.oauthConfig.scope,
								provider: oauthSystem.oauthConfig.provider,
								logoutEndpoint: oauthSystem.oauthConfig.logoutEndpoint,
								issuer: oauthSystem.oauthConfig.issuer,
								jwksEndpoint: oauthSystem.oauthConfig.jwksEndpoint,
							}),
						}),
					])
				);
			});
		});

		describe('when identity management is not available', () => {
			const oauthSystem = systemEntityFactory.withOauthConfig().buildWithId();
			const oidcSystem = systemEntityFactory.withOidcConfig().buildWithId();
			const setup = () => {
				systemRepoMock.findByFilter.mockImplementation((type: SystemTypeEnum) => {
					if (type === SystemTypeEnum.OAUTH) return Promise.resolve([oauthSystem]);
					if (type === SystemTypeEnum.OIDC) return Promise.resolve([oidcSystem]);
					return Promise.resolve([]);
				});
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(false);
			};
			it('should filter out oidc systems', async () => {
				setup();
				const result = await systemService.findByType(SystemTypeEnum.OAUTH);
				expect(result).toStrictEqual(SystemMapper.mapFromEntitiesToDtos([oauthSystem]));
			});
		});
	});

	describe('save', () => {
		describe('when creating a new system', () => {
			const newSystem = systemEntityFactory.build();
			const setup = () => {
				systemRepoMock.save.mockResolvedValue();
			};

			it('should save new system', async () => {
				setup();
				const result = await systemService.save(newSystem);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(newSystem));
			});
		});

		describe('when updating an existing system', () => {
			const existingSystem = systemEntityFactory.buildWithId();
			const setup = () => {
				systemRepoMock.findById.mockResolvedValue(existingSystem);
			};

			it('should update existing system', async () => {
				setup();
				const result = await systemService.save(existingSystem);
				expect(systemRepoMock.findById).toHaveBeenCalledTimes(1);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(existingSystem));
			});
		});
	});
});
