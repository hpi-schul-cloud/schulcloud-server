import { MikroORM } from '@mikro-orm/core';
import { setupEntities } from '@shared/testing';
import { systemFactory } from '@shared/testing/factory/system.factory';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
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
			const system = systemFactory.withOauthConfig().build({ url: 'SAMPLE_URL', alias: 'SAMPLE_ALIAS' });

			expect(system instanceof System).toEqual(true);
			expect(system.type).toEqual('oauth');
			expect(system.url).toEqual('SAMPLE_URL');
			expect(system.alias).toEqual('SAMPLE_ALIAS');
			expect(system.provisioningStrategy).toEqual(SystemProvisioningStrategy.UNDEFINED);
			expect(system.provisioningUrl).toEqual('provisioningUrl');
			expect(system.oauthConfig?.clientId).toEqual('12345');
			expect(system.oauthConfig?.clientSecret).toEqual('mocksecret');
			expect(system.oauthConfig?.tokenEndpoint).toEqual('http://mock.de/mock/auth/public/mockToken');
			expect(system.oauthConfig?.grantType).toEqual('authorization_code');
			expect(system.oauthConfig?.redirectUri).toEqual('http://mockhost:3030/api/v3/sso/oauth/testsystemId');
			expect(system.oauthConfig?.scope).toEqual('openid uuid');
			expect(system.oauthConfig?.responseType).toEqual('code');
			expect(system.oauthConfig?.authEndpoint).toEqual('mock_authEndpoint');
			expect(system.oauthConfig?.provider).toEqual('mock_type');
			expect(system.oauthConfig?.logoutEndpoint).toEqual('mock_logoutEndpoint');
			expect(system.oauthConfig?.issuer).toEqual('mock_issuer');
			expect(system.oauthConfig?.jwksEndpoint).toEqual('mock_jwksEndpoint');
		});
	});
});
