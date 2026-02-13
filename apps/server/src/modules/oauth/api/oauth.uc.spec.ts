import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { OAUTH_PUBLIC_API_CONFIG_TOKEN, OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException, NotFoundLoggableException } from '@shared/common/loggable-exception';
import { OauthPublicApiConfig } from '../oauth.config';
import { OAuthUc } from './oauth.uc';

describe(OAuthUc.name, () => {
	let module: TestingModule;
	let uc: OAuthUc;

	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let config: OauthPublicApiConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuthUc,
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
				{
					provide: OAUTH_PUBLIC_API_CONFIG_TOKEN,
					useValue: {
						featureLoginLinkEnabled: true,
						featureExternalSystemLogoutEnabled: true,
					},
				},
			],
		}).compile();

		uc = module.get(OAuthUc);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		config = module.get(OAUTH_PUBLIC_API_CONFIG_TOKEN);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLatestSessionTokenByUser', () => {
		describe('when the feature flag "FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED" is disabled', () => {
			const setup = () => {
				const userId = new ObjectId().toHexString();

				config.featureExternalSystemLogoutEnabled = false;

				return { userId };
			};

			it('should throw an FeatureDisabledLoggableException', async () => {
				const { userId } = setup();

				const promise = uc.getLatestSessionTokenByUser(userId);

				await expect(promise).rejects.toThrow(
					new FeatureDisabledLoggableException('FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED')
				);
			});
		});

		describe('when the feature flag "FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED" is enabled', () => {
			describe('when a session token of the user is found', () => {
				const setup = () => {
					const sessionToken = oauthSessionTokenFactory.build();

					oauthSessionTokenService.findLatestByUserId.mockResolvedValueOnce(sessionToken);

					config.featureExternalSystemLogoutEnabled = true;

					return { sessionToken };
				};

				it('should return the session token', async () => {
					const { sessionToken } = setup();

					const result = await uc.getLatestSessionTokenByUser(sessionToken.userId);

					expect(result).toEqual(sessionToken);
				});
			});

			describe('when no session token is found', () => {
				const setup = () => {
					const userId = new ObjectId().toHexString();

					config.featureExternalSystemLogoutEnabled = true;

					return { userId };
				};

				it('should throw an NotFoundLoggableException', async () => {
					const { userId } = setup();

					const promise = uc.getLatestSessionTokenByUser(userId);

					await expect(promise).rejects.toThrow(new NotFoundLoggableException(OauthSessionToken.name, { userId }));
				});
			});
		});
	});
});
