import { Test, TestingModule } from '@nestjs/testing';
import { System } from '@shared/domain';
import { systemFactory } from '@shared/testing';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';

describe('SystemMapper', () => {
	let module: TestingModule;
	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemMapper],
		}).compile();
	});

	describe('mapFromEntityToDto', () => {
		it('should map all fields', () => {
			const systemEntity = systemFactory.withOauthConfig().build();
			systemEntity.config = {
				clientId: 'mockId',
				clientSecret: 'mockSecret',
				authorizationUrl: 'mockAuthorizationUrl',
				tokenUrl: 'mockTokenUrl',
				logoutUrl: 'mockLogoutUrl',
				userinfoUrl: 'userInfoUrl',
				defaultScopes: 'mockDefaultScopes',
			};

			const result = SystemMapper.mapFromEntityToDto(systemEntity);

			expect(result.url).toEqual(systemEntity.url);
			expect(result.alias).toEqual(systemEntity.alias);
			expect(result.displayName).toEqual(systemEntity.displayName);
			expect(result.type).toEqual(systemEntity.type);
			expect(result.provisioningStrategy).toEqual(systemEntity.provisioningStrategy);
			expect(result.provisioningUrl).toEqual(systemEntity.provisioningUrl);
			expect(result.oauthConfig).toEqual(systemEntity.oauthConfig);
			expect(result.oidcConfig).toEqual(systemEntity.config);
		});
		it('should map take alias as default instead of displayName', () => {
			// Arrange
			const systemEntity = systemFactory.withOauthConfig().build();
			systemEntity.displayName = undefined;

			// Act
			const result = SystemMapper.mapFromEntityToDto(systemEntity);

			// Assert
			expect(result.alias).toEqual(systemEntity.alias);
			expect(result.displayName).toEqual(systemEntity.alias);
		});
	});

	describe('mapFromEntitiesToDtos', () => {
		it('should map all given entities', () => {
			const systemEntities: System[] = [
				systemFactory.withOauthConfig().build(),
				systemFactory.build({ oauthConfig: undefined }),
			];

			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			expect(result.length).toBe(systemEntities.length);
		});

		it('should map oauthconfig if exists', () => {
			const systemEntities: System[] = [
				systemFactory.withOauthConfig().build(),
				systemFactory.build({ oauthConfig: undefined }),
			];

			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			expect(result[0].oauthConfig?.clientId).toEqual(systemEntities[0].oauthConfig?.clientId);
			expect(result[0].oauthConfig?.clientSecret).toEqual(systemEntities[0].oauthConfig?.clientSecret);
			expect(result[0].oauthConfig?.grantType).toEqual(systemEntities[0].oauthConfig?.grantType);
			expect(result[0].oauthConfig?.tokenEndpoint).toEqual(systemEntities[0].oauthConfig?.tokenEndpoint);
			expect(result[0].oauthConfig?.authEndpoint).toEqual(systemEntities[0].oauthConfig?.authEndpoint);
			expect(result[0].oauthConfig?.responseType).toEqual(systemEntities[0].oauthConfig?.responseType);
			expect(result[0].oauthConfig?.scope).toEqual(systemEntities[0].oauthConfig?.scope);
			expect(result[0].oauthConfig?.provider).toEqual(systemEntities[0].oauthConfig?.provider);
			expect(result[0].oauthConfig?.logoutEndpoint).toEqual(systemEntities[0].oauthConfig?.logoutEndpoint);
			expect(result[0].oauthConfig?.issuer).toEqual(systemEntities[0].oauthConfig?.issuer);
			expect(result[0].oauthConfig?.jwksEndpoint).toEqual(systemEntities[0].oauthConfig?.jwksEndpoint);
			expect(result[0].oauthConfig?.redirectUri).toEqual(systemEntities[0].oauthConfig?.redirectUri);
			expect(result[1].oauthConfig).toBe(undefined);
		});
		it('should map oidcconfig if exists', () => {
			// Arrange
			const system = systemFactory.build();
			system.config = {
				authorizationUrl: 'authorizationUrl',
				clientId: 'clientId',
				clientSecret: 'clientSecret',
				defaultScopes: 'defaultScopes',
				logoutUrl: 'logoutUrl',
				tokenUrl: 'tokenUrl',
				userinfoUrl: 'userinfoUrl',
			};

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos([system]);

			// Assert
			expect(result[0].oidcConfig?.authorizationUrl).toEqual(system.config.authorizationUrl);
			expect(result[0].oidcConfig?.clientId).toEqual(system.config.clientId);
			expect(result[0].oidcConfig?.clientSecret).toEqual(system.config.clientSecret);
			expect(result[0].oidcConfig?.defaultScopes).toEqual(system.config.defaultScopes);
			expect(result[0].oidcConfig?.logoutUrl).toEqual(system.config.logoutUrl);
			expect(result[0].oidcConfig?.tokenUrl).toEqual(system.config.tokenUrl);
			expect(result[0].oidcConfig?.userinfoUrl).toEqual(system.config.userinfoUrl);
		});
		it('should not map oidcconfig if mandatory field is missing', () => {
			// Arrange
			const system = systemFactory.build();
			system.config = {
				authorizationUrl: 'authorizationUrl',
				clientSecret: 'clientSecret',
				defaultScopes: 'defaultScopes',
				logoutUrl: 'logoutUrl',
				tokenUrl: 'tokenUrl',
				userinfoUrl: 'userinfoUrl',
			};

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos([system]);

			// Assert
			expect(result[0].oidcConfig).toBe(undefined);
		});
	});
});
