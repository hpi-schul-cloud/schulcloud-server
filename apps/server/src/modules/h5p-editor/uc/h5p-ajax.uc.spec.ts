import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { AuthorizationClientAdapter } from '@infra/authorization-client';
import { H5PAjaxEndpoint, H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import { IHubInfo, IUser as LumiIUser } from '@lumieducation/h5p-server/build/src/types';
import { UserService } from '@modules/user';
import { userDoFactory } from '@modules/user/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { currentUserFactory } from '@testing/factory/currentuser.factory';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { H5PEditorConfig } from '../h5p-editor.config';
import { H5PContentRepo } from '../repo';
import { LibraryStorage } from '../service';
import { H5PUploadFile } from '../types';
import { H5PEditorUc } from './h5p.uc';

jest.mock('fs', (): unknown => {
	return {
		...jest.requireActual('fs'),
		mkdtempSync: jest.fn(),
		rmSync: jest.fn(),
		unlinkSync: jest.fn(),
	};
});

jest.mock('fs/promises', (): unknown => {
	return {
		...jest.requireActual('fs/promises'),
		writeFile: jest.fn(),
	};
});

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
					provide: ConfigService,
					useValue: createMock<ConfigService<H5PEditorConfig, true>>({
						get: () => ['H5P.Accordion'],
					}),
				},
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
				{
					provide: Logger,
					useValue: createMock<Logger>(),
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
				libraries: [
					{
						machineName: 'LibraryToBeFilteredOut',
						canInstall: false,
						installed: false,
						isUpToDate: false,
						localMajorVersion: 0,
						localMinorVersion: 0,
						localPatchVersion: 0,
						restricted: false,
						description: '',
						icon: '',
						majorVersion: 0,
						minorVersion: 0,
						owner: '',
						patchVersion: 0,
						title: '',
					},
					{
						machineName: 'H5P.Accordion',
						canInstall: false,
						installed: false,
						isUpToDate: false,
						localMajorVersion: 0,
						localMinorVersion: 0,
						localPatchVersion: 0,
						restricted: false,
						description: '',
						icon: '',
						majorVersion: 0,
						minorVersion: 0,
						owner: '',
						patchVersion: 0,
						title: '',
					},
				],
				outdated: false,
				recentlyUsed: [],
				user: 'DummyUser',
			};

			const expectedResponse = { ...mockedResponse };
			expectedResponse.libraries = expectedResponse.libraries.filter(
				(library) => library.machineName === 'H5P.Accordion'
			);

			ajaxEndpoint.getAjax.mockResolvedValueOnce(mockedResponse);
			userService.findById.mockResolvedValueOnce(userDo);

			return {
				user,
				language,
				expectedResponse,
			};
		};

		it('should call H5PAjaxEndpoint.getAjax, filter out unwanted library and return the result', async () => {
			const { user, language, expectedResponse } = setup();

			const result = await uc.getAjax({ action: 'content-type-cache' }, user);

			expect(result).toStrictEqual(expectedResponse);
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
				user,
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
				user,
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

		describe('when handling SVG files', () => {
			const svgBuffer = Buffer.from('<svg><circle cx="50" cy="50" r="40"/></svg>');

			const mockTempDir = '/tmp/h5p-svg-abc123';
			const mockTempDirMatcher = expect.stringMatching(/.*h5p-svg-/) as string;

			const fileNameRegEx = '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}.svg';
			const mockTempFileMatcher = expect.stringMatching(new RegExp(`${mockTempDir}/${fileNameRegEx}$`)) as string;

			const initUserService = () => {
				const user = currentUserFactory.build();

				const language = LanguageType.DE;
				const userDo = userDoFactory.build({ id: user.userId, language });

				userService.findById.mockResolvedValueOnce(userDo);

				const mockedLumiUser: LumiIUser = {
					email: '',
					id: user.userId,
					name: '',
					type: '',
				};

				return { user, language, mockedLumiUser };
			};

			const initAjaxEndpoint = () => {
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

				ajaxEndpoint.postAjax.mockResolvedValueOnce(mockedResponse);

				return { mockedResponse };
			};

			const setup = () => {
				const { user, language, mockedLumiUser } = initUserService();
				const { mockedResponse } = initAjaxEndpoint();

				const mkdtempSyncSpy = jest.spyOn(fs, 'mkdtempSync').mockReturnValue(mockTempDir);
				const writeFileSpy = jest.spyOn(fsPromises, 'writeFile').mockResolvedValueOnce(undefined);
				const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');
				const rmSyncSpy = jest.spyOn(fs, 'rmSync');

				return {
					user,
					language,
					mockedLumiUser,
					mockedResponse,
					mkdtempSyncSpy,
					writeFileSpy,
					unlinkSyncSpy,
					rmSyncSpy,
				};
			};

			it('should handle SVG files with temporary file creation and deletion', async () => {
				const {
					user,
					language,
					mockedLumiUser,
					mockedResponse,
					mkdtempSyncSpy,
					writeFileSpy,
					unlinkSyncSpy,
					rmSyncSpy,
				} = setup();

				const result = await uc.postAjax(
					user,
					{ action: 'files' },
					{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
					{
						fieldname: 'file',
						buffer: svgBuffer,
						originalname: 'test-icon.svg',
						size: svgBuffer.length,
						mimetype: 'image/svg+xml',
					} as Express.Multer.File
				);

				const svgFileTest = expect.objectContaining({
					data: undefined,
					mimetype: 'image/svg+xml',
					name: 'test-icon.svg',
					size: svgBuffer.length,
					tempFilePath: mockTempFileMatcher,
				}) as H5PUploadFile;

				expect(mkdtempSyncSpy).toHaveBeenCalledWith(mockTempDirMatcher);
				expect(writeFileSpy).toHaveBeenCalledWith(mockTempFileMatcher, svgBuffer, 'utf8');
				expect(unlinkSyncSpy).toHaveBeenCalledWith(mockTempFileMatcher);
				expect(rmSyncSpy).toHaveBeenCalledWith(mockTempDir, { recursive: true });

				expect(result).toBe(mockedResponse);
				expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
					'files',
					{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
					language.valueOf(),
					mockedLumiUser,
					svgFileTest,
					undefined,
					undefined,
					undefined
				);
			});

			describe('when file deletion fails during clean up', () => {
				const setup = () => {
					const { user, language, mockedLumiUser } = initUserService();
					const { mockedResponse } = initAjaxEndpoint();

					const mkdtempSyncSpy = jest.spyOn(fs, 'mkdtempSync').mockReturnValue(mockTempDir);
					const writeFileSpy = jest.spyOn(fsPromises, 'writeFile').mockResolvedValueOnce(undefined);
					const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => {
						throw new Error('File deletion error');
					});
					const rmSyncSpy = jest.spyOn(fs, 'rmSync');

					return {
						user,
						language,
						mockedLumiUser,
						mockedResponse,
						mkdtempSyncSpy,
						writeFileSpy,
						unlinkSyncSpy,
						rmSyncSpy,
					};
				};

				it('should handle SVG files and attempt cleanup even when file deletion fails', async () => {
					const {
						user,
						language,
						mockedLumiUser,
						mockedResponse,
						mkdtempSyncSpy,
						writeFileSpy,
						unlinkSyncSpy,
						rmSyncSpy,
					} = setup();

					const result = await uc.postAjax(
						user,
						{ action: 'files' },
						{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
						{
							fieldname: 'file',
							buffer: svgBuffer,
							originalname: 'test-icon.svg',
							size: svgBuffer.length,
							mimetype: 'image/svg+xml',
						} as Express.Multer.File
					);

					const svgFileTest = expect.objectContaining({
						data: undefined,
						mimetype: 'image/svg+xml',
						name: 'test-icon.svg',
						size: svgBuffer.length,
						tempFilePath: mockTempFileMatcher,
					}) as H5PUploadFile;

					expect(mkdtempSyncSpy).toHaveBeenCalledWith(mockTempDirMatcher);
					expect(writeFileSpy).toHaveBeenCalledWith(mockTempFileMatcher, svgBuffer, 'utf8');
					expect(unlinkSyncSpy).toHaveBeenCalledWith(mockTempFileMatcher);
					expect(rmSyncSpy).not.toHaveBeenCalled();

					expect(result).toBe(mockedResponse);
					expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
						'files',
						{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
						language.valueOf(),
						mockedLumiUser,
						svgFileTest,
						undefined,
						undefined,
						undefined
					);
				});
			});

			describe('when folder deletion fails during clean up', () => {
				const setup = () => {
					const { user, language, mockedLumiUser } = initUserService();
					const { mockedResponse } = initAjaxEndpoint();

					const mkdtempSyncSpy = jest.spyOn(fs, 'mkdtempSync').mockReturnValue(mockTempDir);
					const writeFileSpy = jest.spyOn(fsPromises, 'writeFile').mockResolvedValueOnce(undefined);
					const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');
					const rmSyncSpy = jest.spyOn(fs, 'rmSync').mockImplementationOnce(() => {
						throw new Error('Folder deletion error');
					});

					return {
						user,
						language,
						mockedLumiUser,
						mockedResponse,
						mkdtempSyncSpy,
						writeFileSpy,
						unlinkSyncSpy,
						rmSyncSpy,
					};
				};

				it('should handle SVG files and attempt cleanup even when folder deletion fails', async () => {
					const {
						user,
						language,
						mockedLumiUser,
						mockedResponse,
						mkdtempSyncSpy,
						writeFileSpy,
						unlinkSyncSpy,
						rmSyncSpy,
					} = setup();

					const result = await uc.postAjax(
						user,
						{ action: 'files' },
						{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
						{
							fieldname: 'file',
							buffer: svgBuffer,
							originalname: 'test-icon.svg',
							size: svgBuffer.length,
							mimetype: 'image/svg+xml',
						} as Express.Multer.File
					);

					const svgFileTest = expect.objectContaining({
						data: undefined,
						mimetype: 'image/svg+xml',
						name: 'test-icon.svg',
						size: svgBuffer.length,
						tempFilePath: mockTempFileMatcher,
					}) as H5PUploadFile;

					expect(mkdtempSyncSpy).toHaveBeenCalledWith(mockTempDirMatcher);
					expect(writeFileSpy).toHaveBeenCalledWith(mockTempFileMatcher, svgBuffer, 'utf8');
					expect(unlinkSyncSpy).toHaveBeenCalledWith(mockTempFileMatcher);
					expect(rmSyncSpy).toHaveBeenCalledWith(mockTempDir, { recursive: true });

					expect(result).toBe(mockedResponse);
					expect(ajaxEndpoint.postAjax).toHaveBeenCalledWith(
						'files',
						{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
						language.valueOf(),
						mockedLumiUser,
						svgFileTest,
						undefined,
						undefined,
						undefined
					);
				});
			});

			describe('when SVG temp write fails', () => {
				const setup = () => {
					const { user } = initUserService();

					const mkdtempSyncSpy = jest.spyOn(fs, 'mkdtempSync').mockReturnValue(mockTempDir);
					const writeFileSpy = jest.spyOn(fsPromises, 'writeFile').mockRejectedValueOnce(new Error('disk write error'));
					const unlinkSyncSpy = jest.spyOn(fs, 'unlinkSync');
					const rmSyncSpy = jest.spyOn(fs, 'rmSync');

					return {
						user,
						mkdtempSyncSpy,
						writeFileSpy,
						unlinkSyncSpy,
						rmSyncSpy,
					};
				};

				it('should throw and avoid cleanup when SVG temp write fails', async () => {
					const { user, mkdtempSyncSpy, writeFileSpy, unlinkSyncSpy, rmSyncSpy } = setup();

					await expect(
						uc.postAjax(
							user,
							{ action: 'files' },
							{ contentId: 'id', field: 'field', libraries: ['dummyLibrary-1.0'], libraryParameters: '' },
							{
								fieldname: 'file',
								buffer: svgBuffer,
								originalname: 'test-icon.svg',
								size: svgBuffer.length,
								mimetype: 'image/svg+xml',
							} as Express.Multer.File
						)
					).rejects.toThrow(InternalServerErrorException);

					expect(mkdtempSyncSpy).toHaveBeenCalledWith(mockTempDirMatcher);
					expect(writeFileSpy).toHaveBeenCalledWith(mockTempFileMatcher, svgBuffer, 'utf8');
					expect(unlinkSyncSpy).not.toHaveBeenCalled();
					expect(rmSyncSpy).not.toHaveBeenCalled();

					expect(ajaxEndpoint.postAjax).not.toHaveBeenCalled();
				});
			});
		});
	});
});
