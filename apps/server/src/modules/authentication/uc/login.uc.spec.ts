import { AuditLogger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadBuilder } from '@infra/auth-guard';
import { AuthorizationContextBuilder, AuthorizationService } from '@modules/authorization';
import { userFactory } from '@modules/user/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { AuthenticationService } from '../services/authentication.service';
import { LoginUc } from './login.uc';

describe('LoginUc', () => {
	let module: TestingModule;
	let loginUc: LoginUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let authenticationConfig: AuthenticationConfig;
	let auditLogger: DeepMocked<AuditLogger>;
	let authorizationService: DeepMocked<AuthorizationService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LoginUc,
				{
					provide: AuditLogger,
					useValue: createMock<AuditLogger>(),
				},
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
				{
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: {
						jwtLifetimeServiceAccountSeconds: 7200,
						expiresIn: '30d',
					},
				},
			],
		}).compile();

		loginUc = module.get(LoginUc);
		authenticationService = module.get(AuthenticationService);
		authenticationConfig = module.get(AUTHENTICATION_CONFIG_TOKEN);
		auditLogger = module.get(AuditLogger);
		authorizationService = module.get(AuthorizationService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getLoginData', () => {
		describe('when currentUser is given', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const expectedJwtPayload = new JwtPayloadBuilder(currentUser).build();
				const accessToken = 'accessToken';

				authenticationService.generateJwtAndAddToWhitelist.mockResolvedValueOnce(accessToken);

				return {
					currentUser,
					expectedJwtPayload,
					accessToken,
				};
			};

			it('should call generateJwtAndAddToWhitelist with correct payload and expiresIn', async () => {
				const { currentUser, expectedJwtPayload } = setup();

				await loginUc.getLoginData(currentUser);

				expect(authenticationService.generateJwtAndAddToWhitelist).toHaveBeenCalledWith(
					expectedJwtPayload,
					authenticationConfig.expiresIn
				);
			});

			it('should call updateLastLogin with accountId', async () => {
				const { currentUser } = setup();

				await loginUc.getLoginData(currentUser);

				expect(authenticationService.updateLastLogin).toHaveBeenCalledWith(currentUser.accountId);
			});

			it('should return the jwt token', async () => {
				const { currentUser, accessToken } = setup();

				const result = await loginUc.getLoginData(currentUser);

				expect(result).toEqual(accessToken);
			});
		});

		describe('when currentUser is a service account', () => {
			const setup = () => {
				const currentUser = currentUserFactory.asServiceAccountUser().build();

				return {
					currentUser,
				};
			};

			it('should throw UnauthorizedException', async () => {
				const { currentUser } = setup();

				await expect(loginUc.getLoginData(currentUser)).rejects.toThrow(UnauthorizedException);
			});
		});
	});

	describe('getLoginDataForServiceAccount', () => {
		describe('when currentUser is a service account', () => {
			const setup = () => {
				const currentUser = currentUserFactory.asServiceAccountUser().build();
				const expectedJwtPayload = new JwtPayloadBuilder(currentUser).asServiceAccount().build();
				const accessToken = 'isServiceAccountAccessToken';

				authenticationService.generateJwtAndAddToWhitelist.mockResolvedValueOnce(accessToken);

				return {
					currentUser,
					expectedJwtPayload,
					accessToken,
				};
			};

			it('should call generateJwtAndAddToWhitelist with service account payload and config expiresIn', async () => {
				const { currentUser, expectedJwtPayload } = setup();

				await loginUc.getLoginDataForServiceAccount(currentUser);

				expect(authenticationService.generateJwtAndAddToWhitelist).toHaveBeenCalledWith(
					expectedJwtPayload,
					authenticationConfig.jwtLifetimeServiceAccountSeconds
				);
			});

			it('should call updateLastLogin with accountId', async () => {
				const { currentUser } = setup();

				await loginUc.getLoginDataForServiceAccount(currentUser);

				expect(authenticationService.updateLastLogin).toHaveBeenCalledWith(currentUser.accountId);
			});

			it('should return the jwt token', async () => {
				const { currentUser, accessToken } = setup();

				const result = await loginUc.getLoginDataForServiceAccount(currentUser);

				expect(result).toEqual(accessToken);
			});

			it('should call auditLogger.logServiceAccountAction with userId and action', async () => {
				const { currentUser } = setup();

				await loginUc.getLoginDataForServiceAccount(currentUser);

				expect(auditLogger.logServiceAccountAction).toHaveBeenCalledWith(
					currentUser.userId,
					'ServiceAccountAuthenticated'
				);
			});
		});

		describe('when currentUser is not a service account', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();

				return {
					currentUser,
				};
			};

			it('should throw UnauthorizedException', async () => {
				const { currentUser } = setup();

				await expect(loginUc.getLoginDataForServiceAccount(currentUser)).rejects.toThrow(UnauthorizedException);
			});
		});
	});

	describe('getSupportLoginData', () => {
		describe('when support user has the permission', () => {
			const setup = () => {
				const supportUser = userFactory.buildWithId();
				const targetUser = userFactory.buildWithId();
				const jwtToken = 'supportJwtToken';

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(supportUser);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(targetUser);
				authorizationService.checkPermission.mockReturnValueOnce(undefined);
				authenticationService.generateSupportJwt.mockResolvedValueOnce(jwtToken);

				return {
					supportUser,
					targetUser,
					jwtToken,
				};
			};

			it('should load both users with permissions', async () => {
				const { supportUser, targetUser } = setup();

				await loginUc.getSupportLoginData(targetUser.id, supportUser.id);

				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledTimes(2);
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(supportUser.id);
				expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(targetUser.id);
			});

			it('should check permission for CREATE_SUPPORT_JWT', async () => {
				const { supportUser, targetUser } = setup();

				await loginUc.getSupportLoginData(targetUser.id, supportUser.id);

				const expectedContext = AuthorizationContextBuilder.write([Permission.CREATE_SUPPORT_JWT]);
				expect(authorizationService.checkPermission).toHaveBeenCalledWith(supportUser, supportUser, expectedContext);
			});

			it('should generate support JWT', async () => {
				const { supportUser, targetUser } = setup();

				await loginUc.getSupportLoginData(targetUser.id, supportUser.id);

				expect(authenticationService.generateSupportJwt).toHaveBeenCalledWith(supportUser, targetUser);
			});

			it('should return the jwt token', async () => {
				const { supportUser, targetUser, jwtToken } = setup();

				const result = await loginUc.getSupportLoginData(targetUser.id, supportUser.id);

				expect(result).toEqual(jwtToken);
			});
		});

		describe('when support user does not have the permission', () => {
			const setup = () => {
				const supportUser = userFactory.buildWithId();
				const targetUser = userFactory.buildWithId();

				authorizationService.getUserWithPermissions.mockResolvedValueOnce(supportUser);
				authorizationService.getUserWithPermissions.mockResolvedValueOnce(targetUser);
				authorizationService.checkPermission.mockImplementation(() => {
					throw new ForbiddenException();
				});

				return {
					supportUser,
					targetUser,
				};
			};

			it('should throw ForbiddenException', async () => {
				const { supportUser, targetUser } = setup();

				await expect(loginUc.getSupportLoginData(targetUser.id, supportUser.id)).rejects.toThrow(ForbiddenException);
			});
		});
	});
});
