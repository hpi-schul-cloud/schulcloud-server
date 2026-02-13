import { ErrorLoggable } from '@core/error/loggable';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { accountDoFactory } from '@modules/account/testing';
import { systemFactory } from '@modules/system/testing';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { ExternalSystemLogoutIsDisabledLoggableException } from '../errors';
import { AuthenticationService, LogoutService } from '../services';
import { LogoutUc } from './logout.uc';

describe(LogoutUc.name, () => {
	let module: TestingModule;
	let logoutUc: LogoutUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let logoutService: DeepMocked<LogoutService>;
	let logger: DeepMocked<Logger>;
	let config: AuthenticationConfig;

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
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: AuthenticationConfig,
				},
			],
		}).compile();

		logoutUc = await module.get(LogoutUc);
		authenticationService = await module.get(AuthenticationService);
		logoutService = await module.get(LogoutService);
		logger = await module.get(Logger);
		config = await module.get(AUTHENTICATION_CONFIG_TOKEN);
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

				config.externalSystemLogoutEnabled = false;

				return {
					currentUser,
				};
			};

			it('should throw an ExternalSystemLogoutIsDisabledLoggableException', async () => {
				const { currentUser } = setup();

				const promise = logoutUc.externalSystemLogout(currentUser);

				await expect(promise).rejects.toThrow(new ExternalSystemLogoutIsDisabledLoggableException());
				expect(logoutService.externalSystemLogout).not.toHaveBeenCalled();
			});
		});

		describe('when the feature flag FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED is enabled', () => {
			describe('when the current user provided is signed in from a findable external system', () => {
				const setup = () => {
					const system = systemFactory.withOauthConfig().build();
					const currentUser = currentUserFactory.build({ isExternalUser: true, systemId: system.id });

					config.externalSystemLogoutEnabled = true;

					return {
						currentUser,
						system,
					};
				};

				it('should log out the user from the external system', async () => {
					const { currentUser } = setup();

					await logoutUc.externalSystemLogout(currentUser);

					expect(logoutService.externalSystemLogout).toHaveBeenCalledWith(currentUser);
				});
			});
		});
	});
});
