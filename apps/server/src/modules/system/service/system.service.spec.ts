import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, System } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SysType } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { setupEntities, systemFactory } from '@shared/testing';
import { SystemService } from './system.service';

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemService;
	let orm: MikroORM;
	let iservSystem: System[] = [];
	let oidcSystem: System[] = [];
	let keycloakSystem: System[] = [];
	const allSystems: System[] = [];

	let systemRepo: DeepMocked<SystemRepo>;

	afterAll(async () => {
		await module.close();
		await orm.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				SystemService,
				{
					provide: SystemRepo,
					useValue: createMock<SystemRepo>(),
				},
			],
		}).compile();
		orm = await setupEntities();
		systemRepo = module.get(SystemRepo);
		systemService = module.get(SystemService);
	});

	beforeEach(() => {
		iservSystem = [];
		oidcSystem = [];
		keycloakSystem = [];
		const iserv = systemFactory.buildWithId();
		const keycloak = systemFactory.buildWithId({
			type: SysType.KEYCLOAK,
			alias: 'Keycloak',
			provisioningStrategy: SystemProvisioningStrategy.PLACEHOLDER,
			url: 'http://mock.de',
			oauthConfig: {
				clientId: 'keycloak',
				clientSecret: undefined,
				grantType: 'authorization_code',
				scope: 'openid profile email',
				responseType: 'code',
				provider: 'oauth',
				tokenEndpoint: undefined,
				redirectUri: undefined,
				authEndpoint: undefined,
				logoutEndpoint: undefined,
				jwksEndpoint: undefined,
				issuer: undefined,
			},
		});
		const oidc = systemFactory.buildWithId({
			type: SysType.OIDC,
			alias: 'Third Party System',
		});
		iservSystem.push(iserv);
		keycloakSystem.push(keycloak);
		oidcSystem.push(oidc);
		allSystems.push(iserv);
		allSystems.push(systemFactory.buildWithId({ oauthConfig: undefined }));
		allSystems.push(systemFactory.buildWithId({ type: 'moodle' }));
		allSystems.push(keycloak);
		allSystems.push(oidc);
		systemRepo.findByFilter.mockResolvedValue(keycloakSystem);
		systemRepo.findAll.mockResolvedValue(allSystems);
		systemRepo.findById.mockImplementation((id: EntityId): Promise<System> => {
			return id === iserv.id ? Promise.resolve(iserv) : Promise.reject();
		});
	});

	describe('findByFilter', () => {
		it('should return oauth system iserv', async () => {
			// If
			systemRepo.findByFilter.mockResolvedValueOnce(iservSystem);

			// When
			const resultSystems = await systemService.find(iservSystem[0].type);

			// Then
			expect(resultSystems.length).toEqual(1);
			expect(resultSystems[0]).toEqual({
				type: 'iserv',
				url: 'http://mock.de',
				alias: 'system #1',
				provisioningStrategy: 'placeholder',
				oauthConfig: undefined,
			});
		});

		it('should return oauth system keycloak', async () => {
			// If
			systemRepo.findByFilter.mockResolvedValueOnce(keycloakSystem);

			// When
			const resultSystems = await systemService.find(keycloakSystem[0].type, true);

			// Then
			expect(resultSystems.length).toEqual(1);
			expect(resultSystems[0]).toEqual({
				type: SysType.KEYCLOAK,
				alias: 'Keycloak',
				provisioningStrategy: SystemProvisioningStrategy.PLACEHOLDER,
				url: 'http://mock.de',
				oauthConfig: {
					clientId: 'keycloak',
					clientSecret: undefined,
					grantType: 'authorization_code',
					scope: 'openid profile email',
					responseType: 'code',
					provider: 'oauth',
					tokenEndpoint: undefined,
					redirectUri: undefined,
					authEndpoint: undefined,
					logoutEndpoint: undefined,
					jwksEndpoint: undefined,
					issuer: undefined,
				},
			});
		});

		it('should return brokered systems', async () => {
			// If
			systemRepo.findByFilter.mockResolvedValueOnce(oidcSystem);
			systemRepo.findByFilter.mockResolvedValueOnce(keycloakSystem);

			// When
			const resultSystems = await systemService.find(SysType.OIDC, true);

			// Then
			expect(resultSystems.length).toEqual(1);
			expect(resultSystems[0]).toEqual({
				type: SysType.OIDC,
				alias: 'Third Party System',
				provisioningStrategy: SystemProvisioningStrategy.PLACEHOLDER,
				url: 'http://mock.de',
				oauthConfig: {
					clientId: 'keycloak',
					clientSecret: undefined,
					grantType: 'authorization_code',
					scope: 'openid profile email',
					responseType: 'code',
					provider: 'oauth',
					tokenEndpoint: undefined,
					redirectUri: undefined,
					authEndpoint: undefined,
					logoutEndpoint: undefined,
					jwksEndpoint: undefined,
					issuer: undefined,
				},
			});
		});
	});

	describe('findAll', () => {
		it('should return all systems', async () => {
			// When
			const resultSystems = await systemService.find('');

			// Then
			expect(resultSystems.length).toEqual(allSystems.length);
		});
	});

	describe('findById', () => {
		it('should return oauth system iserv', async () => {
			// Act
			const resultSystems = await systemService.findById(iservSystem[0].id);

			// Assert
			expect(resultSystems.alias).toEqual(iservSystem[0].alias);
		});

		it('should reject promise, because no entity was found', async () => {
			await expect(systemService.findById('unknown id')).rejects.toEqual(undefined);
		});
	});
});
