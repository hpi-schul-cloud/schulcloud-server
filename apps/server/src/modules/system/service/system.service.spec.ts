import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, System } from '@shared/domain';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { SysType } from '@shared/infra/identity-management';
import { SystemRepo } from '@shared/repo';
import { setupEntities, systemFactory } from '@shared/testing';
import { SystemDto } from './dto/system.dto';
import { SystemService } from './system.service';

describe('SystemService', () => {
	let module: TestingModule;
	let systemService: SystemService;
	let orm: MikroORM;
	const oidcSystems: System[] = [];
	const allSystems: System[] = [];

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
	const oidc1 = systemFactory.buildWithId({
		type: SysType.OIDC,
		alias: 'Third Party System 1',
	});
	const oidc2 = systemFactory.buildWithId({
		type: SysType.OIDC,
		alias: 'Third Party System 2',
	});

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

		oidcSystems.push(oidc1);
		oidcSystems.push(oidc2);

		allSystems.push(iserv);
		allSystems.push(keycloak);
		allSystems.push(...oidcSystems);
	});

	beforeEach(() => {
		systemRepo.findAll.mockResolvedValue(allSystems);
		systemRepo.findById.mockImplementation((id: EntityId): Promise<System> => {
			return id === iserv.id ? Promise.resolve(iserv) : Promise.reject();
		});
		systemRepo.findByFilter.mockImplementation(
			(theType: string | SysType = '', onlyOauth = false): Promise<System[]> => {
				if (theType === SysType.KEYCLOAK) {
					return Promise.resolve([keycloak]);
				}
				if (onlyOauth) {
					return Promise.resolve([iserv, keycloak]);
				}
				if (theType === SysType.OIDC) {
					return Promise.resolve(oidcSystems);
				}
				return Promise.resolve(allSystems);
			}
		);
	});

	describe('findByFilter', () => {
		it('should return all systems by default', async () => {
			// When
			const resultSystems = await systemService.find(undefined);

			// Then
			allSystems.forEach((system) => {
				expect(resultSystems).toContainEqual(
					expect.objectContaining<SystemDto>({ type: system.type, alias: system.alias })
				);
			});
		});
		it('should limit the results for the specified type (by repo call)', async () => {
			// When
			const resultSystems = await systemService.find(SysType.OIDC);

			// Then
			expect(resultSystems).toContainEqual(
				expect.objectContaining<SystemDto>({ type: oidc1.type, alias: oidc1.alias })
			);
			expect(resultSystems).toContainEqual(
				expect.objectContaining<SystemDto>({ type: oidc2.type, alias: oidc2.alias })
			);
			expect(resultSystems).toHaveLength(oidcSystems.length);
		});

		it('should add generated oauth systems to result if oauth only requested  but exclude keycloak', async () => {
			// When
			const resultSystems = await systemService.find(undefined, true);

			// Then
			expect(resultSystems).toContainEqual(
				expect.objectContaining<SystemDto>({ type: iserv.type, alias: iserv.alias })
			);

			oidcSystems.forEach((system) => {
				expect(resultSystems).toContainEqual(
					expect.objectContaining<SystemDto>({
						type: SysType.OAUTH,
						alias: system.alias,
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
						oauthConfig: expect.objectContaining({
							clientId: keycloak.oauthConfig?.clientId,
							clientSecret: keycloak.oauthConfig?.clientSecret,
							redirectUri: keycloak.oauthConfig?.redirectUri,
							grantType: keycloak.oauthConfig?.grantType,
							tokenEndpoint: keycloak.oauthConfig?.tokenEndpoint,
							authEndpoint: keycloak.oauthConfig?.authEndpoint,
							responseType: keycloak.oauthConfig?.responseType,
							scope: keycloak.oauthConfig?.scope,
							provider: keycloak.oauthConfig?.provider,
							logoutEndpoint: keycloak.oauthConfig?.logoutEndpoint,
							issuer: keycloak.oauthConfig?.issuer,
							jwksEndpoint: keycloak.oauthConfig?.jwksEndpoint,
						}),
					})
				);
			});

			expect(resultSystems).toHaveLength(1 + oidcSystems.length);
		});

		it('should ignore generated oauth systems if no keycloak exists', async () => {
			// Given
			systemRepo.findByFilter.mockImplementation(
				(theType: string | SysType = '', onlyOauth = false): Promise<System[]> => {
					if (theType === SysType.KEYCLOAK) {
						return Promise.resolve([]);
					}
					if (onlyOauth) {
						return Promise.resolve([iserv]);
					}
					if (theType === SysType.OIDC) {
						return Promise.resolve(oidcSystems);
					}
					return Promise.resolve(allSystems);
				}
			);

			// When
			const resultSystems = await systemService.find(undefined, true);

			// Then
			expect(resultSystems).toContainEqual(
				expect.objectContaining<SystemDto>({ type: iserv.type, alias: iserv.alias })
			);

			expect(resultSystems).toHaveLength(1);
		});
	});

	describe('findById', () => {
		it('should return oauth system iserv', async () => {
			// Act
			const resultSystems = await systemService.findById(iserv.id);

			// Assert
			expect(resultSystems.alias).toEqual(iserv.alias);
		});

		it('should reject promise, because no entity was found', async () => {
			await expect(systemService.findById('unknown id')).rejects.toEqual(undefined);
		});
	});
});
