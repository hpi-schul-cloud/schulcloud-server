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

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	const setup = (isAuthorized = true) => {
		const response = createMock<AxiosResponse<AuthorizedReponse>>({
			data: {
				isAuthorized,
				userId: 'userId',
			},
		});

		authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

		return { response };
	};

	describe('checkPermissionByReferences', () => {
		it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
			setup();

			const params = {
				context: {
					action: Action.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};
			const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

			await service.checkPermissionByReferences(params);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				params,
				expectedOptions
			);
		});

		describe('when permission is granted', () => {
			it('should return', async () => {
				setup();

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				await service.checkPermissionByReferences(params);
			});
		});

		describe('when permission is denied', () => {
			it('should throw AuthorizationForbiddenLoggableException', async () => {
				setup(false);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const expectedError = new AuthorizationForbiddenLoggableException(params);

				await expect(service.checkPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});

		describe('when client throws error', () => {
			it('should throw AuthorizationErrorLoggableException', async () => {
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
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
		it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
			setup();

			const params = {
				context: {
					action: Action.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};
			const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

			await service.hasPermissionByReferences(params);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				params,
				expectedOptions
			);
		});

		it('should forward the JWT token from the "jwt" cookie', async () => {
			setup();

			const request = createMock<Request>({
				headers: {
					cookie: `jwt=${jwtToken}`,
				},
			});

			const adapter = new AuthorizationClientAdapter(authorizationApi, request);

			const params = {
				context: {
					action: Action.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};
			const expectedOptions = { headers: { authorization: `Bearer ${jwtToken}` } };

			await adapter.hasPermissionByReferences(params);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				params,
				expectedOptions
			);
		});

		it('should throw an UnauthorizedException if no JWT token is found', async () => {
			const request = createMock<Request>({
				headers: {},
			});

			const adapter = new AuthorizationClientAdapter(authorizationApi, request);

			const params = {
				context: {
					action: Action.READ,
					requiredPermissions: [],
				},
				referenceType: AuthorizationBodyParamsReferenceType.COURSES,
				referenceId: 'someReferenceId',
			};

			await expect(adapter.hasPermissionByReferences(params)).rejects.toThrowError(UnauthorizedException);
		});

		describe('when client returns response', () => {
			it('should return isAuthorized', async () => {
				const { response } = setup();

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const result = await service.hasPermissionByReferences(params);

				expect(result).toEqual(response.data.isAuthorized);
			});
		});

		describe('when client throws error', () => {
			it('should throw AuthorizationErrorLoggableException', async () => {
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
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
