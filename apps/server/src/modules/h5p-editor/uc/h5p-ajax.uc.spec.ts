import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { UserDo, UserService } from '@modules/user';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
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
			const userMock: ICurrentUser = {
				userId: 'dummyId',
				roles: [],
				schoolId: 'dummySchool',
				accountId: 'dummyAccountId',
				isExternalUser: false,
				support: false,
			};

			const dummyResponse = {
				apiVersion: { major: 1, minor: 1 },
				details: [],
				libraries: [],
				outdated: false,
				recentlyUsed: [],
				user: 'DummyUser',
			};

			return {
				userMock,
				dummyResponse,
			};
		};

		it('should call H5PAjaxEndpoint.getAjax and return the result', async () => {
			const { userMock, dummyResponse } = setup();

			ajaxEndpoint.getAjax.mockResolvedValueOnce(dummyResponse);
			userService.findById.mockResolvedValueOnce({ language: LanguageType.DE } as UserDo);

			const result = await uc.getAjax({ action: 'content-type-cache' }, userMock.userId);

			expect(result).toBe(dummyResponse);
			expect(ajaxEndpoint.getAjax).toHaveBeenCalledWith(
				'content-type-cache',
				undefined, // MachineName
				undefined, // MajorVersion
				undefined, // MinorVersion
				'de',
				expect.objectContaining({ id: 'dummyId' })
			);
		});
	});

	describe('when calling POST', () => {
		const setup = () => {
			const userMock: ICurrentUser = {
				userId: 'dummyId',
				roles: [],
				schoolId: 'dummySchool',
				accountId: 'dummyAccountId',
				isExternalUser: false,
				support: false,
			};

			const dummyResponse = [
				{
					majorVersion: 1,
					minorVersion: 2,
					metadataSettings: {},
					name: 'Dummy Library',
					restricted: false,
					runnable: true,
					title: 'Dummy Library',
					tutorialUrl: '',
					uberName: 'dummyLibrary-1.1',
				},
			];

			ajaxEndpoint.postAjax.mockResolvedValueOnce(dummyResponse);

			return {
				userMock,
				dummyResponse,
			};
		};

		it('should call H5PAjaxEndpoint.postAjax and return the result', async () => {
			const { userMock, dummyResponse } = setup();

			const result = await uc.postAjax(
				userMock.userId,
				{ action: 'libraries' },
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' }
			);

			expect(result).toBe(dummyResponse);
			expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
				'libraries',
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
				'de',
				expect.objectContaining({ id: 'dummyId' }),
				undefined,
				undefined,
				undefined,
				undefined,
				undefined
			);
		});

		it('should call H5PAjaxEndpoint.postAjax with files', async () => {
			const { userMock, dummyResponse } = setup();

			const result = await uc.postAjax(
				userMock.userId,
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
			};

			expect(result).toBe(dummyResponse);
			expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
				'libraries',
				{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
				'de',
				expect.objectContaining({ id: 'dummyId' }),
				bufferTest,
				undefined,
				undefined,
				bufferTest,
				undefined
			);
		});
	});
});
