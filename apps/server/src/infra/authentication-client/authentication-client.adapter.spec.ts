import { AxiosErrorLoggable } from '@core/error/loggable';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { AuthenticationClientAdapter } from './authentication-client.adapter';
import { AuthenticationErrorLoggableException } from './error';
import { AuthenticationApi, LocalAuthorizationBodyParams } from './generated';

jest.mock('@core/error/loggable');
jest.mock('axios', (): unknown => {
	return {
		...jest.requireActual('axios'),
		isAxiosError: jest.fn(),
	};
});

describe(AuthenticationClientAdapter.name, () => {
	let module: TestingModule;
	let service: AuthenticationClientAdapter;
	let authenticationApi: DeepMocked<AuthenticationApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AuthenticationClientAdapter,
				{
					provide: AuthenticationApi,
					useValue: createMock<AuthenticationApi>(),
				},
			],
		}).compile();

		service = module.get(AuthenticationClientAdapter);
		authenticationApi = module.get(AuthenticationApi);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('login', () => {
		describe('when loginControllerLoginLocalServiceAccount resolves successful', () => {
			const setup = () => {
				const params: LocalAuthorizationBodyParams = {
					username: 'max.mustermann@example.org',
					password: 'secretPassword',
				};

				authenticationApi.loginControllerLoginLocalServiceAccount.mockResolvedValueOnce(
					createMock<AxiosResponse<{ accessToken: string }>>({
						data: {
							accessToken: 'someAccessToken',
						},
					})
				);

				return { params };
			};

			it('should call loginControllerLoginLocalServiceAccount with the correct params', async () => {
				const { params } = setup();

				await service.loginServiceAccount(params);

				expect(authenticationApi.loginControllerLoginLocalServiceAccount).toHaveBeenCalledWith(params);
			});

			it('should return the accessToken', async () => {
				const { params } = setup();

				const result = await service.loginServiceAccount(params);

				expect(result).toEqual('someAccessToken');
			});
		});

		describe('when loginControllerLoginLocalServiceAccount returns an error', () => {
			const setup = () => {
				const params: LocalAuthorizationBodyParams = {
					username: 'max.mustermann@example.org',
					password: 'secretPassword',
				};

				const error = new Error('testError');
				authenticationApi.loginControllerLoginLocalServiceAccount.mockRejectedValueOnce(error);

				return { params, error };
			};

			it('should throw AuthenticationErrorLoggableException', async () => {
				const { params, error } = setup();

				const expectedError = new AuthenticationErrorLoggableException(error, params.username);

				await expect(service.loginServiceAccount(params)).rejects.toThrowError(expectedError);
			});
		});

		describe('when isAxiosError returns true', () => {
			const setup = () => {
				const params: LocalAuthorizationBodyParams = {
					username: 'max.mustermann@example.org',
					password: 'secretPassword',
				};

				const axiosError = new Error('axios error');
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const spyIsAxiosError = jest.spyOn(require('axios'), 'isAxiosError').mockReturnValue(true);

				authenticationApi.loginControllerLoginLocalServiceAccount.mockRejectedValueOnce(axiosError);

				return { params, axiosError, spyIsAxiosError };
			};

			it('should wrap the error with AxiosErrorLoggable and throw AuthenticationErrorLoggableException', async () => {
				const { params, axiosError, spyIsAxiosError } = setup();

				await expect(service.loginServiceAccount(params)).rejects.toThrow(AuthenticationErrorLoggableException);

				expect(spyIsAxiosError).toHaveBeenCalledWith(axiosError);
				expect(AxiosErrorLoggable).toHaveBeenCalledWith(axiosError, 'AUTHENTICATION_API_LOGIN_FAILED');
			});
		});
	});

	describe('logout', () => {
		describe('when logoutControllerLogout resolves successful', () => {
			const setup = () => {
				const accessToken = 'someAccessToken';
				authenticationApi.logoutControllerLogout.mockResolvedValueOnce(createMock());

				return { accessToken };
			};

			it('should call logoutControllerLogout with Bearer authorization header', async () => {
				const { accessToken } = setup();

				const expectedOptions = { headers: { authorization: `Bearer ${accessToken}` } };

				await service.logout(accessToken);

				expect(authenticationApi.logoutControllerLogout).toHaveBeenCalledWith(expectedOptions);
			});

			it('should resolve to undefined', async () => {
				const { accessToken } = setup();

				await expect(service.logout(accessToken)).resolves.toBeUndefined();
			});
		});

		describe('when logoutControllerLogout returns an error', () => {
			const setup = () => {
				const accessToken = 'someAccessToken';
				const error = new Error('testError');
				authenticationApi.logoutControllerLogout.mockRejectedValueOnce(error);

				return { accessToken, error };
			};

			it('should throw AuthenticationErrorLoggableException', async () => {
				const { accessToken, error } = setup();

				const expectedError = new AuthenticationErrorLoggableException(error, 'unknown');

				await expect(service.logout(accessToken)).rejects.toThrowError(expectedError);
			});
		});

		describe('when isAxiosError returns true', () => {
			const setup = () => {
				const accessToken = 'someAccessToken';
				const axiosError = new Error('axios error');
				// eslint-disable-next-line @typescript-eslint/no-var-requires
				const spyIsAxiosError = jest.spyOn(require('axios'), 'isAxiosError').mockReturnValue(true);

				authenticationApi.logoutControllerLogout.mockRejectedValueOnce(axiosError);

				return { accessToken, axiosError, spyIsAxiosError };
			};

			it('should wrap the error with AxiosErrorLoggable and throw AuthenticationErrorLoggableException', async () => {
				const { accessToken, axiosError, spyIsAxiosError } = setup();

				await expect(service.logout(accessToken)).rejects.toThrow(AuthenticationErrorLoggableException);

				expect(spyIsAxiosError).toHaveBeenCalledWith(axiosError);
				expect(AxiosErrorLoggable).toHaveBeenCalledWith(axiosError, 'AUTHENTICATION_API_LOGOUT_FAILED');
			});
		});
	});
});
