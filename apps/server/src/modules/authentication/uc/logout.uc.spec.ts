import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { accountDoFactory } from '@modules/account/testing';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorLoggable } from '@src/core/error/loggable';
import { Logger } from '@src/core/logger';
import { AuthenticationService, LogoutService } from '../services';
import { LogoutUc } from './logout.uc';

describe(LogoutUc.name, () => {
	let module: TestingModule;
	let logoutUc: LogoutUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let logoutService: DeepMocked<LogoutService>;
	let logger: DeepMocked<Logger>;

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
			],
		}).compile();

		logoutUc = await module.get(LogoutUc);
		authenticationService = await module.get(AuthenticationService);
		logoutService = await module.get(LogoutService);
		logger = await module.get(Logger);
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

				await expect(logoutUc.logoutOidc(logoutToken)).rejects.toThrow(UnauthorizedException);
			});

			it('should log the original error', async () => {
				const { logoutToken, error } = setup();

				await expect(logoutUc.logoutOidc(logoutToken)).rejects.toThrow(UnauthorizedException);

				expect(logger.warning).toHaveBeenCalledWith(new ErrorLoggable(error));
			});
		});
	});
});
