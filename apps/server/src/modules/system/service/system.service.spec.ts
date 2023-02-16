import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundError } from '@shared/common';
import { OauthConfig, System, SystemTypeEnum } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { KeycloakSystemService } from '@shared/infra/identity-management/keycloak/service/keycloak-system.service';
import { SystemRepo } from '@shared/repo';
import { systemFactory } from '@shared/testing';
import { SystemMapper } from '../mapper/system.mapper';
import { SystemService } from './system.service';

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemService;
	let systemRepo: DeepMocked<SystemRepo>;
	let keycloakSystemService: DeepMocked<KeycloakSystemService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
				{
					provide: KeycloakSystemService,
					useValue: createMock<KeycloakSystemService>(),
				},
			],
		}).compile();
		systemRepo = module.get(SystemRepo);
		systemService = module.get(SystemService);
		keycloakSystemService = module.get(KeycloakSystemService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findById', () => {
		describe('when identity management is available', () => {
			const standaloneSystem = systemFactory.buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
			const keycloakSystem = systemFactory.withOauthConfig().buildWithId({
				type: SystemTypeEnum.KEYCLOAK,
				alias: 'Keycloak',
				provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
			});
			const setup = (system: System) => {
				systemRepo.findById.mockResolvedValue(system);
				keycloakSystemService.isAvailable.mockResolvedValue(true);
				keycloakSystemService.getConfig.mockResolvedValue(keycloakSystem.oauthConfig as OauthConfig);
			};

			it('should return found system', async () => {
				setup(standaloneSystem);
				const result = await systemService.findById(standaloneSystem.id);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(standaloneSystem));
			});

			it('should return found system with generated oauth config for oidc systems', async () => {
				setup(oidcSystem);
				const result = await systemService.findById(oidcSystem.id);
				expect(result).toStrictEqual(
					SystemMapper.mapFromEntityToDto({
						...oidcSystem,
						oauthConfig: keycloakSystem.oauthConfig,
					})
				);
			});
		});

		describe('when identity management is not available', () => {
			const standaloneSystem = systemFactory.buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
			const setup = (system: System) => {
				systemRepo.findById.mockResolvedValue(system);
				keycloakSystemService.isAvailable.mockResolvedValue(false);
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
			const ldapSystem = systemFactory.withLdapConfig().buildWithId();
			const oauthSystem = systemFactory.withOauthConfig().buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
			const keycloakSystem = systemFactory.withOauthConfig().buildWithId({
				type: SystemTypeEnum.KEYCLOAK,
				alias: 'Keycloak',
				provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
			});
			const setup = () => {
				systemRepo.findAll.mockResolvedValue([ldapSystem, oauthSystem, oidcSystem]);
				systemRepo.findByFilter.mockImplementation((type: SystemTypeEnum) => {
					if (type === SystemTypeEnum.LDAP) return Promise.resolve([ldapSystem]);
					if (type === SystemTypeEnum.OAUTH) return Promise.resolve([oauthSystem]);
					if (type === SystemTypeEnum.OIDC) return Promise.resolve([oidcSystem]);
					return Promise.resolve([]);
				});
				keycloakSystemService.isAvailable.mockResolvedValue(true);
				keycloakSystemService.getConfig.mockResolvedValue(keycloakSystem.oauthConfig as OauthConfig);
			};

			it('should return all systems', async () => {
				setup();
				const result = await systemService.findByType();
				expect(result).toEqual(
					expect.arrayContaining(SystemMapper.mapFromEntitiesToDtos([ldapSystem, oauthSystem, oidcSystem]))
				);
			});

			it('should return found systems', async () => {
				setup();
				const result = await systemService.findByType(SystemTypeEnum.LDAP);
				expect(result).toStrictEqual(SystemMapper.mapFromEntitiesToDtos([ldapSystem]));
			});

			it('should return found systems with generated oauth config for oidc systems', async () => {
				setup();
				const result = await systemService.findByType(SystemTypeEnum.OAUTH);
				expect(result).toStrictEqual(
					SystemMapper.mapFromEntitiesToDtos([
						oauthSystem,
						{
							...oidcSystem,
							oauthConfig: keycloakSystem.oauthConfig,
						},
					])
				);
			});
		});

		describe('when identity management is not available', () => {
			const oauthSystem = systemFactory.withOauthConfig().buildWithId();
			const oidcSystem = systemFactory.withOidcConfig().buildWithId();
			const setup = () => {
				systemRepo.findByFilter.mockImplementation((type: SystemTypeEnum) => {
					if (type === SystemTypeEnum.OAUTH) return Promise.resolve([oauthSystem]);
					if (type === SystemTypeEnum.OIDC) return Promise.resolve([oidcSystem]);
					return Promise.resolve([]);
				});
				keycloakSystemService.isAvailable.mockResolvedValue(false);
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
				systemRepo.save.mockResolvedValue();
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
				systemRepo.findById.mockResolvedValue(existingSystem);
			};

			it('should update existing system', async () => {
				setup();
				const result = await systemService.save(existingSystem);
				expect(systemRepo.findById).toHaveBeenCalledTimes(1);
				expect(result).toStrictEqual(SystemMapper.mapFromEntityToDto(existingSystem));
			});
		});
	});
});
