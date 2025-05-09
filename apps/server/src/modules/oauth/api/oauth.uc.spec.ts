import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { OAuthUc } from './oauth.uc';

describe(OAuthUc.name, () => {
	let module: TestingModule;
	let uc: OAuthUc;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OAuthUc,
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
			],
		}).compile();

		uc = module.get(OAuthUc);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLatestSessionTokenByUser', () => {
		describe('when a session token of the user is found', () => {
			const setup = () => {
				const sessionToken = oauthSessionTokenFactory.build();

				oauthSessionTokenService.findLatestByUserId.mockResolvedValueOnce(sessionToken);

				return { sessionToken };
			};

			it('should return the session token', async () => {
				const { sessionToken } = setup();

				const result = await uc.getLatestSessionTokenByUser(sessionToken.userId);

				expect(result).toEqual(sessionToken);
			});
		});

		describe('when no session token is found', () => {
			it('should throw an NotFoundLoggableException', async () => {
				const userId = new ObjectId().toHexString();

				const promise = uc.getLatestSessionTokenByUser(userId);

				await expect(promise).rejects.toThrow(new NotFoundLoggableException(OauthSessionToken.name, { userId }));
			});
		});
	});
});
