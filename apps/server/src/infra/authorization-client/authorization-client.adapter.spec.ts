import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ErrorUtils } from '@src/core/error/utils';
import { AxiosResponse } from 'axios';
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

	describe('checkPermissionByReferences', () => {
		describe('when client returns response', () => {
			it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				await service.checkPermissionByReferences(params);

				expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(params);
			});

			it('should return the response data', async () => {
				const response = createMock<AxiosResponse<AuthorizedReponse>>({
					data: {
						isAuthorized: true,
						userId: 'userId',
					},
				});

				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockResolvedValueOnce(response);

				const params = {
					context: {
						action: Action.READ,
						requiredPermissions: [],
					},
					referenceType: AuthorizationBodyParamsReferenceType.COURSES,
					referenceId: 'someReferenceId',
				};

				const result = await service.checkPermissionByReferences(params);

				expect(result).toEqual(response.data);
			});
		});

		describe('when client throws error', () => {
			it('should throw error', async () => {
				const error = new Error('testError');
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				authorizationApi.authorizationReferenceControllerAuthorizeByReference.mockRejectedValueOnce(error);

				const expectedError = new InternalServerErrorException(
					'AuthorizationClientAdapter:checkPermissionByReferences',
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
});
