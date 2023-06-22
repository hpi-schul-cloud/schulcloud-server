import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { ICurrentUser } from '@src/modules/authentication';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { H5PEditorUc } from './h5p.uc';

const setup = () => {
	const contentId = '123456789';
	const contentIdCreate = 'create';
	const language = 'de';
	const currentUser: ICurrentUser = {
		userId: '123',
		roles: [],
		schoolId: '',
		accountId: '',
	};
	const iFrame = 'iFrame';

	return { contentId, contentIdCreate, language, currentUser, iFrame };
};

describe('get H5P editor', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pEditor: DeepMocked<H5PEditor>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				{
					provide: H5PEditor,
					useValue: createMock<H5PEditor>(),
				},
				{
					provide: H5PPlayer,
					useValue: createMock<H5PPlayer>(),
				},
				{
					provide: H5PAjaxEndpoint,
					useValue: createMock<H5PAjaxEndpoint>(),
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
			const { contentIdCreate, language, currentUser, iFrame } = setup();
			h5pEditor.render.mockResolvedValueOnce(iFrame);
			const result = await uc.getH5pEditor(currentUser, contentIdCreate, language);

			expect(result).toEqual('iFrame');
		});
	});

	describe('when contentId is given', () => {
		it('should render h5p editor', async () => {
			const { contentId, language, currentUser, iFrame } = setup();
			h5pEditor.render.mockResolvedValueOnce(iFrame);
			const result = await uc.getH5pEditor(currentUser, contentId, language);

			expect(result).toEqual('iFrame');
		});
	});

	describe('when contentId does not exist', () => {
		it('should throw an error ', async () => {
			const { contentId, language, currentUser } = setup();
			h5pEditor.render.mockRejectedValueOnce(new Error('Could not get H5P editor'));
			const result = uc.getH5pEditor(currentUser, contentId, language);

			await expect(result).rejects.toThrow();
		});
	});
});
