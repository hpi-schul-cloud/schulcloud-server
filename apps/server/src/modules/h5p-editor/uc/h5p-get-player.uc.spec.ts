import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { UserService } from '@src/modules';
import { ICurrentUser } from '@src/modules/authentication';
import { H5PAjaxEndpointService, LibraryStorage } from '../service';
import { H5PEditorUc } from './h5p.uc';

const setup = () => {
	const contentId = '123456789';
	const notExistingContentId = '0000';
	const currentUser: ICurrentUser = {
		userId: '123',
		roles: [],
		schoolId: '',
		accountId: '',
	};
	const htmlString = 'htmlString';

	return { contentId, notExistingContentId, currentUser, htmlString };
};

describe('get H5P player', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let h5pPlayer: DeepMocked<H5PPlayer>;

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
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		h5pPlayer = module.get(H5PPlayer);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when contentId is given', () => {
		it('should render h5p player', async () => {
			const { contentId, currentUser, htmlString } = setup();
			h5pPlayer.render.mockResolvedValueOnce(htmlString);
			const result = await uc.getH5pPlayer(currentUser, contentId);

			expect(result).toEqual('htmlString');
		});
	});

	describe('when contentId does not exist', () => {
		it('should throw an error', async () => {
			const { notExistingContentId, currentUser } = setup();
			h5pPlayer.render.mockRejectedValueOnce(new Error('Could not get H5P player'));
			const result = uc.getH5pPlayer(currentUser, notExistingContentId);

			await expect(result).rejects.toThrow();
		});
	});
});
