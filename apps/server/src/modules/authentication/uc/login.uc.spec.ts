import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadBuilder } from '@infra/auth-guard';
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { AuthenticationService } from '../services/authentication.service';
import { LoginUc } from './login.uc';

describe('LoginUc', () => {
	let module: TestingModule;
	let loginUc: LoginUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let authenticationConfig: AuthenticationConfig;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				LoginUc,
				{
					provide: AuthenticationService,
					useValue: createMock<AuthenticationService>(),
				},
				{
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: {
						jwtLifetimeSystemUserSeconds: 7200,
						expiresIn: '30d',
					},
				},
			],
		}).compile();

		loginUc = module.get(LoginUc);
		authenticationService = module.get(AuthenticationService);
		authenticationConfig = module.get(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterEach(() => {
		jest.clearAllMocks();
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
	});

	describe('getLoginDataForSystemUser', () => {
		describe('when currentUser is a system user', () => {
			const setup = () => {
				const currentUser = currentUserFactory.asSystemUser().build();
				const expectedJwtPayload = new JwtPayloadBuilder(currentUser).asSystemUser().build();
				const accessToken = 'systemUserAccessToken';

				authenticationService.generateJwtAndAddToWhitelist.mockResolvedValueOnce(accessToken);

				return {
					currentUser,
					expectedJwtPayload,
					accessToken,
				};
			};

			it('should call generateJwtAndAddToWhitelist with system user payload and config expiresIn', async () => {
				const { currentUser, expectedJwtPayload } = setup();

				await loginUc.getLoginDataForSystemUser(currentUser);

				expect(authenticationService.generateJwtAndAddToWhitelist).toHaveBeenCalledWith(
					expectedJwtPayload,
					authenticationConfig.jwtLifetimeSystemUserSeconds
				);
			});

			it('should call updateLastLogin with accountId', async () => {
				const { currentUser } = setup();

				await loginUc.getLoginDataForSystemUser(currentUser);

				expect(authenticationService.updateLastLogin).toHaveBeenCalledWith(currentUser.accountId);
			});

			it('should return the jwt token', async () => {
				const { currentUser, accessToken } = setup();

				const result = await loginUc.getLoginDataForSystemUser(currentUser);

				expect(result).toEqual(accessToken);
			});
		});

		describe('when currentUser is not a system user', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();

				return {
					currentUser,
				};
			};

			it('should throw UnauthorizedException', async () => {
				const { currentUser } = setup();

				await expect(loginUc.getLoginDataForSystemUser(currentUser)).rejects.toThrow(UnauthorizedException);
			});
		});
	});
});
