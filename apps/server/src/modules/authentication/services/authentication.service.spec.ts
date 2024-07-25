import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Account, AccountService } from '@modules/account';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import jwt from 'jsonwebtoken';
import { BruteForceError } from '../errors/brute-force.error';
import { JwtValidationAdapter } from '../helper/jwt-validation.adapter';
import { UserAccountDeactivatedLoggableException } from '../loggable/user-account-deactivated-exception';
import { iCurrentUserFactory } from '../testing';
import { AuthenticationService } from './authentication.service';

jest.mock('jsonwebtoken');

describe('AuthenticationService', () => {
	let module: TestingModule;
	let authenticationService: AuthenticationService;

	let jwtValidationAdapter: DeepMocked<JwtValidationAdapter>;
	let accountService: DeepMocked<AccountService>;
	let jwtService: DeepMocked<JwtService>;

	const mockAccount: Account = new Account({
		id: 'mockAccountId',
		createdAt: new Date(),
		updatedAt: new Date(),
		username: 'mockedUsername',
	});

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

		jwtValidationAdapter = module.get(JwtValidationAdapter);
		authenticationService = module.get(AuthenticationService);
		accountService = module.get(AccountService);
		jwtService = module.get(JwtService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('loadAccount', () => {
		describe('when resolving an account without system id', () => {
			it('should find an account', async () => {
				accountService.searchByUsernameExactMatch.mockResolvedValueOnce([
					[{ ...mockAccount, systemId: 'mockSystemId' } as Account, mockAccount],
					2,
				]);
				const account = await authenticationService.loadAccount('username');
				expect(account).toEqual(mockAccount);
			});
		});

		describe('when resolving an account with system id', () => {
			it('should find an account', async () => {
				accountService.findByUsernameAndSystemId.mockResolvedValueOnce({
					...mockAccount,
					systemId: 'mockSystemId',
				} as Account);
				const account = await authenticationService.loadAccount('username', 'mockSystemId');
				expect(account).toEqual({ ...mockAccount, systemId: 'mockSystemId' });
			});
		});

		describe('when resolving a not existent account', () => {
			it('should throw unautherized exception', async () => {
				accountService.findByUsernameAndSystemId.mockResolvedValueOnce(null);
				await expect(authenticationService.loadAccount('username', 'mockSystemId')).rejects.toThrow(
					UnauthorizedException
				);
			});
		});

		describe('when account is deactivated', () => {
			const setup = () =>
				new Account({
					id: 'mockAccountId',
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'mockedUsername',
					deactivatedAt: new Date(),
				});
			it('should throw USER_ACCOUNT_DEACTIVATED exception', async () => {
				const deactivatedAccount = setup();
				accountService.findByUsernameAndSystemId.mockResolvedValue(deactivatedAccount);
				const func = authenticationService.loadAccount('username', 'mockSystemId');
				await expect(func).rejects.toThrow(UserAccountDeactivatedLoggableException);
			});
		});
	});

	describe('generateJwt', () => {
		describe('when generating new jwt', () => {
			it('should pass the correct parameters', async () => {
				const mockCurrentStudentUser = iCurrentUserFactory.buildStudentICurrentUser();

				await authenticationService.generateJwt(mockCurrentStudentUser);
				expect(jwtService.sign).toBeCalledWith(
					mockCurrentStudentUser,
					expect.objectContaining({
						subject: mockCurrentStudentUser.accountId,
					})
				);
			});
		});
	});

	describe('removeJwtFromWhitelist is called', () => {
		describe('when a valid jwt is provided', () => {
			it('should call the jwtValidationAdapter to remove the jwt', async () => {
				const jwtToken = { sub: 'sub', accountId: 'accountId', jti: 'jti' };
				jest.spyOn(jwt, 'decode').mockReturnValue(jwtToken);

				await authenticationService.removeJwtFromWhitelist('jwt');

				expect(jwtValidationAdapter.removeFromWhitelist).toHaveBeenCalledWith(jwtToken.accountId, jwtToken.jti);
			});
		});

		describe('when a non-valid jwt is provided', () => {
			it('should do nothing', async () => {
				jest.spyOn(jwt, 'decode').mockReturnValue(null);

				await authenticationService.removeJwtFromWhitelist('jwt');

				expect(jwtValidationAdapter.removeFromWhitelist).not.toHaveBeenCalled();
			});
		});
	});

	describe('checkBrutForce', () => {
		describe('when user tries multiple logins', () => {
			const setup = (elapsedSeconds: number) => {
				const lasttriedFailedLogin = new Date();
				lasttriedFailedLogin.setSeconds(lasttriedFailedLogin.getSeconds() - elapsedSeconds);
				return lasttriedFailedLogin;
			};

			it('should fail for account with recently failed login', () => {
				const lasttriedFailedLogin = setup(14);
				expect(() =>
					authenticationService.checkBrutForce({ id: 'mockAccountId', lasttriedFailedLogin } as Account)
				).toThrow(BruteForceError);
			});

			it('should not fail for account with failed login above threshold', () => {
				const lasttriedFailedLogin = setup(16);
				expect(() =>
					authenticationService.checkBrutForce({ id: 'mockAccountId', lasttriedFailedLogin } as Account)
				).not.toThrow();
			});
		});
	});

	describe('updateLastLogin', () => {
		it('should call accountService to update last login', async () => {
			await authenticationService.updateLastLogin('mockAccountId');

			expect(accountService.updateLastLogin).toHaveBeenCalledWith('mockAccountId', expect.any(Date));
		});
	});

	describe('normalizeUsername', () => {
		describe('when a username is entered', () => {
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
	});

	describe('normalizePassword', () => {
		describe('when a password is entered', () => {
			it('should trim password', () => {
				const password = '  password  ';
				const result = authenticationService.normalizePassword(password);
				expect(result).toEqual('password');
			});
		});
	});
});
