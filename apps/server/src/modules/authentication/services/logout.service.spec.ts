import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { DefaultEncryptionService, EncryptionService, SymmetricKeyEncryptionService } from '@infra/encryption';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OauthConfigMissingLoggableException, OAuthService, OauthSessionTokenService } from '@modules/oauth';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { OauthConfig, SystemService } from '@modules/system';
import { systemFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { axiosErrorFactory } from '@testing/factory/axios-error.factory';
import { axiosResponseFactory } from '@testing/factory/axios-response.factory';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { of, throwError } from 'rxjs';
import { EndSessionEndpointNotFoundLoggableException, ExternalSystemLogoutFailedLoggableException } from '../errors';
import { AccountSystemMismatchLoggableException, InvalidTokenLoggableException } from '../loggable';
import { LogoutService } from './logout.service';

describe(LogoutService.name, () => {
	let module: TestingModule;
	let service: LogoutService;

	let systemService: DeepMocked<SystemService>;
	let oauthService: DeepMocked<OAuthService>;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let httpService: DeepMocked<HttpService>;
	let oauthEncryptionService: DeepMocked<SymmetricKeyEncryptionService>;
	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LogoutService,
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
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

		service = module.get(LogoutService);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		httpService = module.get(HttpService);
		oauthEncryptionService = module.get(DefaultEncryptionService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('getAccountFromLogoutToken', () => {
		describe('when the logout token is valid', () => {
			const setup = () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const system = systemFactory.build({ oauthConfig });

				const userExternalId = 'userExternalId';
				const user = userDoFactory.buildWithId({ externalId: userExternalId });
				const account = accountDoFactory.build({ userId: user.id, systemId: system.id });

				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: userExternalId,
					iss: oauthConfig.issuer,
					aud: oauthConfig.clientId,
				});

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);
				userService.findByExternalId.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);

				return {
					logoutToken,
					oauthConfig,
					userExternalId,
					system,
					account,
				};
			};

			it('should search for the correct system', async () => {
				const { logoutToken, oauthConfig } = setup();

				await service.getAccountFromLogoutToken(logoutToken);

				expect(systemService.findByOauth2Issuer).toHaveBeenCalledWith(oauthConfig.issuer);
			});

			it('should validate the token', async () => {
				const { logoutToken, oauthConfig } = setup();

				await service.getAccountFromLogoutToken(logoutToken);

				expect(oauthService.validateLogoutToken).toHaveBeenCalledWith(logoutToken, oauthConfig);
			});

			it('should search the correct user', async () => {
				const { logoutToken, userExternalId, system } = setup();

				await service.getAccountFromLogoutToken(logoutToken);

				expect(userService.findByExternalId).toHaveBeenCalledWith(userExternalId, system.id);
			});

			it('should return the account', async () => {
				const { logoutToken, account } = setup();

				const result = await service.getAccountFromLogoutToken(logoutToken);

				expect(result).toEqual(account);
			});
		});

		describe('when the logout token does not have an issuer', () => {
			const setup = () => {
				const logoutToken = JwtTestFactory.createLogoutToken({
					iss: undefined,
				});

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(InvalidTokenLoggableException);
			});
		});

		describe('when the logout token does not have a subject', () => {
			const setup = () => {
				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: undefined,
				});

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(InvalidTokenLoggableException);
			});
		});

		describe('when there is no system', () => {
			const setup = () => {
				const logoutToken = JwtTestFactory.createLogoutToken();

				systemService.findByOauth2Issuer.mockResolvedValueOnce(null);

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the system does not have an oauth config', () => {
			const setup = () => {
				const system = systemFactory.build({ oauthConfig: undefined });
				const logoutToken = JwtTestFactory.createLogoutToken();

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the logout token validation fails', () => {
			const setup = () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const system = systemFactory.build({ oauthConfig });

				const logoutToken = JwtTestFactory.createLogoutToken({
					iss: oauthConfig.issuer,
					aud: oauthConfig.clientId,
				});

				const error = new Error();

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);
				oauthService.validateLogoutToken.mockRejectedValueOnce(error);

				return {
					logoutToken,
					error,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken, error } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(error);
			});
		});

		describe('when there is no user', () => {
			const setup = () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const system = systemFactory.build({ oauthConfig });

				const logoutToken = JwtTestFactory.createLogoutToken({
					iss: oauthConfig.issuer,
					aud: oauthConfig.clientId,
				});

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);
				userService.findByExternalId.mockResolvedValueOnce(null);

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when there is no account', () => {
			const setup = () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const system = systemFactory.build({ oauthConfig });

				const userExternalId = 'userExternalId';
				const user = userDoFactory.buildWithId({ externalId: userExternalId });

				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: userExternalId,
					iss: oauthConfig.issuer,
					aud: oauthConfig.clientId,
				});

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);
				userService.findByExternalId.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(null);

				return {
					logoutToken,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(NotFoundLoggableException);
			});
		});

		describe('when the system of the account is not the same as the one of the token', () => {
			const setup = () => {
				const oauthConfig = systemOauthConfigFactory.build();
				const system = systemFactory.build({ oauthConfig });

				const userExternalId = 'userExternalId';
				const user = userDoFactory.buildWithId({ externalId: userExternalId });
				const account = accountDoFactory.build({ userId: user.id, systemId: new ObjectId().toHexString() });

				const logoutToken = JwtTestFactory.createLogoutToken({
					sub: userExternalId,
					iss: oauthConfig.issuer,
					aud: oauthConfig.clientId,
				});

				systemService.findByOauth2Issuer.mockResolvedValueOnce(system);
				userService.findByExternalId.mockResolvedValueOnce(user);
				accountService.findByUserId.mockResolvedValueOnce(account);

				return {
					logoutToken,
					oauthConfig,
					userExternalId,
					system,
					account,
				};
			};

			it('should throw an error', async () => {
				const { logoutToken } = setup();

				await expect(service.getAccountFromLogoutToken(logoutToken)).rejects.toThrow(
					AccountSystemMismatchLoggableException
				);
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

		describe('when an user with valid session token and system is provided', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();
				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });

				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.userId,
				});

				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

				const axiosResponse = axiosResponseFactory.build();
				const mockedSecret = 'secret';

				httpService.post.mockReturnValue(of(axiosResponse));
				oauthEncryptionService.decrypt.mockReturnValue(mockedSecret);

				const oauthConfig = system.oauthConfig as OauthConfig;
				const axiosConfig = setupAxiosConfig(oauthConfig.clientId, mockedSecret);

				return {
					user,
					sessionToken,
					system,
					axiosConfig,
				};
			};

			it('should log the user out of the external system and remove the session token', async () => {
				const { user, axiosConfig, system, sessionToken } = setup();

				await service.externalSystemLogout(user);

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

		describe('when an user with no system is provided', () => {
			const setup = () => {
				const user = currentUserFactory.build({ isExternalUser: true, systemId: undefined });

				return {
					user,
				};
			};

			it('should not log the user out', async () => {
				const { user } = setup();

				await service.externalSystemLogout(user);

				expect(systemService.findById).not.toHaveBeenCalled();
			});
		});

		describe('when an user with invalid system is provided', () => {
			const setup = () => {
				const user = currentUserFactory.build({ isExternalUser: true, systemId: 'some-id' });
				systemService.findById.mockResolvedValue(null);

				return {
					user,
				};
			};

			it('should not log the user out', async () => {
				const { user } = setup();

				await service.externalSystemLogout(user);

				expect(httpService.post).not.toHaveBeenCalled();
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when an user with invalid session token is provided', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();
				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });

				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(null);

				return {
					user,
				};
			};

			it('should not log the user out', async () => {
				const { user } = setup();

				await service.externalSystemLogout(user);

				expect(httpService.post).not.toHaveBeenCalled();
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
			});
		});

		describe('when no oauth config is found for the user system', () => {
			const setup = () => {
				const system = systemFactory.build();
				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.userId,
				});

				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

				return {
					sessionToken,
					system,
					user,
				};
			};

			it('should throw an OauthConfigMissingLoggableException', async () => {
				const { user, system } = setup();

				const promise = service.externalSystemLogout(user);

				await expect(promise).rejects.toThrow(new OauthConfigMissingLoggableException(system.id));
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
				expect(httpService.post).not.toHaveBeenCalled();
			});
		});

		describe('when the user system end session endpoint is missing in the oauth config', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig({ endSessionEndpoint: undefined }).build();

				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.userId,
				});

				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

				return {
					sessionToken,
					system,
					user,
				};
			};

			it('should throw an EndSessionEndpointNotFoundLoggableException', async () => {
				const { user, system } = setup();

				const promise = service.externalSystemLogout(user);

				await expect(promise).rejects.toThrow(new EndSessionEndpointNotFoundLoggableException(system.id));
				expect(oauthSessionTokenService.delete).not.toHaveBeenCalled();
				expect(httpService.post).not.toHaveBeenCalled();
			});
		});

		describe('when there is an error from the external system', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();

				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });
				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.userId,
				});

				const axiosError = axiosErrorFactory.build();
				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);
				httpService.post.mockReturnValue(throwError(() => axiosError));

				return {
					sessionToken,
					system,
					axiosError,
					user,
				};
			};

			it('should throw an ExternalSystemLogoutFailedLoggableException with whole error from external system', async () => {
				const { user, sessionToken, system, axiosError } = setup();

				const promise = service.externalSystemLogout(user);

				await expect(promise).rejects.toThrow(
					new ExternalSystemLogoutFailedLoggableException(sessionToken.userId, system.id, axiosError)
				);
			});
		});

		describe('when the oauth session token had expired', () => {
			const setup = () => {
				const system = systemFactory.withOauthConfig().build();
				const user = currentUserFactory.build({ isExternalUser: true, systemId: system.id });

				const sessionToken = oauthSessionTokenFactory.build({
					userId: user.userId,
					expiresAt: new Date(Date.now() - 1000),
				});
				systemService.findById.mockResolvedValue(system);
				oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

				const axiosResponse = axiosResponseFactory.build();
				const mockedSecret = 'secret';

				httpService.post.mockReturnValue(of(axiosResponse));
				oauthEncryptionService.decrypt.mockReturnValue(mockedSecret);
				const oauthConfig = system.oauthConfig as OauthConfig;
				const axiosConfig = setupAxiosConfig(oauthConfig.clientId, mockedSecret);

				return {
					user,
					sessionToken,
					system,
					axiosConfig,
				};
			};

			it('should delete the expired token', async () => {
				const { sessionToken, user } = setup();

				await service.externalSystemLogout(user);

				expect(oauthSessionTokenService.delete).toHaveBeenCalledWith(sessionToken);
			});

			it('should not send an end session http request', async () => {
				const { user } = setup();

				await service.externalSystemLogout(user);

				expect(httpService.post).not.toHaveBeenCalled();
			});
		});
	});
});
