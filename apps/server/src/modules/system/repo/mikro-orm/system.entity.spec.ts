import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities } from '@testing/database';
import { SystemEntity } from './system.entity';

describe('System Entity', () => {
	beforeAll(async () => {
		await setupEntities([SystemEntity]);
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new SystemEntity();
			expect(test).toThrow();
		});

		it('should create a system when passing required properties', () => {
			const system = new SystemEntity({ type: 'oauth' });

			expect(system instanceof SystemEntity).toEqual(true);
		});

		it('should create a system with correct properties', () => {
			const props = {
				type: 'oauth',
				url: 'SAMPLE_URL',
				alias: 'SAMPLE_ALIAS',
				displayName: 'SAMPLE_NAME',
				provisioningStrategy: SystemProvisioningStrategy.OIDC,
				provisioningUrl: 'https://mock.de/provisioning',
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
					endSessionEndpoint: 'https://mock.de/logout',
				},
			};

			const system = new SystemEntity(props);

			// When you compare to an object that does not have the same properties, the test fails with "TypeError: Converting circular structure to JSON".
			// This has something to do with schoolSystemOptions circularly referencing the system.
			expect(system).toEqual(expect.objectContaining(props));
		});
	});
});
