import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
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

	describe('checkPermissionByReferences', () => {
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

			return { params, response };
		};

		it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
			const { params } = setup({ isAuthorized: true });

			const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

			await service.checkPermissionByReferences(params);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				params,
				expectedOptions
			);
		});

		describe('when permission is granted', () => {
			it('should return', async () => {
				const { params } = setup({ isAuthorized: true });

				await expect(service.checkPermissionByReferences(params)).resolves.toBeUndefined();
			});
		});

		describe('when permission is denied', () => {
			it('should throw AuthorizationForbiddenLoggableException', async () => {
				const { params } = setup({ isAuthorized: false });

				const expectedError = new AuthorizationForbiddenLoggableException(params);

				await expect(service.checkPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});

		describe('when client throws error', () => {
			it('should throw AuthorizationErrorLoggableException', async () => {
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

				const expectedError = new AuthorizationErrorLoggableException(error, params);

				await expect(service.checkPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('hasPermissionByReferences', () => {
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

			return { params, response };
		};

		it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
			const { params } = setup({ isAuthorized: true });

			const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

			await service.hasPermissionByReferences(params);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				params,
				expectedOptions
			);
		});

		describe('when cookie header contains JWT token', () => {
			it('should forward the JWT as bearer token', async () => {
				const { params } = setup({ isAuthorized: true });

				const request = createMock<Request>({
					headers: {
						cookie: `jwt=${jwtToken}`,
					},
				});
				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await adapter.hasPermissionByReferences(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});
		});

		describe('when authorization header does not contain Bearer token', () => {
			it('should forward the JWT as bearer token', async () => {
				const { params } = setup({ isAuthorized: true });

				const request = createMock<Request>({
					headers: {
						authorization: jwtToken,
					},
				});

				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

				await adapter.hasPermissionByReferences(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});
		});

		describe('when no JWT token is found', () => {
			it('should throw an UnauthorizedException', async () => {
				const request = createMock<Request>({
					headers: {},
				});

				const adapter = new AuthorizationClientAdapter(authorizationApi, request);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions,
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				await expect(adapter.hasPermissionByReferences(params)).rejects.toThrowError(UnauthorizedException);
			});
		});

		describe('when client returns response', () => {
			it('should return isAuthorized', async () => {
				const { response, params } = setup({ isAuthorized: true });

				const result = await service.hasPermissionByReferences(params);

				expect(result).toEqual(response.data.isAuthorized);
			});
		});

		describe('when client throws error', () => {
			it('should throw AuthorizationErrorLoggableException', async () => {
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

				const expectedError = new AuthorizationErrorLoggableException(error, params);

				await expect(service.hasPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});
	});
});
