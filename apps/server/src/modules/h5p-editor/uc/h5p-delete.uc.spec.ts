import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { h5pContentFactory, setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
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
	};

	return { content, mockCurrentUser };
};

describe('save or create H5P content', () => {
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

	describe('deleteH5pContent is called', () => {
		describe('WHEN user is authorized and service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				h5pEditor.deleteContent.mockResolvedValueOnce();
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { content, mockCurrentUser };
			};

			it('should call authorizationClientAdapter.checkPermissionsByReference', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.deleteH5pContent(mockCurrentUser, content.id);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					content.parentType,
					content.parentId,
					AuthorizationContextBuilder.write([])
				);
			});

			it('should call service with correct params', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.deleteH5pContent(mockCurrentUser, content.id);

				expect(h5pEditor.deleteContent).toBeCalledWith(
					content.id,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
			});

			it('should return true', async () => {
				const { content, mockCurrentUser } = setup();

				const result = await uc.deleteH5pContent(mockCurrentUser, content.id);

				expect(result).toBe(true);
			});
		});

		describe('WHEN content does not exist', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

				return { content, mockCurrentUser };
			};

			it('should throw NotFoundException', async () => {
				const { content, mockCurrentUser } = setup();

				const deleteH5pContentpromise = uc.deleteH5pContent(mockCurrentUser, content.id);

				await expect(deleteH5pContentpromise).rejects.toThrow(NotFoundException);
			});
		});

		describe('WHEN user is not authorized', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockRejectedValueOnce(new ForbiddenException());

				return { content, mockCurrentUser };
			};

			it('should throw forbidden error', async () => {
				const { content, mockCurrentUser } = setup();

				const deleteH5pContentpromise = uc.deleteH5pContent(mockCurrentUser, content.id);

				await expect(deleteH5pContentpromise).rejects.toThrow(ForbiddenException);
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				const error = new Error('test');

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				h5pEditor.deleteContent.mockRejectedValueOnce(error);

				return { error, content, mockCurrentUser };
			};

			it('should return error of service', async () => {
				const { content, mockCurrentUser } = setup();

				const deleteH5pContentpromise = uc.deleteH5pContent(mockCurrentUser, content.id);

				await expect(deleteH5pContentpromise).rejects.toThrow();
			});
		});
	});
});
