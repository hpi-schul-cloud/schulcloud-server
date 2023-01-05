import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import { IservStrategyData } from '@src/modules/provisioning/strategy/iserv/iserv.strategy';
import { OidcProvisioningStrategy } from '@src/modules/provisioning/strategy/oidc/oidc.strategy';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

const params: IservStrategyData = {
	idToken: 'oidcIdToken',
};

describe('OidcStrategy', () => {
	let module: TestingModule;
	let oidcStrategy: OidcProvisioningStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [OidcProvisioningStrategy],
		}).compile();
		oidcStrategy = module.get(OidcProvisioningStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('apply', () => {
		const preferredUsername = 'testid';

		it('should apply strategy', async () => {
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return { preferred_username: preferredUsername };
			});
			const result = await oidcStrategy.apply(params);
			expect(result.externalUserId).toEqual(preferredUsername);
		});

		it('should throw error when there is no uuid in the idToken', async () => {
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
				return {};
			});
			await expect(oidcStrategy.apply(params)).rejects.toThrow(OAuthSSOError);
		});

		it('should throw error when there is no idToken', async () => {
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => null);
			await expect(oidcStrategy.apply(params)).rejects.toThrow(OAuthSSOError);
		});
	});

	describe('getType', () => {
		it('should return type OIDC', () => {
			const retType: SystemProvisioningStrategy = oidcStrategy.getType();
			expect(retType).toEqual(SystemProvisioningStrategy.OIDC);
		});
	});
});
