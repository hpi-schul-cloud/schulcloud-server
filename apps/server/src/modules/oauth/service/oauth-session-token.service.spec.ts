import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { SortOrder, SortOrderMap } from '@shared/domain/interface';
import { OAUTH_SESSION_TOKEN_REPO, OauthSessionTokenRepo } from '../repo';
import { oauthSessionTokenFactory } from '../testing';
import { OauthSessionTokenEntity } from '../entity';
import { OauthSessionTokenService } from './oauth-session-token.service';

describe(OauthSessionTokenService.name, () => {
	let module: TestingModule;
	let service: OauthSessionTokenService;

	let repo: DeepMocked<OauthSessionTokenRepo>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				OauthSessionTokenService,
				{
					provide: OAUTH_SESSION_TOKEN_REPO,
					useValue: createMock<OauthSessionTokenRepo>(),
				},
			],
		}).compile();

		service = module.get(OauthSessionTokenService);
		repo = module.get(OAUTH_SESSION_TOKEN_REPO);
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

				repo.save.mockResolvedValue(oauthSessionToken);

				return {
					oauthSessionToken,
				};
			};

			it('should save the token', async () => {
				const { oauthSessionToken } = setup();

				await service.save(oauthSessionToken);

				expect(repo.save).toHaveBeenCalledWith(oauthSessionToken);
			});

			it('should return the saved token', async () => {
				const { oauthSessionToken } = setup();

				const result = await service.save(oauthSessionToken);

				expect(result).toEqual(oauthSessionToken);
			});
		});
	});

	describe('findLatestByUserId', () => {
		describe('when an user id is provided', () => {
			const setup = () => {
				const sessionToken = oauthSessionTokenFactory.build();
				const userId: string = sessionToken.userId;
				const expectedSortOption: SortOrderMap<OauthSessionTokenEntity> = { updatedAt: SortOrder.desc };

				repo.findOneByUserId.mockResolvedValue(sessionToken);

				return {
					sessionToken,
					userId,
					expectedSortOption,
				};
			};

			it('should return the latest session token of the user', async () => {
				const { sessionToken, userId, expectedSortOption } = setup();

				const result = await service.findLatestByUserId(userId);

				expect(result).toEqual(sessionToken);
				expect(repo.findOneByUserId).toHaveBeenCalledWith(userId, expectedSortOption);
			});
		});
	});
});
