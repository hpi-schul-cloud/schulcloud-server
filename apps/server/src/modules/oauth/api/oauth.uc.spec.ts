import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureDisabledLoggableException, NotFoundLoggableException } from '@shared/common/loggable-exception';
import { OAuthUc } from './oauth.uc';

describe(OAuthUc.name, () => {
	let module: TestingModule;
	let uc: OAuthUc;

	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let configService: DeepMocked<ConfigService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuthUc,
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		uc = module.get(OAuthUc);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		configService = module.get(ConfigService);
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

				configService.getOrThrow.mockReturnValueOnce(false);

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
					configService.getOrThrow.mockReturnValueOnce(true);

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

					configService.getOrThrow.mockReturnValueOnce(true);

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
