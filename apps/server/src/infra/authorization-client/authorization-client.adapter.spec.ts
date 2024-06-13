import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import {
	Action,
	AuthorizationApi,
	AuthorizationBodyParamsReferenceType,
	AuthorizedReponse,
} from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

const jwtToken = 'someJwtToken';
const requiredPermissions = ['somePermissionA', 'somePermissionB'];

describe(AuthorizationClientAdapter.name, () => {
	let module: TestingModule;
	let service: AuthorizationClientAdapter;
	let authorizationApi: DeepMocked<AuthorizationApi>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				AuthorizationClientAdapter,
				{
					provide: AuthorizationApi,
					useValue: createMock<AuthorizationApi>(),
				},
				{
					provide: REQUEST,
					useValue: createMock<Request>({
						headers: {
							authorization: `Bearer ${jwtToken}`,
						},
					}),
				},
			],
		}).compile();

		service = module.get(AuthorizationClientAdapter);
		authorizationApi = module.get(AuthorizationApi);
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

	describe('checkPermissionsByReference', () => {
		describe('when authorizationReferenceControllerAuthorizeByReference resolves successful', () => {
			const setup = (props: { isAuthorized: boolean }) => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const response = createMock<AxiosResponse<AuthorizedReponse>>({
					data: {
						isAuthorized: props.isAuthorized,
						userId: 'userId',
					},
				});
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

				return { params };
			};

			it('should call authorizationReferenceControllerAuthorizeByReference with correct params', async () => {
				const { params } = setup({ isAuthorized: true });

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await service.checkPermissionsByReference(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

			describe('when permission is granted', () => {
				it('should resolve', async () => {
					const { params } = setup({ isAuthorized: true });

					await expect(service.checkPermissionsByReference(params)).resolves.toBeUndefined();
				});
			});

			describe('when permission is denied', () => {
				it('should throw AuthorizationForbiddenLoggableException', async () => {
					const { params } = setup({ isAuthorized: false });

					const expectedError = new AuthorizationForbiddenLoggableException(params);

					await expect(service.checkPermissionsByReference(params)).rejects.toThrowError(expectedError);
				});

				it('should have correct log message', async () => {
					const { params } = setup({ isAuthorized: false });

					const expectedLogMessage = {
						type: 'FORBIDDEN_EXCEPTION',
						stack: expect.any(String),
						data: {
							action: params.context.action,
							referenceId: params.referenceId,
							referenceType: params.referenceType,
							requiredPermissions: params.context.requiredPermissions.join(','),
						},
					};

					try {
						await service.checkPermissionsByReference(params);
						// Fail test if above expression doesn't throw anything.
						expect(true).toBe(false);
					} catch (e) {
						const logMessage = (e as AuthorizationForbiddenLoggableException).getLogMessage();

						expect(logMessage).toEqual(expectedLogMessage);
					}
				});
			});
		});

		describe('when authorizationReferenceControllerAuthorizeByReference returns error', () => {
			describe('when error is instance of Error', () => {
				const setup = () => {
					const error = new Error('testError');
					authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

					const params = {
						context: {
							action: Action.READ,
							requiredPermissions,
						},
						referenceType: AuthorizationBodyParamsReferenceType.COURSES,
						referenceId: 'someReferenceId',
					};

					return { params, error };
				};

				it('should throw AuthorizationErrorLoggableException', async () => {
					const { params, error } = setup();

					const expectedError = new AuthorizationErrorLoggableException(error, params);

					await expect(service.checkPermissionsByReference(params)).rejects.toThrowError(expectedError);
				});

				it('should have correct log message', async () => {
					const { params, error } = setup();

					const expectedLogMessage = {
						type: 'INTERNAL_SERVER_ERROR',
						error,
						stack: expect.any(String),
						data: {
							action: params.context.action,
							referenceId: params.referenceId,
							referenceType: params.referenceType,
							requiredPermissions: params.context.requiredPermissions.join(','),
						},
					};

					try {
						await service.hasPermissionsByReference(params);
						// Fail test if above expression doesn't throw anything.
						expect(true).toBe(false);
					} catch (e) {
						const logMessage = (e as AuthorizationErrorLoggableException).getLogMessage();

						expect(logMessage).toEqual(expectedLogMessage);
					}
				});
			});

			describe('when error is NOT instance of Error', () => {
				const setup = () => {
					const params = {
						context: {
							action: Action.READ,
							requiredPermissions,
						},
						referenceType: AuthorizationBodyParamsReferenceType.COURSES,
						referenceId: 'someReferenceId',
					};

					const error = { code: '123', message: 'testError' };
					authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

					return { params, error };
				};

				it('should throw AuthorizationErrorLoggableException', async () => {
					const { params, error } = setup();

					const expectedError = new AuthorizationErrorLoggableException(error, params);

					await expect(service.hasPermissionsByReference(params)).rejects.toThrowError(expectedError);
				});

				it('should have correct log message', async () => {
					const { params, error } = setup();

					const expectedLogMessage = {
						type: 'INTERNAL_SERVER_ERROR',
						error: new Error(JSON.stringify(error)),
						stack: expect.any(String),
						data: {
							action: params.context.action,
							referenceId: params.referenceId,
							referenceType: params.referenceType,
							requiredPermissions: params.context.requiredPermissions.join(','),
						},
					};

					try {
						await service.hasPermissionsByReference(params);
						// Fail test if above expression doesn't throw anything.
						expect(true).toBe(false);
					} catch (e) {
						const logMessage = (e as AuthorizationErrorLoggableException).getLogMessage();

						expect(logMessage).toEqual(expectedLogMessage);
					}
				});
			});
		});
	});

	describe('hasPermissionsByReference', () => {
		describe('when authorizationReferenceControllerAuthorizeByReference resolves successful', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const response = createMock<AxiosResponse<AuthorizedReponse>>({
					data: {
						isAuthorized: true,
						userId: 'userId',
					},
				});
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

				return { params, response };
			};

			it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
				const { params } = setup();

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await service.hasPermissionsByReference(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

			it('should return isAuthorized', async () => {
				const { params, response } = setup();

				const result = await service.hasPermissionsByReference(params);

				expect(result).toEqual(response.data.isAuthorized);
			});
		});

		describe('when cookie header contains JWT token', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const response = createMock<AxiosResponse<AuthorizedReponse>>({
					data: {
						isAuthorized: true,
						userId: 'userId',
					},
				});
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

				const request = createMock<Request>({
					headers: {
						cookie: `jwt=${jwtToken}`,
					},
				});
				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				return { params, adapter };
			};

			it('should forward the JWT as bearer token', async () => {
				const { params, adapter } = setup();

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await adapter.hasPermissionsByReference(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});
		});

		describe('when authorization header is without "Bearer " at the start', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const response = createMock<AxiosResponse<AuthorizedReponse>>({
					data: {
						isAuthorized: true,
						userId: 'userId',
					},
				});
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

				const request = createMock<Request>({
					headers: {
						authorization: jwtToken,
					},
				});
				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				return { params, adapter };
			};

			it('should forward the JWT as bearer token', async () => {
				const { params, adapter } = setup();

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await adapter.hasPermissionsByReference(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});
		});

		describe('when no JWT token is found', () => {
			const setup = () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const request = createMock<Request>({
					headers: {},
				});
				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				const error = new Error('Authentication is required.');

				return { params, adapter, error };
			};

			it('should throw an AuthorizationErrorLoggableException', async () => {
				const { params, adapter, error } = setup();

				const expectedError = new AuthorizationErrorLoggableException(error, params);

				await expect(adapter.hasPermissionsByReference(params)).rejects.toThrowError(expectedError);
			});

			it('should have correct log message', async () => {
				const { params, adapter, error } = setup();

				const expectedLogMessage = {
					type: 'INTERNAL_SERVER_ERROR',
					error,
					stack: expect.any(String),
					data: {
						action: params.context.action,
						referenceId: params.referenceId,
						referenceType: params.referenceType,
						requiredPermissions: params.context.requiredPermissions.join(','),
					},
				};

				try {
					await adapter.hasPermissionsByReference(params);
					// Fail test if above expression doesn't throw anything.
					expect(true).toBe(false);
				} catch (e) {
					const logMessage = (e as AuthorizationErrorLoggableException).getLogMessage();

					expect(logMessage).toEqual(expectedLogMessage);
				}
			});
		});

		describe('when authorizationReferenceControllerAuthorizeByReference returns error', () => {
			describe('when error is instance of Error', () => {
				const setup = () => {
					const params = {
						context: {
							action: Action.READ,
							requiredPermissions,
						},
						referenceType: AuthorizationBodyParamsReferenceType.COURSES,
						referenceId: 'someReferenceId',
					};

					const error = new Error('testError');
					authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

					return { params, error };
				};

				it('should throw AuthorizationErrorLoggableException', async () => {
					const { params, error } = setup();

					const expectedError = new AuthorizationErrorLoggableException(error, params);

					await expect(service.hasPermissionsByReference(params)).rejects.toThrowError(expectedError);
				});

				it('should have correct log message', async () => {
					const { params, error } = setup();

					const expectedLogMessage = {
						type: 'INTERNAL_SERVER_ERROR',
						error,
						stack: expect.any(String),
						data: {
							action: params.context.action,
							referenceId: params.referenceId,
							referenceType: params.referenceType,
							requiredPermissions: params.context.requiredPermissions.join(','),
						},
					};

					try {
						await service.hasPermissionsByReference(params);
						// Fail test if above expression doesn't throw anything.
						expect(true).toBe(false);
					} catch (e) {
						const logMessage = (e as AuthorizationErrorLoggableException).getLogMessage();

						expect(logMessage).toEqual(expectedLogMessage);
					}
				});
			});

			describe('when error is NOT instance of Error', () => {
				const setup = () => {
					const params = {
						context: {
							action: Action.READ,
							requiredPermissions,
						},
						referenceType: AuthorizationBodyParamsReferenceType.COURSES,
						referenceId: 'someReferenceId',
					};

					const error = { code: '123', message: 'testError' };
					authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

					return { params, error };
				};

				it('should throw AuthorizationErrorLoggableException', async () => {
					const { params, error } = setup();

					const expectedError = new AuthorizationErrorLoggableException(error, params);

					await expect(service.hasPermissionsByReference(params)).rejects.toThrowError(expectedError);
				});

				it('should have correct log message', async () => {
					const { params, error } = setup();

					const expectedLogMessage = {
						type: 'INTERNAL_SERVER_ERROR',
						error: new Error(JSON.stringify(error)),
						stack: expect.any(String),
						data: {
							action: params.context.action,
							referenceId: params.referenceId,
							referenceType: params.referenceType,
							requiredPermissions: params.context.requiredPermissions.join(','),
						},
					};

					try {
						await service.hasPermissionsByReference(params);
						// Fail test if above expression doesn't throw anything.
						expect(true).toBe(false);
					} catch (e) {
						const logMessage = (e as AuthorizationErrorLoggableException).getLogMessage();

						expect(logMessage).toEqual(expectedLogMessage);
					}
				});
			});
		});
	});
});
