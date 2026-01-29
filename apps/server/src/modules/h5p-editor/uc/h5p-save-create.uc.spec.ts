import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import {
	AuthorizationBodyParamsReferenceType,
	AuthorizationClientAdapter,
	AuthorizationContextBuilder,
} from '@infra/authorization-client';
import { H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { ObjectId } from '@mikro-orm/mongodb';
import { UserService } from '@modules/user';
import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { H5P_EDITOR_CONFIG_TOKEN } from '../h5p-editor.config';
import { H5PAjaxEndpointProvider } from '../provider';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { h5pContentFactory } from '../testing';
import { H5PContentParentType, LumiUserWithContentData } from '../types';
import { H5PEditorUc } from './h5p-editor.uc';

const createParams = () => {
	const { content: parameters, metadata } = h5pContentFactory.build();

	const mainLibraryUbername = metadata.mainLibrary;

	const contentId = new ObjectId().toHexString();
	const parentId = new ObjectId().toHexString();

	const mockCurrentUser: ICurrentUser = {
		accountId: 'mockAccountId',
		roles: ['student'],
		schoolId: 'mockSchoolId',
		userId: 'mockUserId',
		isExternalUser: false,
		support: false,
	};

	return { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser };
};

describe('save or create H5P content', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pEditor: DeepMocked<H5PEditor>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				H5PAjaxEndpointProvider,
				{
					provide: H5PEditor,
					useValue: createMock<H5PEditor>(),
				},
				{
					provide: H5PPlayer,
					useValue: createMock<H5PPlayer>(),
				},
				{
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: AuthorizationClientAdapter,
					useValue: createMock<AuthorizationClientAdapter>(),
				},
				{
					provide: H5PContentRepo,
					useValue: createMock<H5PContentRepo>(),
				},
				{
					provide: Logger,
					useValue: createMock<Logger>(),
				},
				{
					provide: H5P_EDITOR_CONFIG_TOKEN,
					useValue: {},
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pEditor = module.get(H5PEditor);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('saveH5pContentGetMetadata is called', () => {
		describe('WHEN user is authorized and service saves successfully', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce({ id: contentId, metadata });
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId };
			};

			it('should call authorizationClientAdapter.checkPermissionsByReference', async () => {
				const { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				await uc.saveH5pContentGetMetadata(
					contentId,
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					AuthorizationBodyParamsReferenceType.BOARDNODES,
					parentId,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should call service with correct params', async () => {
				const { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				await uc.saveH5pContentGetMetadata(
					contentId,
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(h5pEditor.saveOrUpdateContentReturnMetaData).toHaveBeenCalledWith(
					contentId,
					parameters,
					metadata,
					mainLibraryUbername,
					expect.any(LumiUserWithContentData)
				);
			});

			it('should return results of service', async () => {
				const { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				const result = await uc.saveH5pContentGetMetadata(
					contentId,
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(result).toEqual({ id: contentId, metadata });
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId };
			};

			it('should throw forbidden error', async () => {
				const { contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId } = setup();

				const saveContentPromise = uc.saveH5pContentGetMetadata(
					contentId,
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				await expect(saveContentPromise).rejects.toThrow(new ForbiddenException());

				expect(h5pEditor.saveOrUpdateContentReturnMetaData).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				const error = new Error('test');

				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				h5pEditor.saveOrUpdateContentReturnMetaData.mockRejectedValueOnce(error);

				return { error, contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId };
			};

			it('should return error of service', async () => {
				const { error, contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId } = setup();

				const saveContentPromise = uc.saveH5pContentGetMetadata(
					contentId,
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				await expect(saveContentPromise).rejects.toThrow(error);
			});
		});
	});

	describe('createH5pContentGetMetadata is called', () => {
		describe('WHEN user is authorized and service creates successfully', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce({ id: contentId, metadata });
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId };
			};

			it('should call authorizationClientAdapter.checkPermissionsByReference', async () => {
				const { parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				await uc.createH5pContentGetMetadata(
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					AuthorizationBodyParamsReferenceType.BOARDNODES,
					parentId,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should call service with correct params', async () => {
				const { parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				await uc.createH5pContentGetMetadata(
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(h5pEditor.saveOrUpdateContentReturnMetaData).toHaveBeenCalledWith(
					undefined,
					parameters,
					metadata,
					mainLibraryUbername,
					expect.any(LumiUserWithContentData)
				);
			});

			it('should return results of service', async () => {
				const { contentId, parameters, metadata, mainLibraryUbername, mockCurrentUser, parentId } = setup();

				const result = await uc.createH5pContentGetMetadata(
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				expect(result).toEqual({ id: contentId, metadata });
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId };
			};

			it('should throw forbidden error', async () => {
				const { mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId } = setup();

				const saveContentPromise = uc.createH5pContentGetMetadata(
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				await expect(saveContentPromise).rejects.toThrow(new ForbiddenException());

				expect(h5pEditor.saveOrUpdateContentReturnMetaData).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { contentId, parameters, metadata, mainLibraryUbername, parentId, mockCurrentUser } = createParams();

				const error = new Error('test');

				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				h5pEditor.saveOrUpdateContentReturnMetaData.mockRejectedValueOnce(error);

				return { error, contentId, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId };
			};

			it('should return error of service', async () => {
				const { error, mockCurrentUser, parameters, metadata, mainLibraryUbername, parentId } = setup();

				const saveContentPromise = uc.createH5pContentGetMetadata(
					mockCurrentUser.userId,
					mockCurrentUser.schoolId,
					parameters,
					metadata,
					mainLibraryUbername,
					H5PContentParentType.BoardElement,
					parentId
				);

				await expect(saveContentPromise).rejects.toThrow(error);
			});
		});
	});
});
