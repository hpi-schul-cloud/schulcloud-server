import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { ICurrentUser } from '@infra/auth-guard';
import { AuthorizationClientAdapter, AuthorizationContextBuilder } from '@infra/authorization-client';
import { H5PAjaxEndpoint, H5PEditor, IPlayerModel } from '@lumieducation/h5p-server';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { h5pContentFactory, setupEntities } from '@shared/testing';
import { UserService } from '@src/modules/user';
import { Request } from 'express';
import { Readable } from 'stream';
import { H5PEditorProvider, H5PPlayerProvider } from '../provider';
import { H5PContentRepo } from '../repo';
import { ContentStorage, LibraryStorage } from '../service';
import { TemporaryFileStorage } from '../service/temporary-file-storage.service';
import { H5PEditorUc } from './h5p.uc';

const createParams = () => {
	const content = h5pContentFactory.build();

	const mockCurrentUser: ICurrentUser = {
		accountId: 'mockAccountId',
		roles: ['student'],
		schoolId: 'mockSchoolId',
		userId: 'mockUserId',
		isExternalUser: false,
		impersonated: false,
	};

	const mockContentParameters: Awaited<ReturnType<H5PEditor['getContent']>> = {
		h5p: content.metadata,
		library: content.metadata.mainLibrary,
		params: {
			metadata: content.metadata,
			params: content.content,
		},
	};

	const playerResponseMock = expect.objectContaining({
		contentId: content.id,
	}) as IPlayerModel;

	return { content, mockCurrentUser, playerResponseMock, mockContentParameters };
};

describe('H5P Files', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let libraryStorage: DeepMocked<LibraryStorage>;
	let ajaxEndpointService: DeepMocked<H5PAjaxEndpoint>;
	let h5pContentRepo: DeepMocked<H5PContentRepo>;
	let authorizationClientAdapter: DeepMocked<AuthorizationClientAdapter>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				H5PEditorProvider,
				H5PPlayerProvider,
				{
					provide: H5PAjaxEndpoint,
					useValue: createMock<H5PAjaxEndpoint>(),
				},
				{
					provide: ContentStorage,
					useValue: createMock<ContentStorage>(),
				},
				{
					provide: LibraryStorage,
					useValue: createMock<LibraryStorage>(),
				},
				{
					provide: TemporaryFileStorage,
					useValue: createMock<TemporaryFileStorage>(),
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
		libraryStorage = module.get(LibraryStorage);
		ajaxEndpointService = module.get(H5PAjaxEndpoint);
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

	describe('getContentParameters is called', () => {
		describe('WHEN user is authorized and service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				ajaxEndpointService.getContentParameters.mockResolvedValueOnce(mockContentParameters);
				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				return { content, mockCurrentUser, mockContentParameters };
			};

			it('should call authorizationClientAdapter.checkPermissionsByReference', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.getContentParameters(content.id, mockCurrentUser);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					content.parentType,
					content.parentId,
					AuthorizationContextBuilder.read([])
				);
			});

			it('should call service with correct params', async () => {
				const { content, mockCurrentUser } = setup();

				await uc.getContentParameters(content.id, mockCurrentUser);

				expect(ajaxEndpointService.getContentParameters).toHaveBeenCalledWith(
					content.id,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					})
				);
			});

			it('should return results of service', async () => {
				const { mockCurrentUser, content, mockContentParameters } = setup();

				const result = await uc.getContentParameters(content.id, mockCurrentUser);

				expect(result).toEqual(mockContentParameters);
			});
		});

		describe('WHEN content does not exist', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

				return { content, mockCurrentUser };
			};

			it('should throw NotFoundException', async () => {
				const { mockCurrentUser, content } = setup();

				const getContentParametersPromise = uc.getContentParameters(content.id, mockCurrentUser);

				await expect(getContentParametersPromise).rejects.toThrow(new NotFoundException());
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
				const { mockCurrentUser, content } = setup();

				const getContentParametersPromise = uc.getContentParameters(content.id, mockCurrentUser);

				await expect(getContentParametersPromise).rejects.toThrow(new ForbiddenException());
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser } = createParams();

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();
				ajaxEndpointService.getContentParameters.mockRejectedValueOnce(new Error('test'));

				return { content, mockCurrentUser };
			};

			it('should return NotFoundException', async () => {
				const { mockCurrentUser, content } = setup();

				const getContentParametersPromise = uc.getContentParameters(content.id, mockCurrentUser);

				await expect(getContentParametersPromise).rejects.toThrow(new NotFoundException());
			});
		});
	});

	describe('getContentFile is called', () => {
		describe('WHEN user is authorized and service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const fileResponseMock = createMock<Awaited<ReturnType<H5PAjaxEndpoint['getContentFile']>>>();
				const requestMock = createMock<Request>({
					range: () => undefined,
				});
				// Mock partial implementation so that range callback gets called
				ajaxEndpointService.getContentFile.mockImplementationOnce((contentId, filename, user, rangeCallback) => {
					rangeCallback?.(100);
					return Promise.resolve(fileResponseMock);
				});

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				const filename = 'test/file.txt';

				return { content, filename, fileResponseMock, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should call authorizationService.checkPermissionByReferences', async () => {
				const { content, filename, requestMock, mockCurrentUser } = setup();

				await uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				expect(authorizationClientAdapter.checkPermissionsByReference).toBeCalledWith(
					content.parentType,
					content.parentId,
					AuthorizationContextBuilder.read([])
				);
			});

			it('should call service with correct params', async () => {
				const { content, mockCurrentUser, filename, requestMock } = setup();

				await uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				expect(ajaxEndpointService.getContentFile).toHaveBeenCalledWith(
					content.id,
					filename,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					}),
					expect.any(Function)
				);
			});

			it('should return results of service', async () => {
				const { mockCurrentUser, fileResponseMock, filename, requestMock, content } = setup();

				const result = await uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				expect(result).toEqual({
					data: fileResponseMock.stream,
					contentType: fileResponseMock.mimetype,
					contentLength: fileResponseMock.stats.size,
					contentRange: fileResponseMock.range,
				});
			});
		});

		describe('WHEN user is authorized and a range is requested', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const range = { start: 0, end: 100 };

				const requestMock = createMock<Request>({
					// @ts-expect-error partial types cause error
					range: () => [range],
				});

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				ajaxEndpointService.getContentFile.mockImplementationOnce((contentId, filename, user, rangeCallback) => {
					const parsedRange = rangeCallback?.(100);
					if (!parsedRange) throw new Error('no range');
					return Promise.resolve({
						range: parsedRange,
						mimetype: '',
						stats: { birthtime: new Date(), size: 100 },
						stream: createMock<Readable>(),
					});
				});
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				const filename = 'test/file.txt';

				return { range, content, filename, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should return parsed range', async () => {
				const { mockCurrentUser, range, content, filename, requestMock } = setup();

				const result = await uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				expect(result.contentRange).toEqual(range);
			});
		});

		describe('WHEN user is authorized but content range is bad', () => {
			const setup = (rangeResponse?: { start: number; end: number }[] | -1 | -2) => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>({
					// @ts-expect-error partial types cause error
					range() {
						return rangeResponse;
					},
				});

				h5pContentRepo.findById.mockResolvedValueOnce(content);
				ajaxEndpointService.getContentFile.mockImplementationOnce((contentId, filename, user, rangeCallback) => {
					rangeCallback?.(100);
					return createMock();
				});
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				const filename = 'test/file.txt';

				return { content, filename, requestMock, mockCurrentUser, mockContentParameters };
			};

			describe('WHEN content range is invalid', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock, content } = setup(-2);

					const getContentFilePromise = uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

					await expect(getContentFilePromise).rejects.toThrow(NotFoundException);
				});
			});

			describe('WHEN content range is unsatisfiable', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock, content } = setup(-1);

					const getContentFilePromise = uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

					await expect(getContentFilePromise).rejects.toThrow(NotFoundException);
				});
			});

			describe('WHEN content range is multipart', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock, content } = setup([
						{ start: 0, end: 1 },
						{ start: 2, end: 3 },
					]);

					const getContentFilePromise = uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

					await expect(getContentFilePromise).rejects.toThrow(NotFoundException);
				});
			});
		});

		describe('WHEN user is authorized but content does not exist', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>();
				const fileResponseMock = createMock<Awaited<ReturnType<H5PAjaxEndpoint['getContentFile']>>>();

				h5pContentRepo.findById.mockRejectedValueOnce(new NotFoundException());

				const filename = 'test/file.txt';

				return { content, filename, fileResponseMock, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should return error of service', async () => {
				const { mockCurrentUser, filename, requestMock, content } = setup();

				const getContentFilePromise = uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				await expect(getContentFilePromise).rejects.toThrow(NotFoundException);
			});
		});

		describe('WHEN user is authorized but service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>();
				const fileResponseMock = createMock<Awaited<ReturnType<H5PAjaxEndpoint['getContentFile']>>>();

				ajaxEndpointService.getContentFile.mockRejectedValueOnce(new Error('test'));
				h5pContentRepo.findById.mockResolvedValueOnce(content);
				authorizationClientAdapter.checkPermissionsByReference.mockResolvedValueOnce();

				const filename = 'test/file.txt';

				return { content, filename, fileResponseMock, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should return error of service', async () => {
				const { mockCurrentUser, filename, requestMock, content } = setup();

				const getContentFilePromise = uc.getContentFile(content.id, filename, requestMock, mockCurrentUser);

				await expect(getContentFilePromise).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('getLibraryFile is called', () => {
		describe('WHEN service executes successfully', () => {
			const setup = () => {
				const fileResponseMock = createMock<Awaited<ReturnType<LibraryStorage['getLibraryFile']>>>();

				libraryStorage.getLibraryFile.mockResolvedValueOnce(fileResponseMock);

				const ubername = 'H5P.Test-1.0';
				const filename = 'test/file.txt';

				return { ubername, filename, fileResponseMock };
			};

			it('should call service with correct params', async () => {
				const { ubername, filename } = setup();

				await uc.getLibraryFile(ubername, filename);

				expect(libraryStorage.getLibraryFile).toHaveBeenCalledWith(ubername, filename);
			});

			it('should return results of service', async () => {
				const { ubername, filename, fileResponseMock } = setup();

				const result = await uc.getLibraryFile(ubername, filename);

				expect(result).toEqual({
					data: fileResponseMock.stream,
					contentType: fileResponseMock.mimetype,
					contentLength: fileResponseMock.size,
				});
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				libraryStorage.getLibraryFile.mockRejectedValueOnce(new Error('test'));

				const ubername = 'H5P.Test-1.0';
				const filename = 'test/file.txt';

				return { ubername, filename };
			};

			it('should return NotFoundException', async () => {
				const { ubername, filename } = setup();

				const getLibraryFilePromise = uc.getLibraryFile(ubername, filename);

				await expect(getLibraryFilePromise).rejects.toThrow(NotFoundException);
			});
		});
	});

	describe('getTemporaryFile is called', () => {
		describe('WHEN service executes successfully', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>();
				const fileResponseMock = createMock<Awaited<ReturnType<H5PAjaxEndpoint['getTemporaryFile']>>>();

				ajaxEndpointService.getTemporaryFile.mockResolvedValueOnce(fileResponseMock);

				const filename = 'test/file.txt';

				return { content, filename, fileResponseMock, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should call service with correct params', async () => {
				const { mockCurrentUser, filename, requestMock } = setup();

				await uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

				expect(ajaxEndpointService.getTemporaryFile).toHaveBeenCalledWith(
					filename,
					expect.objectContaining({
						id: mockCurrentUser.userId,
					}),
					expect.any(Function)
				);
			});

			it('should return results of service', async () => {
				const { mockCurrentUser, fileResponseMock, filename, requestMock } = setup();

				const result = await uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

				expect(result).toEqual({
					data: fileResponseMock.stream,
					contentType: fileResponseMock.mimetype,
					contentLength: fileResponseMock.stats.size,
					contentRange: fileResponseMock.range,
				});
			});
		});

		describe('WHEN content range is bad', () => {
			const setup = (rangeResponse?: { start: number; end: number }[] | -1 | -2) => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>({
					// @ts-expect-error partial types cause error
					range() {
						return rangeResponse;
					},
				});

				ajaxEndpointService.getTemporaryFile.mockImplementationOnce((filename, user, rangeCallback) => {
					rangeCallback?.(100);
					return createMock();
				});
				const filename = 'test/file.txt';

				return { content, filename, requestMock, mockCurrentUser, mockContentParameters };
			};

			describe('WHEN content range is invalid', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock } = setup(-2);

					const getTemporaryFilePromise = uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

					await expect(getTemporaryFilePromise).rejects.toThrow(NotFoundException);
				});
			});

			describe('WHEN content range is unsatisfiable', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock } = setup(-1);

					const getTemporaryFilePromise = uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

					await expect(getTemporaryFilePromise).rejects.toThrow(NotFoundException);
				});
			});

			describe('WHEN content range is multipart', () => {
				it('should throw NotFoundException', async () => {
					const { mockCurrentUser, filename, requestMock } = setup([
						{ start: 0, end: 1 },
						{ start: 2, end: 3 },
					]);

					const getTemporaryFilePromise = uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

					await expect(getTemporaryFilePromise).rejects.toThrow(NotFoundException);
				});
			});
		});

		describe('WHEN service throws error', () => {
			const setup = () => {
				const { content, mockCurrentUser, mockContentParameters } = createParams();

				const requestMock = createMock<Request>();

				ajaxEndpointService.getTemporaryFile.mockRejectedValueOnce(new Error('test'));

				const filename = 'test/file.txt';

				return { content, filename, requestMock, mockCurrentUser, mockContentParameters };
			};

			it('should return error of service', async () => {
				const { mockCurrentUser, filename, requestMock } = setup();

				const getTemporaryFilePromise = uc.getTemporaryFile(filename, requestMock, mockCurrentUser);

				await expect(getTemporaryFilePromise).rejects.toThrow(NotFoundException);
			});
		});
	});
});
