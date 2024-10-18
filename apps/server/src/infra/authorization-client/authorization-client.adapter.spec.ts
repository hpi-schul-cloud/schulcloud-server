import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import {
	AuthorizationApi,
	AuthorizationBodyParams,
	AuthorizationBodyParamsReferenceType,
	AuthorizationContextParamsAction,
	AuthorizationContextParamsRequiredPermissions,
	AuthorizedReponse,
} from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';
import { AuthorizationErrorLoggableException, AuthorizationForbiddenLoggableException } from './error';

const jwtToken = 'someJwtToken';
const requiredPermissions: Array<AuthorizationContextParamsRequiredPermissions> = [
	AuthorizationContextParamsRequiredPermissions.ACCOUNT_CREATE,
	AuthorizationContextParamsRequiredPermissions.ACCOUNT_DELETE,
];

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
				const params: AuthorizationBodyParams = {
					context: {
						action: AuthorizationContextParamsAction.READ,
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

				await service.checkPermissionsByReference(params.referenceType, params.referenceId, params.context);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

			describe('when permission is granted', () => {
				it('should resolve', async () => {
					const { params } = setup({ isAuthorized: true });

					await expect(
						service.checkPermissionsByReference(params.referenceType, params.referenceId, params.context)
					).resolves.toBeUndefined();
				});
			});

			describe('when permission is denied', () => {
				it('should throw AuthorizationForbiddenLoggableException', async () => {
					const { params } = setup({ isAuthorized: false });

					const expectedError = new AuthorizationForbiddenLoggableException(params);

					await expect(
						service.checkPermissionsByReference(params.referenceType, params.referenceId, params.context)
					).rejects.toThrowError(expectedError);
				});
			});
		});

		describe('when authorizationReferenceControllerAuthorizeByReference returns error', () => {
			const setup = () => {
				const params = {
					context: {
						action: AuthorizationContextParamsAction.READ,
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

				await expect(
					service.checkPermissionsByReference(params.referenceType, params.referenceId, params.context)
				).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('hasPermissionsByReference', () => {
		describe('when authorizationReferenceControllerAuthorizeByReference resolves successful', () => {
			const setup = () => {
				const params = {
					context: {
						action: AuthorizationContextParamsAction.READ,
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

				await service.hasPermissionsByReference(params.referenceType, params.referenceId, params.context);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

			it('should return isAuthorized', async () => {
				const { params, response } = setup();

				const result = await service.hasPermissionsByReference(
					params.referenceType,
					params.referenceId,
					params.context
				);

				expect(result).toEqual(response.data.isAuthorized);
			});
		});

		describe('when cookie header contains JWT token', () => {
			const setup = () => {
				const params = {
					context: {
						action: AuthorizationContextParamsAction.READ,
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

				await adapter.hasPermissionsByReference(params.referenceType, params.referenceId, params.context);

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
						action: AuthorizationContextParamsAction.READ,
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

				await adapter.hasPermissionsByReference(params.referenceType, params.referenceId, params.context);

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
						action: AuthorizationContextParamsAction.READ,
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

				await expect(
					adapter.hasPermissionsByReference(params.referenceType, params.referenceId, params.context)
				).rejects.toThrowError(expectedError);
			});
		});

		describe('when authorizationReferenceControllerAuthorizeByReference returns error', () => {
			const setup = () => {
				const params = {
					context: {
						action: AuthorizationContextParamsAction.READ,
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

				await expect(
					service.hasPermissionsByReference(params.referenceType, params.referenceId, params.context)
				).rejects.toThrowError(expectedError);
			});
		});
	});
});
