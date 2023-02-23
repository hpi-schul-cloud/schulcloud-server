import { MikroORM } from '@mikro-orm/core';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { setupEntities } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { System } from './system.entity';

describe('System Entity', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('constructor', () => {
		it('should throw an error by empty constructor', () => {
			// @ts-expect-error: Test case
			const test = () => new System();
			expect(test).toThrow();
		});

		it('should create a system by passing required properties', () => {
			const system = systemFactory.build();

			expect(system instanceof System).toEqual(true);
		});

		it('should create a system by passing required and optional properties', () => {
			const system = systemFactory
				.withOauthConfig()
				.build({ url: 'SAMPLE_URL', alias: 'SAMPLE_ALIAS', displayName: 'SAMPLE_NAME' });

			expect(system instanceof System).toEqual(true);
			expect(system).toEqual(
				expect.objectContaining({
					type: 'oauth',
					url: 'SAMPLE_URL',
					alias: 'SAMPLE_ALIAS',
					displayName: 'SAMPLE_NAME',
					provisioningStrategy: SystemProvisioningStrategy.UNDEFINED,
					provisioningUrl: 'provisioningUrl',
					oauthConfig: {
						clientId: 'mock-client-id',
						clientSecret: 'mock-client-secret',
						tokenEndpoint: 'http://mock.tld/token',
						grantType: 'mock-grant-type',
						redirectUri: 'http://mock-app.tld/redirect',
						scope: 'openid uuid email',
						responseType: 'code',
						authEndpoint: 'http://mock.tld/auth',
						provider: 'mock-provider',
						logoutEndpoint: 'http://mock.tld/logout',
						issuer: 'mock-issuer',
						jwksEndpoint: 'http://mock.tld/jwks',
					},
				})
			);
		});
	});
});
