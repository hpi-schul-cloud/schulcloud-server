import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ErwinStrategy } from './erwin.strategy';
import { OAuthService, OauthSessionToken, OauthSessionTokenService } from '@modules/oauth';
import { Account, AccountService } from '@modules/account';
import { AUTHENTICATION_CONFIG_TOKEN } from '../authentication-config';
import {
	SchoolInMigrationLoggableException,
	AccountNotFoundLoggableException,
	UserAccountDeactivatedLoggableException,
} from '../loggable';
import { CurrentUserMapper } from '../mapper';
import { UserDo } from '@modules/user';
import { OAuthTokenDto } from '@modules/oauth-adapter';
import { Oauth2AuthorizationBodyParams } from '../controllers/dto';
import jwt from 'jsonwebtoken';

describe(ErwinStrategy.name, () => {
	let module: TestingModule;
	let strategy: ErwinStrategy;
	let oauthService: DeepMocked<OAuthService>;
	let accountService: DeepMocked<AccountService>;

	jest.mock(
		'../mapper',
		(): new () => CurrentUserMapper =>
			class {
				mapToErwinCurrentUser = jest.fn((accountId: string, user: UserDo, systemId: string, flag: boolean) => {
					return {
						id: accountId,
						user,
						systemId,
						flag,
					};
				});
			}
	);

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				ErwinStrategy,
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
					useValue: {},
				},
			],
		}).compile();

		strategy = module.get(ErwinStrategy);
		oauthService = module.get(OAuthService);
		accountService = module.get(AccountService);
	});

	afterAll(async () => {
		await module.close();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	const erwinSystemId = 'erwin-system-id';
	const userId = 'user-id';
	const accountId = 'account-id';
	const user: UserDo = {
		id: userId,
		email: '',
		firstName: '',
		lastName: '',
		roles: [],
		schoolId: '',
		secondarySchools: [],
	};
	const account = new Account({ id: accountId, username: 'username', systemId: erwinSystemId });
	const tokenDto: {
		systemId?: string;
		idToken: string;
		accessToken: string;
		claims?: { systemId?: string };
	} = {
		systemId: erwinSystemId,
		idToken: 'id-token',
		accessToken: 'access-token',
	};

	const validRequest = {
		body: {
			redirectUri: 'http://localhost/redirect',
			code: 'auth-code',
			systemId: erwinSystemId,
		},
	};

	describe('validate', () => {
		describe('when no code is provided', () => {
			it('should return user object with undefined code', async () => {
				accountService.findByUserId.mockResolvedValue(account);
				const req = {
					body: {
						redirectUri: 'http://localhost/redirect',
						// code missing
						systemId: erwinSystemId,
					} as Partial<Oauth2AuthorizationBodyParams>,
				};
				const result = await strategy.validate(req as { body: Oauth2AuthorizationBodyParams });
				expect(result).toBeDefined();
				expect(result.systemId).toBe(erwinSystemId);
			});
		});

		describe('when authenticateUser returns no systemId', () => {
			it('should return user object with systemId from request', async () => {
				oauthService.authenticateUser.mockResolvedValue({ idToken: 'id', accessToken: 'at' } as OAuthTokenDto);
				accountService.findByUserId.mockResolvedValue(account);
				const result = await strategy.validate(validRequest);
				expect(result).toBeDefined();
				expect(result.systemId).toBe(erwinSystemId);
			});
		});

		describe('when provisionUser returns null', () => {
			it('should throw SchoolInMigrationLoggableException', async () => {
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(null);
				await expect(strategy.validate(validRequest)).rejects.toThrow(SchoolInMigrationLoggableException);
			});
		});

		describe('when no account is found', () => {
			it('should throw AccountNotFoundLoggableException', async () => {
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(null);
				await expect(strategy.validate(validRequest)).rejects.toThrow(AccountNotFoundLoggableException);
			});
		});

		describe('when account is deactivated', () => {
			it('should throw UserAccountDeactivatedLoggableException', async () => {
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				const deactivatedAccount = new Account({
					id: accountId,
					username: 'username',
					deactivatedAt: new Date(Date.now() - 1000),
				});
				accountService.findByUserId.mockResolvedValue(deactivatedAccount);
				await expect(strategy.validate(validRequest)).rejects.toThrow(UserAccountDeactivatedLoggableException);
			});
		});

		describe('when all data is valid', () => {
			it('should return currentUser', async () => {
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);

				const result = await strategy.validate(validRequest);
				expect(result).toBeDefined();
				expect(result.accountId).toBe(accountId);
				expect(result.userId).toBe(user.id);
				expect(result.systemId).toBe(erwinSystemId);
				expect(result.isExternalUser).toBe(true);
			});
		});

		describe('when claims.systemId is present', () => {
			it('should use systemId from request body, not claims', async () => {
				const tokenDtoWithClaims = {
					...tokenDto,
					systemId: undefined,
					claims: { systemId: 'claims-system-id' },
				};
				oauthService.authenticateUser.mockResolvedValue(tokenDtoWithClaims as unknown as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				const req = {
					body: {
						redirectUri: 'http://localhost/redirect',
						code: 'auth-code',
						systemId: erwinSystemId,
					},
				};
				const result = await strategy.validate(req as { body: Oauth2AuthorizationBodyParams });
				expect(result).toBeDefined();
				expect(result.accountId).toBe(accountId);
				expect(result.systemId).toBe(erwinSystemId);
			});
		});

		describe('when systemId is missing in both claims and root', () => {
			it('should return user object with undefined systemId', async () => {
				const tokenDtoNoSystemId = {
					idToken: 'id-token',
					accessToken: 'access-token',
				};
				oauthService.authenticateUser.mockResolvedValue(tokenDtoNoSystemId as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				const req = {
					body: {
						redirectUri: 'http://localhost/redirect',
						code: 'auth-code',
						// systemId intentionally omitted
					},
				};
				const result = await strategy.validate(req as { body: Oauth2AuthorizationBodyParams });
				expect(result).toBeDefined();
				expect(result.systemId).toBeUndefined();
			});
		});

		describe('when deactivatedAt is undefined', () => {
			it('should not throw', async () => {
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				const accountWithoutDeactivation = new Account({
					id: accountId,
					username: 'username',
					deactivatedAt: undefined,
				});
				accountService.findByUserId.mockResolvedValue(accountWithoutDeactivation);
				const result = await strategy.validate(validRequest);
				expect(result).toBeDefined();
				expect(result.accountId).toBe(accountId);
			});
		});
		describe('when externalSystemLogoutEnabled is true', () => {
			it('should call OauthSessionTokenService.save', async () => {
				// Arrange
				const config = { externalSystemLogoutEnabled: true };
				jest.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 } as jwt.JwtPayload);
				const testModule = await Test.createTestingModule({
					providers: [
						ErwinStrategy,
						{ provide: OAuthService, useValue: oauthService },
						{ provide: AccountService, useValue: accountService },
						{ provide: OauthSessionTokenService, useValue: createMock<OauthSessionTokenService>() },
						{ provide: AUTHENTICATION_CONFIG_TOKEN, useValue: config },
					],
				}).compile();
				const strategyWithLogout = testModule.get(ErwinStrategy);
				const oauthSessionTokenService = testModule.get(OauthSessionTokenService);
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				const fakeToken = { userId: 'u', systemId: 's', refreshToken: 'r', expiresAt: new Date() };
				jest.spyOn(oauthSessionTokenService, 'save').mockResolvedValue(fakeToken as OauthSessionToken);

				// Act
				await strategyWithLogout.validate(validRequest);

				// Assert
				expect(oauthSessionTokenService.save).toHaveBeenCalled();
			});
		});

		describe('when externalSystemLogoutEnabled is false', () => {
			it('should NOT call OauthSessionTokenService.save', async () => {
				// Arrange
				const config = { externalSystemLogoutEnabled: false };
				const testModule = await Test.createTestingModule({
					providers: [
						ErwinStrategy,
						{ provide: OAuthService, useValue: oauthService },
						{ provide: AccountService, useValue: accountService },
						{ provide: OauthSessionTokenService, useValue: createMock<OauthSessionTokenService>() },
						{ provide: AUTHENTICATION_CONFIG_TOKEN, useValue: config },
					],
				}).compile();
				const strategyNoLogout = testModule.get(ErwinStrategy);
				const oauthSessionTokenService = testModule.get(OauthSessionTokenService);
				oauthService.authenticateUser.mockResolvedValue(tokenDto as OAuthTokenDto);
				oauthService.provisionUser.mockResolvedValue(user);
				accountService.findByUserId.mockResolvedValue(account);
				const fakeToken = { userId: 'u', systemId: 's', refreshToken: 'r', expiresAt: new Date() };
				jest.spyOn(oauthSessionTokenService, 'save').mockResolvedValue(fakeToken as OauthSessionToken);

				// Act
				await strategyNoLogout.validate(validRequest);

				// Assert
				expect(oauthSessionTokenService.save).not.toHaveBeenCalled();
			});
		});
	});
});
