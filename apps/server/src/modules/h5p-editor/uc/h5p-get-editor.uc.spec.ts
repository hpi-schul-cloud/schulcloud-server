import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { H5PEditor, H5PPlayer, IEditorModel } from '@lumieducation/h5p-server';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { h5pContentFactory, setupEntities } from '@shared/testing';
import { UserService } from '@src/modules/user';
import { H5PAjaxEndpointProvider } from '../provider';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PEditorUc } from './h5p.uc';

const createParams = () => {
	const content = h5pContentFactory.build();

	const mockCurrentUser: ICurrentUser = {
		accountId: 'mockAccountId',
		roles: ['student'],
		schoolId: 'mockSchoolId',
		userId: 'mockUserId',
		isExternalUser: false,
		impersonated: false,
	};

	const editorResponseMock = { scripts: ['test.js'] } as IEditorModel;
	const contentResponseMock: Awaited<ReturnType<H5PEditor['getContent']>> = {
		h5p: content.metadata,
		library: content.metadata.mainLibrary,
		params: {
			metadata: content.metadata,
			params: content.content,
		},
	};

	const language = LanguageType.DE;

	return { content, mockCurrentUser, editorResponseMock, contentResponseMock, language };
};

describe('get H5P editor', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pEditor: DeepMocked<H5PEditor>;
	let h5pContentRepo: DeepMocked<H5PContentRepo>;
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
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
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
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pEditor = module.get(H5PEditor);
		h5pContentRepo = module.get(H5PContentRepo);
		authorizationClientAdapter = module.get(AuthorizationClientAdapter);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getEmptyH5pEditor is called', () => {
		describe('WHEN service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, language } = createParams();

				h5pEditor.render.mockResolvedValueOnce(editorResponseMock);

				return { content, mockCurrentUser, editorResponseMock, language };
			};

			it('should call service with correct params', async () => {
				const { mockCurrentUser, language } = setup();

				await uc.getEmptyH5pEditor(mockCurrentUser, language);

				expect(h5pEditor.render).toHaveBeenCalledWith(
					undefined,
					language,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
			});

			it('should return results of service', async () => {
				const { mockCurrentUser, language, editorResponseMock } = setup();

				const result = await uc.getEmptyH5pEditor(mockCurrentUser, language);

				expect(result).toEqual(editorResponseMock);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, language } = createParams();

				const error = new Error('test');

				h5pEditor.render.mockRejectedValueOnce(error);

				return { error, content, mockCurrentUser, editorResponseMock, language };
			};

			it('should return error of service', async () => {
				const { error, mockCurrentUser, language } = setup();

				const getEmptyEditorPromise = uc.getEmptyH5pEditor(mockCurrentUser, language);

				await expect(getEmptyEditorPromise).rejects.toThrow(error);
			});
		});
	});

	describe('getH5pEditor is called', () => {
		describe('WHEN user is authorized and service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, contentResponseMock, language } = createParams();

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				h5pEditor.render.mockResolvedValueOnce(editorResponseMock);
				h5pEditor.getContent.mockResolvedValueOnce(contentResponseMock);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { content, mockCurrentUser, editorResponseMock, contentResponseMock, language };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { content, language, mockCurrentUser } = setup();

				await uc.getH5pEditor(mockCurrentUser, content.id, language);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					content.parentType,
					content.parentId,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should call service with correct params', async () => {
				const { content, language, mockCurrentUser } = setup();

				await uc.getH5pEditor(mockCurrentUser, content.id, language);

				expect(h5pEditor.render).toHaveBeenCalledWith(
					content.id,
					language,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
				expect(h5pEditor.getContent).toHaveBeenCalledWith(
					content.id,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
			});

			it('should return results of service', async () => {
				const { content, language, mockCurrentUser, contentResponseMock, editorResponseMock } = setup();

				const result = await uc.getH5pEditor(mockCurrentUser, content.id, language);

				expect(result).toEqual({
					content: contentResponseMock,
					editorModel: editorResponseMock,
				});
			});
		});

		describe('WHEN content does not exist', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, language } = createParams();

				h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

				return { content, mockCurrentUser, editorResponseMock, language };
			};

			it('should throw NotFoundException', async () => {
				const { content, mockCurrentUser, language } = setup();

				const getEditorPromise = uc.getH5pEditor(mockCurrentUser, content.id, language);

				await expect(getEditorPromise).rejects.toThrow(new NotFoundException());

				expect(h5pEditor.render).toHaveBeenCalledTimes(0);
				expect(h5pEditor.getContent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, contentResponseMock, language } = createParams();

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { content, mockCurrentUser, editorResponseMock, contentResponseMock, language };
			};

			it('should throw forbidden error', async () => {
				const { content, mockCurrentUser, language } = setup();

				const getEditorPromise = uc.getH5pEditor(mockCurrentUser, content.id, language);

				await expect(getEditorPromise).rejects.toThrow(new ForbiddenException());

				expect(h5pEditor.render).toHaveBeenCalledTimes(0);
				expect(h5pEditor.getContent).toHaveBeenCalledTimes(0);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser, editorResponseMock, contentResponseMock, language } = createParams();

				const error = new Error('test');

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				h5pEditor.render.mockRejectedValueOnce(error);
				h5pEditor.getContent.mockRejectedValueOnce(error);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { error, content, mockCurrentUser, editorResponseMock, contentResponseMock, language };
			};

			it('should return error of service', async () => {
				const { content, mockCurrentUser, language, error } = setup();

				const getEditorPromise = uc.getH5pEditor(mockCurrentUser, content.id, language);

				await expect(getEditorPromise).rejects.toThrow(error);
			});
		});
	});
});
