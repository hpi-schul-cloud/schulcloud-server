import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import {
	Action,
	AuthorizationApi,
	AuthorizationBodyParamsReferenceType,
	AuthorizationContextParams,
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
		it('should call authorizationReferenceControllerAuthorizeByReference with the correct params', async () => {
			const referenceType: AuthorizationBodyParamsReferenceType = AuthorizationBodyParamsReferenceType.COURSES;
			const referenceId = 'someReferenceId';
			const context: AuthorizationContextParams = {
				action: Action.READ,
				requiredPermissions: [],
			};

			const expectedParams = {
				context,
				referenceType,
				referenceId,
			};

			await service.checkPermissionByReferences(referenceType, referenceId, context);

			expect(authorizationApi.authorizationReferenceControllerAuthorizeByReference).toHaveBeenCalledWith(
				expectedParams
			);
		});

		it('should return the response data', async () => {
			const response: AuthorizedReponse = {
				isAuthorized: true,
				userId: 'userId',
			};

			(authorizationApi.authorizationReferenceControllerAuthorizeByReference as jest.Mock).mockResolvedValueOnce({
				data: response,
			});

			const result = await service.checkPermissionByReferences(
				AuthorizationBodyParamsReferenceType.COURSES,
				'someReferenceId',
				{
					action: Action.READ,
					requiredPermissions: [],
				}
			);

			expect(result).toEqual(response);
		});
	});
});
