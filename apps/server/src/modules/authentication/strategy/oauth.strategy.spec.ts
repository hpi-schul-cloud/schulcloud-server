import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { OAuthService } from '@src/modules/oauth/service/oauth.service';
import { Logger } from '@src/core/logger';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { userDoFactory } from '@shared/testing';
import { OauthStrategy } from './oauth.strategy';

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
					provide: Logger,
					useValue: createMock<Logger>(),
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
			oauthService.authenticateUser.mockResolvedValueOnce({
				redirect: '/mock-redirect',
			});
			const result = await strategy.validate({ params: { systemId }, query: {} });

			expect(result).toEqual({});
		});
	});
	describe('when the error property is set in query', () => {
		it('should return an empty object', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce({
				redirect: '/mock-redirect',
			});
			const result = await strategy.validate({ params: { systemId }, query: { code: 'some Code', error: 'an error' } });

			expect(result).toEqual({});
		});
	});

	describe('when no account is found for user ID', () => {
		it('should throw Unauthorized', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce({
				user: { id: 'mockUserId' } as UserDO,
				redirect: '/mock-redirect',
			});
			accountService.findByUserId.mockResolvedValueOnce(null);
			await expect(strategy.validate({ params: { systemId }, query: { code: 'some Code' } })).rejects.toThrow(
				UnauthorizedException
			);
		});
	});

	describe('when no user is returned for auth code (in case school is currently migrated to oauth)', () => {
		it('should return an empty object', async () => {
			oauthService.authenticateUser.mockResolvedValueOnce({
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

			oauthService.authenticateUser.mockResolvedValueOnce({
				user: mockUser,
				redirect: '/mock-redirect',
			});
			accountService.findByUserId.mockResolvedValueOnce({ id: accountId } as AccountDto);

			const currentUser = await strategy.validate({ params: { systemId }, query: { code: 'some Code' } });
			expect(currentUser).toMatchObject({ userId: mockUser.id, accountId, systemId });
		});
	});
});
