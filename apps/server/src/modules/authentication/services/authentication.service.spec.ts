import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadFactory } from '@infra/auth-guard';
import { DefaultEncryptionService, EncryptionService, SymetricKeyEncryptionService } from '@infra/encryption';
import { Account, AccountService } from '@modules/account';
import { OauthConfig } from '@modules/system';
import { OauthSessionTokenService } from '@modules/oauth';
import { accountDoFactory } from '@modules/account/testing';
import { systemFactory } from '@modules/system/testing';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { OauthConfigMissingLoggableException } from '@modules/oauth/loggable';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import {
	axiosErrorFactory,
	axiosResponseFactory,
	currentUserFactory,
	setupEntities,
	userFactory,
} from '@shared/testing';
import { Logger } from '@src/core/logger';
import jwt from 'jsonwebtoken';
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';
import {
	BruteForceError,
	EndSessionEndpointNotFoundLoggableException,
	ExternalSystemLogoutFailedLoggableException,
} from '../errors';
import { JwtWhitelistAdapter } from '../helper/jwt-whitelist.adapter';
import { UserAccountDeactivatedLoggableException } from '../loggable/user-account-deactivated-exception';
import { CurrentUserMapper } from '../mapper';
import { AuthenticationService } from './authentication.service';

jest.mock('jsonwebtoken');

describe('AuthenticationService', () => {
	let module: TestingModule;
	let authenticationService: AuthenticationService;

	let jwtWhitelistAdapter: DeepMocked<JwtWhitelistAdapter>;
	let accountService: DeepMocked<AccountService>;
	let jwtService: DeepMocked<JwtService>;
	let configService: DeepMocked<ConfigService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let httpService: DeepMocked<HttpService>;
	let oauthEncryptionService: DeepMocked<SymetricKeyEncryptionService>;

	const mockAccount: Account = new Account({
		id: 'mockAccountId',
		createdAt: new Date(),
		updatedAt: new Date(),
		username: 'mockedUsername',
	});

	beforeAll(async () => {
		await setupEntities();

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
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		httpService = module.get(HttpService);
		oauthEncryptionService = module.get(DefaultEncryptionService);
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

	describe('logoutFromExternalSystem', () => {
		const setupAxiosConfig = (clientId: string, clientSecret: string): AxiosRequestConfig => {
			const headers: AxiosHeaders = new AxiosHeaders();
			headers.setContentType('application/x-www-form-urlencoded');

			const config: AxiosRequestConfig = {
				auth: {
					username: clientId,
					password: clientSecret,
				},
				headers,
			};

			return config;
		};

		describe('when a valid session token and system is provided', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.id,
				});

				const system = systemFactory.withOauthConfig().build();

				const axiosResponse = axiosResponseFactory.build();
				const mockedSecret = 'secret';

				httpService.post.mockReturnValue(of(axiosResponse));
				oauthEncryptionService.decrypt.mockReturnValue(mockedSecret);
				jest.spyOn(oauthSessionTokenService, 'delete');

				const oauthConfig = system.oauthConfig as OauthConfig;
				const axiosConfig = setupAxiosConfig(oauthConfig.clientId, mockedSecret);

				return {
					sessionToken,
					system,
					axiosConfig,
				};
			};

			it('should log the user out of the external system and remove the session token', async () => {
				const { sessionToken, system, axiosConfig } = setup();

				await authenticationService.logoutFromExternalSystem(sessionToken, system);

				expect(httpService.post).toHaveBeenCalledWith(
					system.oauthConfig?.endSessionEndpoint,
					{
						refresh_token: sessionToken.refreshToken,
					},
					axiosConfig
				);
				expect(oauthSessionTokenService.delete).toHaveBeenCalledWith(sessionToken);
			});
		});

		describe('when the oauth session token had expired', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.id,
					expiresAt: new Date(Date.now() - 1000),
				});

				const system = systemFactory.withOauthConfig().build();

				jest.spyOn(oauthSessionTokenService, 'delete');
				jest.spyOn(httpService, 'post');

				return {
					sessionToken,
					system,
				};
			};

			it('should delete the expired token', async () => {
				const { sessionToken, system } = setup();

				await authenticationService.logoutFromExternalSystem(sessionToken, system);

				expect(oauthSessionTokenService.delete).toHaveBeenCalledWith(sessionToken);
			});

			it('should not send an end session http request', async () => {
				const { sessionToken, system } = setup();

				await authenticationService.logoutFromExternalSystem(sessionToken, system);

				expect(httpService.post).not.toHaveBeenCalled();
			});
		});

		describe('when no oauth config is found from the system', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.id,
				});

				const system = systemFactory.build();

				jest.spyOn(oauthSessionTokenService, 'delete');
				jest.spyOn(httpService, 'post');

				return {
					sessionToken,
					system,
				};
			};

			it('should throw an OauthConfigMissingLoggableException', async () => {
				const { sessionToken, system } = setup();

				const promise = authenticationService.logoutFromExternalSystem(sessionToken, system);

				await expect(promise).rejects.toThrow(new OauthConfigMissingLoggableException(system.id));
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
				expect(httpService.post).not.toHaveBeenCalled();
			});
		});

		describe('when the end session endpoint is missing in the oauth config', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.id,
				});

				const system = systemFactory.withOauthConfig({ endSessionEndpoint: undefined }).build();

				jest.spyOn(oauthSessionTokenService, 'delete');
				jest.spyOn(httpService, 'post');

				return {
					sessionToken,
					system,
				};
			};

			it('should throw an EndSessionEndpointNotFoundLoggableException', async () => {
				const { sessionToken, system } = setup();

				const promise = authenticationService.logoutFromExternalSystem(sessionToken, system);

				await expect(promise).rejects.toThrow(new EndSessionEndpointNotFoundLoggableException(system.id));
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
				expect(httpService.post).not.toHaveBeenCalled();
			});
		});

		describe('when there is an error from the external system', () => {
			const setup = () => {
				const user = userFactory.buildWithId();
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.id,
				});

				const system = systemFactory.withOauthConfig().build();

				const axiosError = axiosErrorFactory.build();

				jest.spyOn(oauthSessionTokenService, 'delete');
				httpService.post.mockReturnValue(throwError(() => axiosError));

				return {
					sessionToken,
					system,
					axiosError,
				};
			};

			it('should throw an ExternalSystemLogoutFailedLoggableException with whole error from external system', async () => {
				const { sessionToken, system, axiosError } = setup();

				const promise = authenticationService.logoutFromExternalSystem(sessionToken, system);

				await expect(promise).rejects.toThrow(
					new ExternalSystemLogoutFailedLoggableException(sessionToken.userId, system.id, axiosError)
				);
			});
		});
	});
});
