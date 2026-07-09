import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, type EncryptionService } from '@infra/encryption';
import { Test, type TestingModule } from '@nestjs/testing';
import { OAUTH_SESSION_TOKEN_REPO, type OauthSessionTokenRepo } from '../repo';
import { oauthSessionTokenFactory } from '../testing';
import { OauthSessionTokenService } from './oauth-session-token.service';

describe(OauthSessionTokenService.name, () => {
	let module: TestingModule;
	let service: OauthSessionTokenService;

	let repo: DeepMocked<OauthSessionTokenRepo>;
	let encryptionService: DeepMocked<EncryptionService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthSessionTokenService,
				{
					provide: OAUTH_SESSION_TOKEN_REPO,
					useValue: createMock<OauthSessionTokenRepo>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		service = module.get(OauthSessionTokenService);
		repo = module.get(OAUTH_SESSION_TOKEN_REPO);
		encryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('save', () => {
		describe('when saving a session token', () => {
			const setup = () => {
				const oauthSessionToken = oauthSessionTokenFactory.build();
				const encryptedRefreshToken = 'encrypted-refresh-token';

				repo.save.mockResolvedValue(oauthSessionToken);
				encryptionService.encrypt.mockReturnValue(encryptedRefreshToken);

				return {
					oauthSessionToken,
					encryptedRefreshToken,
				};
			};

			it('should save the token', async () => {
				const { oauthSessionToken } = setup();

				await service.save(oauthSessionToken);

				expect(repo.save).toHaveBeenCalledWith(oauthSessionToken);
			});

			it('should encrypt the refresh token before saving', async () => {
				const { oauthSessionToken, encryptedRefreshToken } = setup();
				const originalRefreshToken = oauthSessionToken.refreshToken;

				await service.save(oauthSessionToken);

				expect(encryptionService.encrypt).toHaveBeenCalledWith(originalRefreshToken);
				expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: encryptedRefreshToken }));
			});

			it('should return the saved token', async () => {
				const { oauthSessionToken } = setup();

				const result = await service.save(oauthSessionToken);

				expect(result).toEqual(oauthSessionToken);
			});
		});
	});

	describe('delete', () => {
		describe('when removing a session token', () => {
			const setup = () => {
				const oauthSessionToken = oauthSessionTokenFactory.build();

				jest.spyOn(repo, 'delete');

				return {
					oauthSessionToken,
				};
			};

			it('should call the repo to delete the token', async () => {
				const { oauthSessionToken } = setup();

				await service.delete(oauthSessionToken);

				expect(repo.delete).toHaveBeenCalledWith(oauthSessionToken);
			});
		});
	});

	describe('findLatestByUserId', () => {
		describe('when an user id is provided', () => {
			const setup = () => {
				const sessionToken = oauthSessionTokenFactory.build();
				const { userId } = sessionToken;
				const decryptedRefreshToken = 'decrypted-refresh-token';

				repo.findLatestByUserId.mockResolvedValue(sessionToken);
				encryptionService.decrypt.mockReturnValue(decryptedRefreshToken);

				return {
					sessionToken,
					userId,
					decryptedRefreshToken,
				};
			};

			it('should return the latest session token of the user', async () => {
				const { sessionToken, userId } = setup();

				const result = await service.findLatestByUserId(userId);

				expect(result).toEqual(sessionToken);
				expect(repo.findLatestByUserId).toHaveBeenCalledWith(userId);
			});

			it('should decrypt the refresh token', async () => {
				const { sessionToken, userId, decryptedRefreshToken } = setup();
				const encryptedRefreshToken = sessionToken.refreshToken;

				const result = await service.findLatestByUserId(userId);

				expect(encryptionService.decrypt).toHaveBeenCalledWith(encryptedRefreshToken);
				expect(result?.refreshToken).toBe(decryptedRefreshToken);
			});
		});
	});
});
