import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5PEditor, H5PPlayer, IPlayerModel } from '@lumieducation/h5p-server';
import { Test, TestingModule } from '@nestjs/testing';
import { h5pContentFactory, setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthorizationContextBuilder, AuthorizationReferenceService } from '@src/modules/authorization/domain';
import { UserService } from '@src/modules/user';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PAjaxEndpointProvider } from '../provider';
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

	const playerResponseMock = expect.objectContaining({
		contentId: content.id,
	}) as IPlayerModel;

	return { content, mockCurrentUser, playerResponseMock };
};

describe('get H5P player', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pPlayer: DeepMocked<H5PPlayer>;
	let h5pContentRepo: DeepMocked<H5PContentRepo>;
	let authorizationReferenceService: DeepMocked<AuthorizationReferenceService>;

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
					provide: AuthorizationReferenceService,
					useValue: createMock<AuthorizationReferenceService>(),
				},
				{
					provide: H5PContentRepo,
					useValue: createMock<H5PContentRepo>(),
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pPlayer = module.get(H5PPlayer);
		h5pContentRepo = module.get(H5PContentRepo);
		authorizationReferenceService = module.get(AuthorizationReferenceService);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('getH5pPlayer is called', () => {
		describe('WHEN user is authorized and service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, playerResponseMock } = createParams();

				const expectedResult = playerResponseMock;

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				h5pPlayer.render.mockResolvedValueOnce(expectedResult);
				authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();

				return { content, mockCurrentUser, expectedResult };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.getH5pPlayer(mockCurrentUser, content.id);

				expect(authorizationReferenceService.checkPermissionByReferences).toBeCalledWith(
					mockCurrentUser.userId,
					content.parentType,
					content.parentId,
					AuthorizationContextBuilder.read([])
				);
			});

			it('should call service with correct params', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.getH5pPlayer(mockCurrentUser, content.id);

				expect(h5pPlayer.render).toHaveBeenCalledWith(
					content.id,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
			});

			it('should return results of service', async () => {
				const { content, mockCurrentUser, expectedResult } = setup();

				const result = await uc.getH5pPlayer(mockCurrentUser, content.id);

				expect(result).toEqual(expectedResult);
			});
		});
	});

	describe('WHEN content does not exist', () => {
		const setup = () => {
			const { content, mockCurrentUser, playerResponseMock } = createParams();

			h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

			return { content, mockCurrentUser, playerResponseMock };
		};

		it('should throw NotFoundException', async () => {
			const { content, mockCurrentUser } = setup();

			const getPlayerPromise = uc.getH5pPlayer(mockCurrentUser, content.id);

			await expect(getPlayerPromise).rejects.toThrow(new NotFoundException());

			expect(h5pPlayer.render).toHaveBeenCalledTimes(0);
		});
	});

	describe('WHEN user is not authorized', () => {
		const setup = () => {
			const { content, mockCurrentUser, playerResponseMock } = createParams();

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationReferenceService.checkPermissionByReferences.mockRejectedValueOnce(new ForbiddenException());

			return { content, mockCurrentUser, playerResponseMock };
		};

		it('should throw forbidden error', async () => {
			const { content, mockCurrentUser } = setup();

			const getPlayerPromise = uc.getH5pPlayer(mockCurrentUser, content.id);

			await expect(getPlayerPromise).rejects.toThrow(new ForbiddenException());

			expect(h5pPlayer.render).toHaveBeenCalledTimes(0);
		});
	});

	describe('WHEN service throws error', () => {
		const setup = () => {
			const { content, mockCurrentUser, playerResponseMock } = createParams();

			const error = new Error('test');

			h5pContentRepo.findById.mockResolvedValueOnce(content);
			authorizationReferenceService.checkPermissionByReferences.mockResolvedValueOnce();
			h5pPlayer.render.mockRejectedValueOnce(error);

			return { error, content, mockCurrentUser, playerResponseMock };
		};

		it('should return error of service', async () => {
			const { error, content, mockCurrentUser } = setup();

			const getPlayerPromise = uc.getH5pPlayer(mockCurrentUser, content.id);

			await expect(getPlayerPromise).rejects.toThrow(error);
		});
	});
});
