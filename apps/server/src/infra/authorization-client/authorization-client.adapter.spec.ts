import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
import { Request } from 'express';
import {
	Action,
	AuthorizationApi,
	AuthorizationBodyParamsReferenceType,
	AuthorizedReponse,
} from './authorization-api-client';
import { AuthorizationClientAdapter } from './authorization-client.adapter';

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
					useValue: createMock<Request>(),
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

	const setup = () => {
		const response = createMock<AxiosResponse<AuthorizedReponse>>({
			data: {
				isAuthorized: true,
				userId: 'userId',
			},
		});

		authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

		return { response };
	};

	describe('checkPermissionByReferences', () => {
		describe('when client returns response', () => {
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
				const expectedOptions = { headers: { Authorization: 'Bearer ' } };

				await service.checkPermissionByReferences(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

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

		describe('when client throws error', () => {
			it('should throw error', async () => {
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'AuthorizationClientAdapter:hasPermissionByReferences',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				await expect(service.checkPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});
	});

	describe('hasPermissionByReferences', () => {
		describe('when client returns response', () => {
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
				const expectedOptions = { headers: { Authorization: 'Bearer ' } };

				await service.hasPermissionByReferences(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
					params,
					expectedOptions
				);
			});

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
			it('should throw error', async () => {
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'AuthorizationClientAdapter:hasPermissionByReferences',
					ErrorUtils.createHttpExceptionOptions(error)
				);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				await expect(service.hasPermissionByReferences(params)).rejects.toThrowError(expectedError);
			});
		});
	});
});
