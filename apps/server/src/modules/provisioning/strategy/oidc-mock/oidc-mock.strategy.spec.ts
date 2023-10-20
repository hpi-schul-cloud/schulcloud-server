import { Test, TestingModule } from '@nestjs/testing';
import { SystemProvisioningStrategy } from '@shared/domain/interface/system-provisioning.strategy';
import { OAuthSSOError } from '@src/modules/oauth/error/oauth-sso.error';
import jwt from 'jsonwebtoken';
import {
	ExternalUserDto,
	OauthDataDto,
	OauthDataStrategyInputDto,
	ProvisioningDto,
	ProvisioningSystemDto,
} from '../../dto';
import { OidcMockProvisioningStrategy } from './oidc-mock.strategy';

jest.mock('jsonwebtoken');

describe('OidcMockProvisioningStrategy', () => {
	let module: TestingModule;
	let strategy: OidcMockProvisioningStrategy;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [OidcMockProvisioningStrategy],
		}).compile();

		strategy = module.get(OidcMockProvisioningStrategy);
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getType is called', () => {
		describe('when it is called', () => {
			it('should return type OIDC', () => {
				const result: SystemProvisioningStrategy = strategy.getType();

				expect(result).toEqual(SystemProvisioningStrategy.OIDC);
			});
		});
	});

	describe('getData is called', () => {
		describe('when oauth input data is provided', () => {
			afterEach(() => {
				jest.resetAllMocks();
			});

			const setup = () => {
				const userName = 'preferredUserName';
				const input: OauthDataStrategyInputDto = new OauthDataStrategyInputDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					accessToken: 'accessToken',
					idToken: 'idToken',
				});

				jest.spyOn(jwt, 'decode').mockImplementation(() => {
					return { external_sub: userName };
				});

				return {
					userName,
					input,
				};
			};

			it('should fetch the user data', async () => {
				const { input, userName } = setup();

				const result: OauthDataDto = await strategy.getData(input);

				expect(result).toEqual<OauthDataDto>({
					system: input.system,
					externalUser: new ExternalUserDto({ externalId: userName }),
				});
			});

			it('should throw error when there is no external_sub in the idToken', async () => {
				const { input } = setup();
				jest.spyOn(jwt, 'decode').mockReturnValue({});

				const result: Promise<OauthDataDto> = strategy.getData(input);

				await expect(result).rejects.toThrow(OAuthSSOError);
			});

			it('should throw error when there is no idToken', async () => {
				const { input } = setup();
				jest.spyOn(jwt, 'decode').mockReturnValue(null);

				const result: Promise<OauthDataDto> = strategy.getData(input);

				await expect(result).rejects.toThrow(OAuthSSOError);
			});
		});
	});

	describe('apply is called', () => {
		describe('when oauth data is provided', () => {
			it('should return a provisioning dto with the external user id', async () => {
				const userName = 'preferredUserName';
				const data: OauthDataDto = new OauthDataDto({
					system: new ProvisioningSystemDto({
						systemId: 'systemId',
						provisioningStrategy: SystemProvisioningStrategy.OIDC,
					}),
					externalUser: new ExternalUserDto({ externalId: userName }),
				});

				const result: ProvisioningDto = await strategy.apply(data);

				expect(result).toEqual<ProvisioningDto>({
					externalUserId: userName,
				});
			});
		});
	});
});
