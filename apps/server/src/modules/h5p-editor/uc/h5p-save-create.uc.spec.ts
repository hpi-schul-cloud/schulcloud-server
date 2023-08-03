import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5PEditor, H5PPlayer, IContentMetadata } from '@lumieducation/h5p-server';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { UserRepo } from '@shared/repo';
import { H5PAjaxEndpointService } from '../service';
import { H5PEditorUc } from './h5p.uc';

const setup = () => {
	const contentId = '123456789';
	const notExistingContentId = '999999999';
	const id = '0000000';
	const metadata: IContentMetadata = {
		embedTypes: [],
		language: 'de',
		mainLibrary: 'mainLib',
		preloadedDependencies: [],
		defaultLanguage: '',
		license: '',
		title: '123',
	};
	const params = {};
	const mainLibraryUbername = 'mainLib';
	const currentUser: ICurrentUser = {
		userId: '123',
		roles: [],
		schoolId: '',
		accountId: '',
	};
	const error = new Error('Could not save H5P content');

	return {
		contentId,
		notExistingContentId,
		currentUser,
		params,
		metadata,
		mainLibraryUbername,
		id,
		error,
	};
};

describe('save or create H5P content', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pEditor: DeepMocked<H5PEditor>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				H5PAjaxEndpointService,
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
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pEditor = module.get(H5PEditor);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('save H5P content', () => {
		describe('when contentId is given', () => {
			it('should render h5p editor', async () => {
				const { contentId, metadata, mainLibraryUbername, params, currentUser, id } = setup();
				const result1 = { id, metadata };
				h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);
				const result = await uc.saveH5pContentGetMetadata(
					contentId,
					currentUser,
					params,
					metadata,
					mainLibraryUbername
				);

				expect(result).toEqual(result1);
			});
		});

		describe('when contentId does not exist', () => {
			it('should throw an error ', async () => {
				const { metadata, mainLibraryUbername, params, notExistingContentId, currentUser, error } = setup();
				h5pEditor.saveOrUpdateContentReturnMetaData.mockRejectedValueOnce(error);
				await expect(
					uc.saveH5pContentGetMetadata(notExistingContentId, currentUser, params, metadata, mainLibraryUbername)
				).rejects.toThrowError(error);
			});
		});
	});

	describe('create H5P content', () => {
		it('should create new h5p content', async () => {
			const { metadata, mainLibraryUbername, params, currentUser, id } = setup();
			const result1 = { id, metadata };
			h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValueOnce(result1);
			const result = await uc.createH5pContentGetMetadata(currentUser, params, metadata, mainLibraryUbername);

			expect(result).toEqual(result1);
		});
	});
});
