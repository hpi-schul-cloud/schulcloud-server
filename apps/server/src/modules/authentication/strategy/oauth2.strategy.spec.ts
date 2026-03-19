/* eslint-disable filename-rules/match */
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Account, AccountService } from '@modules/account';
import { accountDoFactory } from '@modules/account/testing';
import { OAuthService, OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { OAuthTokenDto } from '@modules/oauth-adapter';
import { RoleName } from '@modules/role';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain/types';
import { JwtTestFactory } from '@testing/factory/jwt.test.factory';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { OauthCurrentUser } from '../interface';
import {
	AccountNotFoundLoggableException,
	SchoolInMigrationLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';
import { Oauth2Strategy } from './oauth2.strategy';

describe(Oauth2Strategy.name, () => {
	let module: TestingModule;
	let strategy: Oauth2Strategy;

	let accountService: DeepMocked<AccountService>;
	let oauthService: DeepMocked<OAuthService>;
	let oauthSessionTokenService: DeepMocked<OauthSessionTokenService>;
	let config: AuthenticationConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				Oauth2Strategy,
				{
					provide: OAuthService,
					useValue: createMock<OAuthService>(),
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
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: AuthenticationConfig,
				},
			],
		}).compile();

		strategy = module.get(Oauth2Strategy);
		accountService = module.get(AccountService);
		oauthService = module.get(OAuthService);
		oauthSessionTokenService = module.get(OauthSessionTokenService);
		config = module.get(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.resetAllMocks();
	});

	describe('validate', () => {
		describe('when a valid code is provided', () => {
			const setup = () => {
				const systemId = 'systemId';
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).buildWithId();
				const account = accountDoFactory.build();
				const expiryDate = new Date();

				const idToken = JwtTestFactory.createJwt();
				const refreshToken = JwtTestFactory.createJwt({ exp: expiryDate.getTime() / 1000 });
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken,
						accessToken: 'accessToken',
						refreshToken,
					})
				);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				config.externalSystemLogoutEnabled = true;

				return {
					systemId,
					user,
					account,
					idToken,
					refreshToken,
					expiryDate,
				};
			};

			it('should cache the refresh token', async () => {
				const { systemId, user, refreshToken, expiryDate } = setup();

				await strategy.validate({
					body: { code: 'code', redirectUri: 'redirectUri', systemId },
				});

				expect(oauthSessionTokenService.save).toHaveBeenCalledWith(
					new OauthSessionToken({
						id: expect.any(String),
						systemId,
						userId: user.id as string,
						refreshToken,
						expiresAt: expiryDate,
					})
				);
			});

			it('should return the ICurrentUser', async () => {
				const { systemId, user, account, idToken } = setup();

				const result = await strategy.validate({
					body: { code: 'code', redirectUri: 'redirectUri', systemId },
				});

				expect(result).toEqual<OauthCurrentUser>({
					systemId,
					userId: user.id as EntityId,
					roles: [user.roles[0].id],
					schoolId: user.schoolId,
					accountId: account.id,
					externalIdToken: idToken,
					isExternalUser: true,
					support: false,
				});
			});
		});

		describe('when the user can not be provisioned', () => {
			const setup = () => {
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue(null);
			};

			it('should throw a SchoolInMigrationError', async () => {
				setup();

				const func = async () =>
					strategy.validate({ body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' } });

				await expect(func).rejects.toThrow(new SchoolInMigrationLoggableException());
			});
		});

		describe('when no account was found', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();

				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(null);
			};

			it('should throw an AccountNotFoundLoggableException', async () => {
				setup();

				const func = async () =>
					strategy.validate({
						body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' },
					});

				const loggableException = new AccountNotFoundLoggableException();
				await expect(func).rejects.toThrow(loggableException);
			});
		});

		describe('when account is deactivated', () => {
			const setup = () => {
				const user = userDoFactory.buildWithId();
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken: 'idToken',
						accessToken: 'accessToken',
						refreshToken: 'refreshToken',
					})
				);
				oauthService.provisionUser.mockResolvedValue(user);
				const account = new Account({
					id: 'accountId',
					createdAt: new Date(),
					updatedAt: new Date(),
					username: 'username',
					deactivatedAt: new Date(),
				});
				accountService.findByUserId.mockResolvedValue(account);
			};

			it('should throw an UserAccountDeactivated exception', async () => {
				setup();
				const func = async () =>
					strategy.validate({
						body: { code: 'code', redirectUri: 'redirectUri', systemId: 'systemId' },
					});

				await expect(func).rejects.toThrow(new UserAccountDeactivatedLoggableException());
			});
		});

		describe('when the feature flag "FEATURE_EXTERNAL_SYSTEM_LOGOUT_ENABLED" is disabled', () => {
			const setup = () => {
				const systemId = 'systemId';
				const user = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).buildWithId();
				const account = accountDoFactory.build();
				const expiryDate = new Date();

				const idToken = JwtTestFactory.createJwt();
				const refreshToken = JwtTestFactory.createJwt({ exp: expiryDate.getTime() / 1000 });
				oauthService.authenticateUser.mockResolvedValue(
					new OAuthTokenDto({
						idToken,
						accessToken: 'accessToken',
						refreshToken,
					})
				);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				config.externalSystemLogoutEnabled = false;

				return { systemId };
			};

			it('should not cache the refresh token', async () => {
				const { systemId } = setup();

				await strategy.validate({
					body: { code: 'code', redirectUri: 'redirectUri', systemId },
				});

				expect(oauthSessionTokenService.save).not.toHaveBeenCalled();
			});
		});
	});
});
