import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { JwtPayloadFactory } from '@infra/auth-guard';
import { Test, TestingModule } from '@nestjs/testing';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { AUTHENTICATION_CONFIG_TOKEN, AuthenticationConfig } from '../authentication-config';
import { JWT_STRATEGY_CONFIG_TOKEN, JwtModuleConfig } from '../jwt-module.config';
import { AuthenticationService } from '../services/authentication.service';
import { LoginUc } from './login.uc';

describe('LoginUc', () => {
	let module: TestingModule;
	let loginUc: LoginUc;

	let authenticationService: DeepMocked<AuthenticationService>;
	let jwtStrategyConfig: JwtModuleConfig;
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
					provide: JWT_STRATEGY_CONFIG_TOKEN,
					useValue: {
						expiresIn: '30d',
					},
				},
				{
					provide: AUTHENTICATION_CONFIG_TOKEN,
					useValue: {
						jwtLifetimeSystemUserSeconds: 3600,
					},
				},
			],
		}).compile();

		loginUc = module.get(LoginUc);
		authenticationService = module.get(AuthenticationService);
		jwtStrategyConfig = module.get(JWT_STRATEGY_CONFIG_TOKEN);
		authenticationConfig = module.get(AUTHENTICATION_CONFIG_TOKEN);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('getLoginData', () => {
		describe('when currentUser is given', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const expectedJwtPayload = new JwtPayloadFactory(currentUser).build();
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
					jwtStrategyConfig.expiresIn
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
		describe('when currentUser is given', () => {
			const setup = () => {
				const currentUser = currentUserFactory.build();
				const expectedJwtPayload = new JwtPayloadFactory(currentUser).asSystemUser().build();
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
	});
});
