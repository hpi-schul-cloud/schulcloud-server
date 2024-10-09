import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ObjectId } from '@mikro-orm/mongodb';
import { AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OAuthService } from '@modules/oauth';
import { SystemService } from '@modules/system';
import { systemFactory, systemOauthConfigFactory } from '@modules/system/testing';
import { UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundLoggableException } from '@shared/common/loggable-exception';
import { JwtTestFactory, userDoFactory } from '@shared/testing';
import { AccountSystemMismatchLoggableException, InvalidTokenLoggableException } from '../loggable';
import { LogoutService } from './logout.service';

describe(LogoutService.name, () => {
	let module: TestingModule;
	let service: LogoutService;

	let systemService: DeepMocked<SystemService>;
	let oauthService: DeepMocked<OAuthService>;
	let userService: DeepMocked<UserService>;
	let accountService: DeepMocked<AccountService>;

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
			],
		}).compile();

		service = module.get(LogoutService);
		systemService = module.get(SystemService);
		oauthService = module.get(OAuthService);
		userService = module.get(UserService);
		accountService = module.get(AccountService);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
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
});
