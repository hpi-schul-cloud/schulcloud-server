import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { OauthConfig, System, SystemTypeEnum } from '@shared/domain';
import { IdentityManagementOauthService } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { systemFactory } from '@shared/testing';
import { SystemMapper } from '../mapper/system.mapper';
import { SystemService } from './system.service';

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemService;
	let systemRepoMock: DeepMocked<SystemRepo>;
	let kcIdmOauthServiceMock: DeepMocked<IdentityManagementOauthService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				{
					provide: IdentityManagementOauthService,
					useValue: createMock<IdentityManagementOauthService>(),
				},
			],
		}).compile();
		systemRepoMock = module.get(SystemRepo);
		systemService = module.get(SystemService);
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
			const standaloneSystem = systemFactory.buildWithId({ alias: 'standaloneSystem' });
			const oidcSystem = systemFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });
			const oauthSystem = systemFactory.withOauthConfig().buildWithId({ alias: 'oauthSystem' });
			const setup = (system: System) => {
				systemRepoMock.findById.mockResolvedValue(system);
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(true);
				kcIdmOauthServiceMock.getOauthConfig.mockResolvedValue(oauthSystem.oauthConfig as OauthConfig);
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
			const standaloneSystem = systemFactory.buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
			const setup = (system: System) => {
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
			const ldapSystem = systemFactory.withLdapConfig().buildWithId({ alias: 'ldapSystem' });
			const oauthSystem = systemFactory.withOauthConfig().buildWithId({ alias: 'oauthSystem' });
			const oidcSystem = systemFactory.withOidcConfig().buildWithId({ alias: 'oidcSystem' });
			const setup = () => {
				systemRepoMock.findAll.mockResolvedValue([ldapSystem, oauthSystem, oidcSystem]);
				systemRepoMock.findByFilter.mockImplementation((type: SystemTypeEnum) => {
					if (type === SystemTypeEnum.LDAP) return Promise.resolve([ldapSystem]);
					if (type === SystemTypeEnum.OAUTH) return Promise.resolve([oauthSystem]);
					if (type === SystemTypeEnum.OIDC) return Promise.resolve([oidcSystem]);
					return Promise.resolve([]);
				});
				kcIdmOauthServiceMock.isOauthConfigAvailable.mockResolvedValue(true);
				kcIdmOauthServiceMock.getOauthConfig.mockResolvedValue(oauthSystem.oauthConfig as OauthConfig);
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
			const oauthSystem = systemFactory.withOauthConfig().buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
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
			const newSystem = systemFactory.build();
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
			const existingSystem = systemFactory.buildWithId();
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
