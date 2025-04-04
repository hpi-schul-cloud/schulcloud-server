import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadFactory } from '@infra/auth-guard';
import { DefaultEncryptionService, EncryptionService } from '@infra/encryption';
import { Account, AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OauthSessionTokenService } from '@modules/oauth';
import { User } from '@modules/user/repo';
import { userFactory } from '@modules/user/testing';
import { HttpService } from '@nestjs/axios';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@testing/database';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import jwt from 'jsonwebtoken';
import { BruteForceError } from '../errors';
import { JwtWhitelistAdapter } from '../helper/jwt-whitelist.adapter';
import { UserAccountDeactivatedLoggableException } from '../loggable';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from './authentication.service';

jest.mock('jsonwebtoken');

describe(AuthenticationService.name, () => {
	let module: TestingModule;
	let authenticationService: AuthenticationService;

	let jwtWhitelistAdapter: DeepMocked<JwtWhitelistAdapter>;
	let accountService: DeepMocked<AccountService>;
	let jwtService: DeepMocked<JwtService>;
	let configService: DeepMocked<ConfigService>;

	const mockAccount: Account = new Account({
		id: 'mockAccountId',
		createdAt: new Date(),
		updatedAt: new Date(),
		username: 'mockedUsername',
	});

	beforeAll(async () => {
		await setupEntities([Account, User]);

		module = await Test.createTestingModule({
			providers: [
				AuthenticationService,
				{
					provide: JwtWhitelistAdapter,
					useValue: createMock<JwtWhitelistAdapter>(),
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
				{
					provide: HttpService,
					useValue: createMock<HttpService>(),
				},
				{
					provide: DefaultEncryptionService,
					useValue: createMock<EncryptionService>(),
				},
			],
		}).compile();

		jwtWhitelistAdapter = module.get(JwtWhitelistAdapter);
		authenticationService = module.get(AuthenticationService);
		accountService = module.get(AccountService);
		jwtService = module.get(JwtService);
		configService = module.get(ConfigService);
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

	describe('generateSupportJwt', () => {
		describe('when generating new jwt', () => {
			const setup = () => {
				const supportUser = userFactory.asSuperhero().buildWithId();
				const targetUser = userFactory.asTeacher().buildWithId();
				const targetUserAccount = accountDoFactory.build({ userId: targetUser.id });
				const mockCurrentUser = CurrentUserMapper.userToICurrentUser(
					targetUserAccount.id,
					targetUser,
					false,
					targetUserAccount.systemId
				);
				const expiresIn = 150;

				accountService.findByUserIdOrFail.mockResolvedValueOnce(targetUserAccount);
				configService.get.mockReturnValueOnce(expiresIn);
				jwtService.sign.mockReturnValueOnce('jwt');

				const expectedPayload = JwtPayloadFactory.buildFromSupportUser(mockCurrentUser, supportUser.id);

				return { supportUser, targetUser, mockCurrentUser, targetUserAccount, expectedPayload, expiresIn };
			};

			it('should pass the correct parameters', async () => {
				const { supportUser, targetUser, mockCurrentUser, expectedPayload, expiresIn } = setup();

				await authenticationService.generateSupportJwt(supportUser, targetUser);

				expect(jwtService.sign).toBeCalledWith(
					expectedPayload,
					expect.objectContaining({
						subject: mockCurrentUser.accountId,
						jwtid: expect.any(String),
						expiresIn,
					})
				);
			});

			it('should return the generated jwt', async () => {
				const { mockCurrentUser } = setup();

				const result = await authenticationService.generateCurrentUserJwt(mockCurrentUser);

				expect(result).toEqual('jwt');
			});
		});
	});

	describe('generateCurrentUserJwt', () => {
		describe('when generating new jwt', () => {
			const setup = () => {
				const mockCurrentUser = currentUserFactory.withRole('random role').build();
				const expectedPayload = JwtPayloadFactory.buildFromCurrentUser(mockCurrentUser);
				const expiresIn = 15;
				configService.get.mockReturnValueOnce(expiresIn);
				jwtService.sign.mockReturnValueOnce('jwt');

				return { mockCurrentUser, expectedPayload, expiresIn };
			};

			it('should pass the correct parameters', async () => {
				const { mockCurrentUser, expectedPayload } = setup();
				await authenticationService.generateCurrentUserJwt(mockCurrentUser);
				expect(jwtService.sign).toBeCalledWith(
					expectedPayload,
					expect.objectContaining({
						subject: mockCurrentUser.accountId,
						jwtid: expect.any(String),
					})
				);
			});

			it('should return the generated jwt', async () => {
				const { mockCurrentUser } = setup();

				const result = await authenticationService.generateCurrentUserJwt(mockCurrentUser);

				expect(result).toEqual('jwt');
			});
		});
	});

	describe('removeJwtFromWhitelist is called', () => {
		describe('when a valid jwt is provided', () => {
			it('should call the jwtValidationAdapter to remove the jwt', async () => {
				const jwtToken = { sub: 'sub', accountId: 'accountId', jti: 'jti' };
				jest.spyOn(jwt, 'decode').mockReturnValue(jwtToken);

				await authenticationService.removeJwtFromWhitelist('jwt');

				expect(jwtWhitelistAdapter.removeFromWhitelist).toHaveBeenCalledWith(jwtToken.accountId, jwtToken.jti);
			});
		});

		describe('when a non-valid jwt is provided', () => {
			it('should do nothing', async () => {
				jest.spyOn(jwt, 'decode').mockReturnValue(null);

				await authenticationService.removeJwtFromWhitelist('jwt');

				expect(jwtWhitelistAdapter.removeFromWhitelist).not.toHaveBeenCalled();
			});
		});
	});

	describe('removeUserFromWhitelist', () => {
		describe('when an account was provided', () => {
			it('should call the jwtValidationAdapter to remove the jwt', async () => {
				const account = accountDoFactory.build();

				await authenticationService.removeUserFromWhitelist(account);

				expect(jwtWhitelistAdapter.removeFromWhitelist).toHaveBeenCalledWith(account.id);
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
