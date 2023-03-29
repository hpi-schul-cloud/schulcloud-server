import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { OAuthTokenDto } from '@src/modules/oauth';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { RoleService } from '@src/modules/role';
import { ICurrentUser } from '../interface';
import { OauthAuthorizationParams } from './dtos/oauth-authorization.params';
import { OauthStrategy, PathParams } from './oauth.strategy';

describe('OauthStrategy', () => {
	let module: TestingModule;
	let strategy: OauthStrategy;
	const systemId = 'mockSystemId';
	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [],
			providers: [
				OauthStrategy,
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		strategy = module.get(OauthStrategy);
		accountService = module.get(AccountService);
		oauthService = module.get(OAuthService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('when no systemId is passed as path param', () => {
		it('should return an empty object', async () => {
			const result = strategy.validate({ params: {}, query: {} });

			await expect(result).rejects.toThrow(BadRequestException);
		});
	});
	describe('when no code is given in query', () => {
		it('should return an empty object', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce(
				new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				})
			);
			oauthService.provisionUser.mockResolvedValueOnce({
				redirect: '/mock-redirect',
			});
			const result = await strategy.validate({ params: { systemId }, query: {} });

			expect(result).toEqual({});
		});
	});
	describe('when the error property is set in query', () => {
		it('should return an empty object', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce(
				new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				})
			);
			oauthService.provisionUser.mockResolvedValueOnce({
				redirect: '/mock-redirect',
			});
			const result = await strategy.validate({ params: { systemId }, query: { code: 'some Code', error: 'an error' } });

			expect(result).toEqual({});
		});
	});

	describe('when no account is found for user ID', () => {
		it('should throw Unauthorized', async () => {
			const request: { params: PathParams; query: OauthAuthorizationParams } = {
				params: { systemId },
				query: { code: 'some Code' },
			};

			oauthService.authenticateUser.mockResolvedValueOnce(
				new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				})
			);
			oauthService.provisionUser.mockResolvedValueOnce({
				user: { id: 'mockUserId' } as UserDO,
				redirect: '/mock-redirect',
			});
			accountService.findByUserId.mockResolvedValueOnce(null);
			oauthService.createErrorRedirect.mockReturnValue('errorRedirect');

			const result: ICurrentUser | unknown = await strategy.validate(request);

			expect(result).toEqual({});
			expect(request.query.redirect).toEqual('errorRedirect');
		});
	});

	describe('when no user is returned for auth code (in case school is currently migrated to oauth)', () => {
		it('should return an empty object', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce(
				new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				})
			);
			oauthService.provisionUser.mockResolvedValueOnce({
				redirect: '/mock-redirect',
			});
			accountService.findByUserId.mockResolvedValueOnce(null);

			const result = await strategy.validate({ params: { systemId }, query: { code: 'some Code' } });

			expect(result).toEqual({});
		});
	});

	describe('when login data is valid', () => {
		it('should return current user object', async () => {
			const mockUser: UserDO = userDoFactory.withDates().buildWithId();
			const accountId = 'mockAccountId';

			oauthService.authenticateUser.mockResolvedValueOnce(
				new OAuthTokenDto({
					idToken: 'idToken',
					refreshToken: 'refreshToken',
					accessToken: 'accessToken',
				})
			);
			oauthService.provisionUser.mockResolvedValueOnce({
				user: mockUser,
				redirect: '/mock-redirect',
			});
			accountService.findByUserId.mockResolvedValueOnce({ id: accountId } as AccountDto);

			const currentUser = await strategy.validate({ params: { systemId }, query: { code: 'some Code' } });
			expect(currentUser).toMatchObject({ userId: mockUser.id, accountId, systemId });
		});
	});
});
