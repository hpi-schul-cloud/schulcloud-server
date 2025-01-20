import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { accountDoFactory } from '@modules/account/testing';
import { OauthSessionTokenService } from '@modules/oauth';
import { oauthSessionTokenFactory } from '@modules/oauth/testing';
import { SystemService } from '@modules/system';
import { systemFactory } from '@modules/system/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLoggable } from '@src/core/error/loggable';
import { Logger } from '@src/core/logger';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { ExternalSystemLogoutIsDisabledLoggableException } from '../errors';
import { AuthenticationService, LogoutService } from '../services';
import { LogoutUc } from './logout.uc';

describe(LogoutUc.name, () => {
	let module: TestingModule;
	let logoutUc: LogoutUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let logoutService: DeepMocked<LogoutService>;
	let logger: DeepMocked<Logger>;
	let configService: DeepMocked<ConfigService>;
	let systemService: DeepMocked<SystemService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LogoutUc,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: LogoutService,
					useValue: createMock<LogoutService>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>({ get: () => true }),
				},
				{
					provide: SystemService,
					useValue: createMock<SystemService>(),
				},
				{
					provide: OauthSessionTokenService,
					useValue: createMock<OauthSessionTokenService>(),
				},
			],
		}).compile();

		logoutUc = await module.get(LogoutUc);
		authenticationService = await module.get(AuthenticationService);
		logoutService = await module.get(LogoutService);
		logger = await module.get(Logger);
		configService = await module.get(ConfigService);
		systemService = module.get(SystemService);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('logout', () => {
		describe('when a jwt is given', () => {
			const setup = () => {
				const jwt = JwtTestFactory.createJwt();

				return {
					jwt,
				};
			};

			it('should remove the user from the whitelist', async () => {
				const { jwt } = setup();

				await logoutUc.logout(jwt);

				expect(authenticationService.removeJwtFromWhitelist).toHaveBeenCalledWith(jwt);
			});
		});
	});

	describe('logoutOidc', () => {
		describe('when the logout token is valid', () => {
			const setup = () => {
				const logoutToken = 'logoutToken';
				const account = accountDoFactory.build();

				logoutService.getAccountFromLogoutToken.mockResolvedValueOnce(account);

				return {
					logoutToken,
					account,
				};
			};

			it('should validate the logout token and get the account', async () => {
				const { logoutToken } = setup();

				await logoutUc.logoutOidc(logoutToken);

				expect(logoutService.getAccountFromLogoutToken).toHaveBeenCalledWith(logoutToken);
			});

			it('should remove the user from the whitelist', async () => {
				const { logoutToken, account } = setup();

				await logoutUc.logoutOidc(logoutToken);

				expect(authenticationService.removeUserFromWhitelist).toHaveBeenCalledWith(account);
			});
		});

		describe('when the logout token is invalid', () => {
			const setup = () => {
				const logoutToken = 'logoutToken';
				const error = new Error('Validation error');

				logoutService.getAccountFromLogoutToken.mockRejectedValueOnce(error);

				return {
					logoutToken,
					error,
				};
			};

			it('should throw a generic error', async () => {
				const { logoutToken } = setup();

				await expect(logoutUc.logoutOidc(logoutToken)).rejects.toThrow(BadRequestException);
			});

			it('should log the original error', async () => {
				const { logoutToken, error } = setup();

				await expect(logoutUc.logoutOidc(logoutToken)).rejects.toThrow(BadRequestException);

				expect(logger.warning).toHaveBeenCalledWith(new ErrorLoggable(error));
			});
		});
	});

	describe('externalSystemLogout', () => {
		describe('when the feature flag FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED is disabled', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build({ isExternalUser: true });

				configService.get.mockReturnValueOnce(false);
				jest.spyOn(authenticationService, 'logoutFromExternalSystem');

				return {
					currentUser,
				};
			};

			it('should throw an ExternalSystemLogoutIsDisabledLoggableException', async () => {
				const { currentUser } = setup();

				const promise = logoutUc.externalSystemLogout(currentUser);

				await expect(promise).rejects.toThrow(new ExternalSystemLogoutIsDisabledLoggableException());
				expect(authenticationService.logoutFromExternalSystem).not.toHaveBeenCalled();
			});
		});

		describe('when the feature flag FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED is enabled', () => {
			describe('when the current user provided is signed in from a findable external system', () => {
				const setup = () => {
					const system = systemFactory.withOauthConfig().build();
					const currentUser = currentUserFactory.build({ isExternalUser: true, systemId: system.id });
					const sessionToken = oauthSessionTokenFactory.build({ userId: currentUser.userId });

					configService.get.mockReturnValueOnce(true);
					systemService.findById.mockResolvedValue(system);
					oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

					jest.spyOn(authenticationService, 'logoutFromExternalSystem');

					return {
						currentUser,
						system,
						sessionToken,
					};
				};

				it('should log out the user from the external system', async () => {
					const { currentUser, system, sessionToken } = setup();

					await logoutUc.externalSystemLogout(currentUser);

					expect(authenticationService.logoutFromExternalSystem).toHaveBeenCalledWith(sessionToken, system);
				});
			});

			describe('when the current user provided is not signed in from an external system', () => {
				const setup = () => {
					const currentUser = currentUserFactory.build({ isExternalUser: false, systemId: undefined });

					configService.get.mockReturnValueOnce(true);
					jest.spyOn(authenticationService, 'logoutFromExternalSystem');

					return {
						currentUser,
					};
				};

				it('should not log out the user from the external system', async () => {
					const { currentUser } = setup();

					await logoutUc.externalSystemLogout(currentUser);

					expect(authenticationService.logoutFromExternalSystem).not.toHaveBeenCalled();
				});
			});

			describe('when the current user provided is externally signed in but has no session token', () => {
				const setup = () => {
					const system = systemFactory.withOauthConfig().build();
					const currentUser = currentUserFactory.build({ isExternalUser: true, systemId: system.id });

					configService.get.mockReturnValueOnce(true);
					systemService.findById.mockResolvedValue(system);
					oauthSessionTokenService.findLatestByUserId.mockResolvedValue(null);

					jest.spyOn(authenticationService, 'logoutFromExternalSystem');

					return {
						currentUser,
					};
				};

				it('should not log out the user from the external system', async () => {
					const { currentUser } = setup();

					await logoutUc.externalSystemLogout(currentUser);

					expect(authenticationService.logoutFromExternalSystem).not.toHaveBeenCalled();
				});
			});

			describe('when the system of the current user cannot be found', () => {
				const setup = () => {
					const currentUser = currentUserFactory.build({ isExternalUser: true });
					const sessionToken = oauthSessionTokenFactory.build({ userId: currentUser.userId });

					configService.get.mockReturnValueOnce(true);
					systemService.findById.mockResolvedValue(null);
					oauthSessionTokenService.findLatestByUserId.mockResolvedValue(sessionToken);

					jest.spyOn(authenticationService, 'logoutFromExternalSystem');

					return {
						currentUser,
					};
				};

				it('should not log out the user from the external system', async () => {
					const { currentUser } = setup();

					await logoutUc.externalSystemLogout(currentUser);

					expect(authenticationService.logoutFromExternalSystem).not.toHaveBeenCalled();
				});
			});
		});
	});
});
