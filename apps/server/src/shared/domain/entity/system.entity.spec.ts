import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities, systemEntityFactory } from '@shared/testing/factory';
import { SystemEntity } from './system.entity';

describe('System Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new SystemEntity();
			expect(test).toThrow();
		});

		it('should create a system by passing required properties', () => {
			const system = systemEntityFactory.build();

			expect(system instanceof SystemEntity).toEqual(true);
		});

		it('should create a system by passing required and optional properties', () => {
			const system = systemEntityFactory
				.withOauthConfig()
				.build({ url: 'SAMPLE_URL', alias: 'SAMPLE_ALIAS', displayName: 'SAMPLE_NAME' });

			expect(system instanceof SystemEntity).toEqual(true);
			expect(system).toEqual(
				expect.objectContaining({
					type: 'oauth',
					url: 'SAMPLE_URL',
					alias: 'SAMPLE_ALIAS',
					displayName: 'SAMPLE_NAME',
					provisioningStrategy: SystemProvisioningStrategy.OIDC,
					provisioningUrl: 'https://provisioningurl.de',
					oauthConfig: {
						clientId: '12345',
						clientSecret: 'mocksecret',
						idpHint: 'mock-oauth-idpHint',
						tokenEndpoint: 'https://mock.de/mock/auth/public/mockToken',
						grantType: 'authorization_code',
						redirectUri: 'https://mockhost:3030/api/v3/sso/oauth/',
						scope: 'openid uuid',
						responseType: 'code',
						authEndpoint: 'https://mock.de/auth',
						provider: 'mock_type',
						logoutEndpoint: 'https://mock.de/logout',
						issuer: 'mock_issuer',
						jwksEndpoint: 'https://mock.de/jwks',
					},
				})
			);
		});
	});
});
