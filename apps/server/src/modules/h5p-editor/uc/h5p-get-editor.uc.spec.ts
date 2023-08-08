import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { UserRepo } from '@shared/repo';
import { H5PAjaxEndpointService } from '../service';
import { H5PEditorUc } from './h5p.uc';

const setup = () => {
	const contentId = '123456789';
	const contentIdCreate = 'create';
	const currentUser: ICurrentUser = {
		userId: '123',
		roles: [],
		schoolId: '',
		accountId: '',
	};

	const playerModel = {
		contentId,
		dependencies: [{ machineName: 'ExampleLibrary', majorVersion: 1, minorVersion: 2 }],
	};

	const editorModel = {
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	const exampleContent = {
		h5p: {},
		library: 'ExampleLib-1.0',
		params: {
			metadata: {},
			params: { anything: true },
		},
	};

	return { contentId, contentIdCreate, currentUser, playerModel, editorModel, exampleContent };
	const editorModel = {
		scripts: ['example.js'],
		styles: ['example.css'],
	};

	const exampleContent = {
		h5p: {},
		library: 'ExampleLib-1.0',
		params: {
			metadata: {},
			params: { anything: true },
		},
	};

	return { contentId, contentIdCreate, language, currentUser, playerModel, editorModel, exampleContent };
};

describe('get H5P editor', () => {
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

	describe('when value of contentId is create', () => {
		it('should render new h5p editor', async () => {
			const { currentUser, editorModel } = setup();
			h5pEditor.render.mockResolvedValueOnce(editorModel);
			const result = await uc.getEmptyH5pEditor(currentUser);
			const { language, currentUser, editorModel } = setup();
			h5pEditor.render.mockResolvedValueOnce(editorModel);
			const result = await uc.getEmptyH5pEditor(currentUser, language);

			expect(result).toEqual(editorModel);
		});
	});

	describe('when contentId is given', () => {
		it('should render h5p editor', async () => {
			const { contentId, currentUser, editorModel, exampleContent } = setup();
			h5pEditor.render.mockResolvedValueOnce(editorModel);
			// @ts-expect-error partial object
			h5pEditor.getContent.mockResolvedValueOnce(exampleContent);
			const result = await uc.getH5pEditor(currentUser, contentId);
			const { contentId, language, currentUser, editorModel, exampleContent } = setup();
			h5pEditor.render.mockResolvedValueOnce(editorModel);
			// @ts-expect-error partial object
			h5pEditor.getContent.mockResolvedValueOnce(exampleContent);
			const result = await uc.getH5pEditor(currentUser, contentId, language);

			expect(result).toEqual({ editorModel, content: exampleContent });
		});
	});

	describe('when contentId does not exist', () => {
		it('should throw an error ', async () => {
			const { contentId, currentUser } = setup();
			h5pEditor.render.mockRejectedValueOnce(new Error('Could not get H5P editor'));
			const result = uc.getH5pEditor(currentUser, contentId);

			await expect(result).rejects.toThrow();
		});
	});
});
