import { Test, TestingModule } from '@nestjs/testing';
import { systemFactory } from '@shared/testing';
import { System } from '@shared/domain';
import { SystemMapper } from '@src/modules/system/mapper/system.mapper';

describe('SystemMapper', () => {
	let module: TestingModule;
	afterAll(async () => {
		await module.close();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemMapper],
		}).compile();
	});

	describe('mapFromEntityToDto', () => {
		it('should map all fields', () => {
			// Arrange
			const systemEntity = systemFactory.withOauthConfig().build();

			// Act
			const result = SystemMapper.mapFromEntityToDto(systemEntity);

			// Assert
			expect(result.url).toEqual(systemEntity.url);
			expect(result.alias).toEqual(systemEntity.alias);
			expect(result.type).toEqual(systemEntity.type);
			expect(result.provisioningStrategy).toEqual(systemEntity.provisioningStrategy);
			expect(result.oauthConfig).toEqual(systemEntity.oauthConfig);
		});
	});

	describe('mapFromEntitiesToDtos', () => {
		it('should map all given entities', () => {
			// Arrange
			const systemEntities: System[] = [
				systemFactory.withOauthConfig().build(),
				systemFactory.build({ oauthConfig: undefined }),
			];

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			// Assert
			expect(result.length).toBe(systemEntities.length);
		});

		it('should map oauthconfig if exists', () => {
			// Arrange
			const systemEntities: System[] = [
				systemFactory.withOauthConfig().build(),
				systemFactory.build({ oauthConfig: undefined }),
			];

			// Act
			const result = SystemMapper.mapFromEntitiesToDtos(systemEntities);

			// Assert
			expect(result[0].oauthConfig?.clientId).toEqual(systemEntities[0].oauthConfig?.clientId);
			expect(result[0].oauthConfig?.clientSecret).toEqual(systemEntities[0].oauthConfig?.clientSecret);
			expect(result[0].oauthConfig?.tokenRedirectUri).toEqual(systemEntities[0].oauthConfig?.tokenRedirectUri);
			expect(result[0].oauthConfig?.grantType).toEqual(systemEntities[0].oauthConfig?.grantType);
			expect(result[0].oauthConfig?.tokenEndpoint).toEqual(systemEntities[0].oauthConfig?.tokenEndpoint);
			expect(result[0].oauthConfig?.authEndpoint).toEqual(systemEntities[0].oauthConfig?.authEndpoint);
			expect(result[0].oauthConfig?.responseType).toEqual(systemEntities[0].oauthConfig?.responseType);
			expect(result[0].oauthConfig?.scope).toEqual(systemEntities[0].oauthConfig?.scope);
			expect(result[0].oauthConfig?.provider).toEqual(systemEntities[0].oauthConfig?.provider);
			expect(result[0].oauthConfig?.logoutEndpoint).toEqual(systemEntities[0].oauthConfig?.logoutEndpoint);
			expect(result[0].oauthConfig?.issuer).toEqual(systemEntities[0].oauthConfig?.issuer);
			expect(result[0].oauthConfig?.jwksEndpoint).toEqual(systemEntities[0].oauthConfig?.jwksEndpoint);
			expect(result[0].oauthConfig?.codeRedirectUri).toEqual(systemEntities[0].oauthConfig?.codeRedirectUri);
			expect(result[1].oauthConfig).toBe(undefined);
		});
	});
});
