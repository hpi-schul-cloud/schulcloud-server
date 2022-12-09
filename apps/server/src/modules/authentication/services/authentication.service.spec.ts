import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser } from '@shared/domain';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { BruteForceError } from '../errors/brute-force.error';
import { AuthenticationService } from './authentication.service';
import { JwtValidationAdapter } from '../strategy/jwt-validation.adapter';

const mockAccount: AccountDto = {
	id: 'mockAccountId',
	createdAt: new Date(),
	updatedAt: new Date(),
	username: 'mockedUsername',
};

describe('AuthenticationService', () => {
	let module: TestingModule;
	let authenticationService: AuthenticationService;
	let accountService: DeepMocked<AccountService>;
	let jwtService: DeepMocked<JwtService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AuthenticationService,
				{
					provide: JwtValidationAdapter,
					useValue: createMock<JwtValidationAdapter>(),
				},
				{
					provide: JwtService,
					useValue: createMock<JwtService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({ get: () => 15 }),
				},
			],
		}).compile();

		authenticationService = module.get(AuthenticationService);
		accountService = module.get(AccountService);
		jwtService = module.get(JwtService);
	});
	describe('loadAccount', () => {
		it('should load account without system', async () => {
			accountService.searchByUsernameExactMatch.mockResolvedValueOnce({
				accounts: [{ ...mockAccount, systemId: 'mockSystemId' }, mockAccount],
				total: 2,
			});
			const account = await authenticationService.loadAccount('username');
			expect(account).toEqual(mockAccount);
		});

		it('should find account with system', async () => {
			accountService.findByUsernameAndSystemId.mockResolvedValueOnce({ ...mockAccount, systemId: 'mockSystemId' });
			const account = await authenticationService.loadAccount('username', 'mockSystemId');
			expect(account).toEqual({ ...mockAccount, systemId: 'mockSystemId' });
		});

		it('should throw unautherized exception if no account is found', async () => {
			accountService.findByUsernameAndSystemId.mockResolvedValueOnce(null);
			await expect(authenticationService.loadAccount('username', 'mockSystemId')).rejects.toThrow(
				UnauthorizedException
			);
		});
	});
	describe('generateJwt', () => {
		it('should pass the correct parameters', async () => {
			const mockCurrentUser: ICurrentUser = {
				accountId: 'mockAccountId',
				roles: ['student'],
				schoolId: 'mockSchoolId',
				userId: 'mockUserId',
				user: {
					id: 'mockUserId',
					firstName: 'Samuel',
					lastName: 'Vimes',
					roles: [{ id: 'roleId', name: 'student' }],
					permissions: [],
					schoolId: 'mockSchoolId',
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			};
			await authenticationService.generateJwt(mockCurrentUser);
			expect(jwtService.sign).toBeCalledWith(
				mockCurrentUser,
				expect.objectContaining({
					subject: mockCurrentUser.accountId,
				})
			);
		});
	});
	describe('checkBrutForce', () => {
		beforeEach(() => {
			accountService.updateLastTriedFailedLogin.mockClear();
		});

		it('should fail for account with recently failed login', () => {
			const lasttriedFailedLogin = new Date();
			lasttriedFailedLogin.setSeconds(lasttriedFailedLogin.getSeconds() - 14);
			expect(() =>
				authenticationService.checkBrutForce({ id: 'mockAccountId', lasttriedFailedLogin } as AccountDto)
			).toThrow(BruteForceError);
		});
		it('should not fail for account with failed login above threshold', () => {
			const lasttriedFailedLogin = new Date();
			lasttriedFailedLogin.setSeconds(lasttriedFailedLogin.getSeconds() - 16);

			expect(() =>
				authenticationService.checkBrutForce({ id: 'mockAccountId', lasttriedFailedLogin } as AccountDto)
			).not.toThrow();
		});
	});

	describe('normalizeUsername', () => {
		it('should trim username', () => {
			const username = '  username  ';
			const result = authenticationService.normalizeUsername(username);

			expect(result).toEqual('username');
		});

		it('should lowercase username', () => {
			const username = 'UserName';
			const result = authenticationService.normalizeUsername(username);

			expect(result).toEqual('username');
		});
	});

	describe('normalizePassword', () => {
		it('should trim password', () => {
			const password = '  password  ';
			const result = authenticationService.normalizePassword(password);

			expect(result).toEqual('password');
		});
	});
});
