import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OidcProvisioningStrategy } from '@src/modules/provisioning/strategy/oidc/oidc.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import jwt from 'jsonwebtoken';
import { Test, TestingModule } from '@nestjs/testing';

const params = {
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

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(() => {
		jest.clearAllMocks();
	});

	describe('apply', () => {
		const preferredUsername = 'testid';

		beforeAll(() => {
			jest.spyOn(jwt, 'decode').mockImplementation(() => {
				return { preferred_username: preferredUsername };
			});
		});

		afterAll(() => {
			jest.clearAllMocks();
		});

		it('should apply strategy', async () => {
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
			jest.spyOn(jwt, 'decode').mockImplementationOnce(() => {
				return null;
			});
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
