import { Test, TestingModule } from '@nestjs/testing';
import { SystemEntity } from '@shared/domain/entity';
import { systemEntityFactory } from '@shared/testing/factory';
import { SystemOidcMapper } from './system-oidc.mapper';

describe('SystemOidcMapper', () => {
	let module: TestingModule;
	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [SystemOidcMapper],
		}).compile();
	});

	describe('mapFromEntityToDto', () => {
		it('should map all fields', () => {
			const systemEntity = systemEntityFactory.withOauthConfig().withOidcConfig().build();

			const result = SystemOidcMapper.mapFromEntityToDto(systemEntity);
			expect(result).toBeDefined();

			expect(result?.parentSystemId).toEqual(systemEntity.id);
			expect(result?.clientId).toEqual(systemEntity.oidcConfig?.clientId);
			expect(result?.clientSecret).toEqual(systemEntity.oidcConfig?.clientSecret);
			expect(result?.idpHint).toEqual(systemEntity.oidcConfig?.idpHint);
			expect(result?.authorizationUrl).toEqual(systemEntity.oidcConfig?.authorizationUrl);
			expect(result?.tokenUrl).toEqual(systemEntity.oidcConfig?.tokenUrl);
			expect(result?.userinfoUrl).toEqual(systemEntity.oidcConfig?.userinfoUrl);
			expect(result?.logoutUrl).toEqual(systemEntity.oidcConfig?.logoutUrl);
			expect(result?.defaultScopes).toEqual(systemEntity.oidcConfig?.defaultScopes);
		});
		it('should return undefined if parent system has no oidc config', () => {
			const systemEntity = systemEntityFactory.withOauthConfig().build();
			const result = SystemOidcMapper.mapFromEntityToDto(systemEntity);
			expect(result).toBeUndefined();
		});
	});

	describe('mapFromEntitiesToDtos', () => {
		it('should map all given entities', () => {
			const systemEntities: SystemEntity[] = [
				systemEntityFactory.withOidcConfig().build(),
				systemEntityFactory.withOidcConfig().build(),
			];

			const result = SystemOidcMapper.mapFromEntitiesToDtos(systemEntities);

			expect(result.length).toBe(systemEntities.length);
		});

		it('should map oidc config only config if exists', () => {
			const systemEntity = systemEntityFactory.withOidcConfig().build();
			const systemEntities: SystemEntity[] = [systemEntity, systemEntityFactory.withOauthConfig().build()];

			const results = SystemOidcMapper.mapFromEntitiesToDtos(systemEntities);

			expect(results.length).toBe(1);

			const [theResult] = results;

			expect(theResult.parentSystemId).toEqual(systemEntity.id);
			expect(theResult.clientId).toEqual(systemEntity.oidcConfig?.clientId);
			expect(theResult.clientSecret).toEqual(systemEntity.oidcConfig?.clientSecret);
			expect(theResult.idpHint).toEqual(systemEntity.oidcConfig?.idpHint);
			expect(theResult.authorizationUrl).toEqual(systemEntity.oidcConfig?.authorizationUrl);
			expect(theResult.tokenUrl).toEqual(systemEntity.oidcConfig?.tokenUrl);
			expect(theResult.userinfoUrl).toEqual(systemEntity.oidcConfig?.userinfoUrl);
			expect(theResult.logoutUrl).toEqual(systemEntity.oidcConfig?.logoutUrl);
			expect(theResult.defaultScopes).toEqual(systemEntity.oidcConfig?.defaultScopes);
		});
	});
});
