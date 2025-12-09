import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { IHubInfo, IUser as LumiIUser } from '@lumieducation/h5p-server/build/src/types';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PEditorUc } from './h5p.uc';

describe(`${H5PEditorUc.name} Ajax`, () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let ajaxEndpoint: DeepMocked<H5PAjaxEndpoint>;
	let userService: DeepMocked<UserService>;

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
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: H5PAjaxEndpoint,
					useValue: createMock<H5PAjaxEndpoint>(),
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
		ajaxEndpoint = module.get(H5PAjaxEndpoint);
		userService = module.get(UserService);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when calling GET', () => {
		const setup = () => {
			const user = currentUserFactory.build();

			const language = LanguageType.DE;
			const userDo = userDoFactory.build({ id: user.userId, language });

			const mockedResponse: IHubInfo = {
				apiVersion: { major: 1, minor: 1 },
				details: [],
				libraries: [],
				outdated: false,
				recentlyUsed: [],
				user: 'DummyUser',
			};

			ajaxEndpoint.getAjax.mockResolvedValueOnce(mockedResponse);
			userService.findById.mockResolvedValueOnce(userDo);

			return {
				user,
				language,
				mockedResponse,
			};
		};

		it('should call H5PAjaxEndpoint.getAjax and return the result', async () => {
			const { user, language, mockedResponse } = setup();

			const result = await uc.getAjax({ action: 'content-type-cache' }, user.userId);

			expect(result).toBe(mockedResponse);
			expect(ajaxEndpoint.getAjax).toHaveBeenCalledWith(
				'content-type-cache',
				undefined, // MachineName
				undefined, // MajorVersion
				undefined, // MinorVersion
				language.valueOf(),
				expect.objectContaining({ id: user.userId })
			);
		});
	});

	describe('when calling POST', () => {
		const setup = () => {
			const user = currentUserFactory.build();

			const language = LanguageType.DE;
			const userDo = userDoFactory.build({ id: user.userId, language });

			const mockedResponse = [
				{
					majorVersion: 1,
					minorVersion: 2,
					metadataSettings: {},
					name: 'Dummy Library',
					restricted: false,
					runnable: true,
					title: 'Dummy Library',
					tutorialUrl: '',
					uberName: 'dummyLibrary-1.0',
				},
			];

			const mockedLumiUser: LumiIUser = {
				email: '',
				id: user.userId,
				name: '',
				type: '',
			};

			ajaxEndpoint.postAjax.mockResolvedValueOnce(mockedResponse);
			userService.findById.mockResolvedValueOnce(userDo);

			return {
				user,
				language,
				mockedLumiUser,
				mockedResponse,
			};
		};

		it('should call H5PAjaxEndpoint.postAjax and return the result', async () => {
			const { user, language, mockedLumiUser, mockedResponse } = setup();

			const result = await uc.postAjax(
				user.userId,
				{ action: 'libraries' },
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' }
			);

			expect(result).toBe(mockedResponse);
			expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
				'libraries',
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
				language.valueOf(),
				mockedLumiUser,
				undefined,
				undefined,
				undefined,
				undefined
			);
		});

		it('should call H5PAjaxEndpoint.postAjax with files', async () => {
			const { user, language, mockedLumiUser, mockedResponse } = setup();

			const result = await uc.postAjax(
				user.userId,
				{ action: 'libraries' },
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
				{
					fieldname: 'file',
					buffer: Buffer.from(''),
					originalname: 'OriginalFile.jpg',
					size: 0,
					mimetype: 'image/jpg',
				} as Express.Multer.File,
				{
					fieldname: 'h5p',
					buffer: Buffer.from(''),
					originalname: 'OriginalFile.jpg',
					size: 0,
					mimetype: 'image/jpg',
				} as Express.Multer.File
			);

			const bufferTest = {
				data: expect.any(Buffer),
				mimetype: 'image/jpg',
				name: 'OriginalFile.jpg',
				size: 0,
				tempFilePath: 'unknown.type',
			};

			expect(result).toBe(mockedResponse);
			expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
				'libraries',
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
				language.valueOf(),
				mockedLumiUser,
				bufferTest,
				undefined,
				undefined,
				bufferTest
			);
		});
	});
});
