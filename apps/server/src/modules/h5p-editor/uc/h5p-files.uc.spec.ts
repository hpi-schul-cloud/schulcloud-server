import { DeepMocked, createMock } from '@golevelup/ts-jest';
import { ContentMetadata } from '@lumieducation/h5p-server/build/src/ContentMetadata';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities } from '@shared/testing';
import { Request } from 'express';
import { Readable } from 'stream';
import { UserRepo } from '@shared/repo';
import { H5PEditorUc } from './h5p.uc';
import { ContentStorage } from '../contentStorage/contentStorage';
import { LibraryStorage } from '../libraryStorage/libraryStorage';
import { TemporaryFileStorage } from '../temporary-file-storage/temporary-file-storage';
import { H5PAjaxEndpointService, H5PEditorService, H5PPlayerService } from '../service';

describe('H5P Files', () => {
	let module: TestingModule;
	let uc: H5PEditorUc;
	let contentStorage: DeepMocked<ContentStorage>;
	let libraryStorage: DeepMocked<LibraryStorage>;
	let temporaryStorage: DeepMocked<TemporaryFileStorage>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				H5PEditorUc,
				H5PEditorService,
				H5PPlayerService,
				H5PAjaxEndpointService,
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
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
			],
		}).compile();

		uc = module.get(H5PEditorUc);
		contentStorage = module.get(ContentStorage);
		libraryStorage = module.get(LibraryStorage);
		temporaryStorage = module.get(TemporaryFileStorage);
		await setupEntities();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	describe('when getting content parameters', () => {
		const userMock = { userId: 'dummyId', roles: [], schoolId: 'dummySchool', accountId: 'dummyAccountId' };

		it('should call ContentStorage and return the result', async () => {
			const dummyMetadata = new ContentMetadata();
			const dummyParams = { name: 'Dummy' };

			contentStorage.getMetadata.mockResolvedValueOnce(dummyMetadata);
			contentStorage.getParameters.mockResolvedValueOnce(dummyParams);

			const result = await uc.getContentParameters('dummylib-1.0', userMock);

			expect(result).toEqual({
				h5p: dummyMetadata,
				params: { metadata: dummyMetadata, params: dummyParams },
			});
		});

		it('should throw an error if the content does not exist', async () => {
			contentStorage.getMetadata.mockRejectedValueOnce(new Error('Could not get Metadata'));
			contentStorage.getParameters.mockRejectedValueOnce(new Error('Could not get Parameters'));

			const result = uc.getContentParameters('dummylib-1.0', userMock);

			await expect(result).rejects.toThrow();
		});
	});

	describe('when getting content file', () => {
		const setup = (
			contentId: string,
			filename: string,
			content: string,
			rangeCallbackReturnValue?: { start: number; end: number }[] | -1 | -2
		) => {
			const fileDate = new Date();

			const readableContent = Readable.from(content);
			const contentLength = content.length;

			let contentRange: { start: number; end: number } | undefined;
			if (rangeCallbackReturnValue && rangeCallbackReturnValue !== -1 && rangeCallbackReturnValue !== -2) {
				contentRange = rangeCallbackReturnValue[0];
			}

			contentStorage.getFileStats.mockResolvedValueOnce({ birthtime: fileDate, size: contentLength });
			contentStorage.getFileStream.mockResolvedValueOnce(readableContent);

			const requestMock = {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				range: (size: number) => rangeCallbackReturnValue,
			} as Request;

			const userMock = { userId: 'dummyId', roles: [], schoolId: 'dummySchool', accountId: 'dummyAccountId' };

			return { contentId, filename, requestMock, contentRange, contentLength, readableContent, userMock };
		};

		it('should call ContentStorage and return the result', async () => {
			const { contentId, filename, requestMock, contentLength, contentRange, readableContent, userMock } = setup(
				'DummyId',
				'dummy-file.jpg',
				'File Content'
			);

			const result = await uc.getContentFile(contentId, filename, requestMock, userMock);

			expect(result).toStrictEqual({
				data: readableContent,
				contentType: 'image/jpeg',
				contentLength,
				contentRange,
			});

			expect(contentStorage.getFileStats).toHaveBeenCalledWith(
				contentId,
				filename,
				expect.objectContaining({ id: 'dummyId' })
			);
			expect(contentStorage.getFileStream).toHaveBeenCalledWith(
				contentId,
				filename,
				expect.objectContaining({ id: 'dummyId' }),
				contentRange?.start,
				contentRange?.end
			);
		});

		it('should accept ranges', async () => {
			const content = 'File Content';

			const { contentId, filename, requestMock, contentLength, contentRange, readableContent, userMock } = setup(
				'DummyId',
				'dummy-file.jpg',
				content,
				[{ start: 0, end: content.length }]
			);

			const result = await uc.getContentFile(contentId, filename, requestMock, userMock);

			expect(result).toStrictEqual({
				data: readableContent,
				contentType: 'image/jpeg',
				contentLength,
				contentRange,
			});

			expect(contentStorage.getFileStats).toHaveBeenCalledWith(
				contentId,
				filename,
				expect.objectContaining({ id: 'dummyId' })
			);
			expect(contentStorage.getFileStream).toHaveBeenCalledWith(
				contentId,
				filename,
				expect.objectContaining({ id: 'dummyId' }),
				contentRange?.start,
				contentRange?.end
			);
		});

		it('should fail on invalid ranges', async () => {
			const { contentId, filename, requestMock, userMock } = setup('DummyId', 'dummy-file.jpg', 'File Content', -2);
			const result = uc.getContentFile(contentId, filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});

		it('should fail on unsatisfiable ranges', async () => {
			const { contentId, filename, requestMock, userMock } = setup('DummyId', 'dummy-file.jpg', 'File Content', -1);
			const result = uc.getContentFile(contentId, filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});

		it('should fail on multipart ranges', async () => {
			const { contentId, filename, requestMock, userMock } = setup('DummyId', 'dummy-file.jpg', 'File Content', [
				{ start: 0, end: 5 },
				{ start: 8, end: 12 },
			]);
			const result = uc.getContentFile(contentId, filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});
	});

	describe('when getting library file', () => {
		const setup = (ubername: string, filename: string, content: string) => {
			const fileDate = new Date();

			const readableContent = Readable.from(content);
			const contentLength = content.length;
			libraryStorage.getFileStats.mockResolvedValueOnce({ birthtime: fileDate, size: contentLength });
			libraryStorage.getFileStream.mockResolvedValueOnce(readableContent);

			return { ubername, filename, contentLength, readableContent };
		};

		it('should call LibraryStorage and return the result', async () => {
			const { ubername, filename, contentLength, readableContent } = setup(
				'H5P.Example-1.0',
				'dummy-file.jpg',
				'File Content'
			);

			const result = await uc.getLibraryFile(ubername, filename);

			expect(result).toStrictEqual({
				data: readableContent,
				contentType: 'image/jpeg',
				contentLength,
			});

			expect(libraryStorage.getFileStats).toHaveBeenCalledWith(
				{ machineName: 'H5P.Example', majorVersion: 1, minorVersion: 0 },
				'dummy-file.jpg'
			);
			expect(libraryStorage.getFileStream).toHaveBeenCalledWith(
				{ machineName: 'H5P.Example', majorVersion: 1, minorVersion: 0 },
				'dummy-file.jpg'
			);
		});
	});

	describe('when getting temporary file', () => {
		const setup = (
			filename: string,
			content: string,
			rangeCallbackReturnValue?: { start: number; end: number }[] | -1 | -2
		) => {
			const fileDate = new Date();

			const readableContent = Readable.from(content);
			const contentLength = content.length;

			let contentRange: { start: number; end: number } | undefined;
			if (rangeCallbackReturnValue && rangeCallbackReturnValue !== -1 && rangeCallbackReturnValue !== -2) {
				contentRange = rangeCallbackReturnValue[0];
			}

			temporaryStorage.getFileStats.mockResolvedValueOnce({ birthtime: fileDate, size: contentLength });
			temporaryStorage.getFileStream.mockResolvedValueOnce(readableContent);

			const requestMock = {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				range: (size: number) => rangeCallbackReturnValue,
			} as Request;

			const userMock = { userId: 'dummyId', roles: [], schoolId: 'dummySchool', accountId: 'dummyAccountId' };

			return { filename, requestMock, contentRange, contentLength, readableContent, userMock };
		};

		it('should call ContentStorage and return the result', async () => {
			const { filename, requestMock, contentLength, contentRange, readableContent, userMock } = setup(
				'dummy-file.jpg',
				'File Content'
			);

			const result = await uc.getTemporaryFile(filename, requestMock, userMock);

			expect(result).toStrictEqual({
				data: readableContent,
				contentType: 'image/jpeg',
				contentLength,
				contentRange,
			});

			expect(temporaryStorage.getFileStats).toHaveBeenCalledWith(filename, expect.objectContaining({ id: 'dummyId' }));
			expect(temporaryStorage.getFileStream).toHaveBeenCalledWith(
				filename,
				expect.objectContaining({ id: 'dummyId' }),
				contentRange?.start,
				contentRange?.end
			);
		});

		it('should accept ranges', async () => {
			const content = 'File Content';

			const { filename, requestMock, contentLength, contentRange, readableContent, userMock } = setup(
				'dummy-file.jpg',
				content,
				[{ start: 0, end: content.length }]
			);

			const result = await uc.getTemporaryFile(filename, requestMock, userMock);

			expect(result).toStrictEqual({
				data: readableContent,
				contentType: 'image/jpeg',
				contentLength,
				contentRange,
			});

			expect(temporaryStorage.getFileStats).toHaveBeenCalledWith(filename, expect.objectContaining({ id: 'dummyId' }));
			expect(temporaryStorage.getFileStream).toHaveBeenCalledWith(
				filename,
				expect.objectContaining({ id: 'dummyId' }),
				contentRange?.start,
				contentRange?.end
			);
		});

		it('should fail on invalid ranges', async () => {
			const { filename, requestMock, userMock } = setup('dummy-file.jpg', 'File Content', -2);
			const result = uc.getTemporaryFile(filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});

		it('should fail on unsatisfiable ranges', async () => {
			const { filename, requestMock, userMock } = setup('dummy-file.jpg', 'File Content', -2);
			const result = uc.getTemporaryFile(filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});

		it('should fail on multipart ranges', async () => {
			const { filename, requestMock, userMock } = setup('dummy-file.jpg', 'File Content', [
				{ start: 0, end: 5 },
				{ start: 8, end: 12 },
			]);
			const result = uc.getTemporaryFile(filename, requestMock, userMock);
			await expect(result).rejects.toThrow();
		});
	});
});
