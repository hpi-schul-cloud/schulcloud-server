import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { H5PEditor } from '@lumieducation/h5p-server';
import { H5PEditorTestModule } from '../h5p-editor-test.module';
import { H5PEditorUc } from './h5p.uc';

const setup = () => {
	const contentId = '123456789';
	const notExistingContentId = '999999999';
	const currentUser: ICurrentUser = {
		userId: '123',
		roles: [],
		schoolId: '',
		accountId: '',
	};
	const error = new Error('Could not delete H5P content');
	const errorThrown = new Error('Error: Could not delete H5P content');

	return {
		contentId,
		notExistingContentId,
		currentUser,
		error,
		errorThrown,
	};
};

describe('save or create H5P content', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pEditor: DeepMocked<H5PEditor>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			imports: [H5PEditorTestModule],
		})
			.overrideProvider(H5PEditor)
			.useValue(createMock<H5PEditor>())
			.compile();

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

	describe('when contentId is given', () => {
		it('should render h5p editor', async () => {
			const { contentId, currentUser } = setup();
			// h5pEditor.saveOrUpdateContentReturnMetaData.mockResolvedValue();
			const result = await uc.deleteH5pContent(currentUser, contentId);

			expect(result).toEqual(true);
		});
	});

	describe('when contentId does not exist', () => {
		it('should throw an error ', async () => {
			const { notExistingContentId, currentUser, error, errorThrown } = setup();
			h5pEditor.deleteContent.mockRejectedValueOnce(error);

			await expect(uc.deleteH5pContent(currentUser, notExistingContentId)).rejects.toThrowError(errorThrown);
		});
	});
});
