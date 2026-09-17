import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Archiver } from 'archiver';
import AdmZip from 'adm-zip';
import { PassThrough, Readable } from 'node:stream';
import { fileDomainFactory } from '../testing';
import { DownloadArchiveService } from './download-archive.service';
import { ArchiveFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';
import { SkipFileLoggable } from './loggable/skip-file.loggable';
import { ZipSizeCalculator } from './zip-size.calculator';

const flushPromises = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const createMockArchive = (): DeepMocked<Archiver> => {
	const mock = createMock<Archiver>();
	mock.once.mockImplementation((event: string | symbol, listener: (...args: unknown[]) => void) => {
		if (event === 'entry') {
			queueMicrotask(() => listener());
		}
		return mock;
	});
	return mock;
};

const createMockArchiveWithError = (error: Error): DeepMocked<Archiver> => {
	const mock = createMock<Archiver>();
	mock.once.mockImplementation((event: string | symbol, listener: (...args: unknown[]) => void) => {
		if (event === 'error') {
			queueMicrotask(() => listener(error));
		}
		return mock;
	});
	return mock;
};

describe('DownloadArchiveService', () => {
	let service: DownloadArchiveService;
	let legacyFileStorageAdapter: DeepMocked<LegacyFileStorageAdapter>;
	let logger: { setContext: jest.Mock; warning: jest.Mock; debug: jest.Mock };
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DownloadArchiveService,
				{
					provide: Logger,
					useValue: {
						setContext: jest.fn(),
						warning: jest.fn(),
						debug: jest.fn(),
					},
				},
				{
					provide: LegacyFileStorageAdapter,
					useValue: createMock<LegacyFileStorageAdapter>(),
				},
			],
		}).compile();

		service = module.get(DownloadArchiveService);
		legacyFileStorageAdapter = module.get(LegacyFileStorageAdapter);
		logger = module.get(Logger) as unknown as { setContext: jest.Mock; warning: jest.Mock; debug: jest.Mock };
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('downloadFilesAsArchive', () => {
		describe('when adapter returns files and download is successful', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({
					isDirectory: false,
					name: 'test1.txt',
					parentId: undefined,
				});
				const file2 = fileDomainFactory.build({
					isDirectory: false,
					name: 'test2.txt',
					parentId: undefined,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				const mockStream1 = new Readable();
				const mockStream2 = new Readable();
				mockStream1.push('content1');
				mockStream1.push(null);
				mockStream2.push('content2');
				mockStream2.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream1).mockResolvedValueOnce(mockStream2);

				const mockArchive = createMockArchive();
				const createEmptySpy = jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId, archiveName, file1, file2, createEmptySpy, appendFileSpy, mockArchive };
			};

			it('should return a file response with archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});

			it('should call ArchiveFactory with correct file paths', async () => {
				const { ownerId, archiveName, file1, file2, appendFileSpy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toEqual(expect.arrayContaining([file1.name, file2.name]));
			});

			it('should call downloadFile on the adapter for each file', async () => {
				const { ownerId, archiveName, file1, file2 } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(legacyFileStorageAdapter.downloadFile).toHaveBeenCalledWith(file1.id, file1.name);
				expect(legacyFileStorageAdapter.downloadFile).toHaveBeenCalledWith(file2.id, file2.name);
			});

			it('should not append a fehlende-dateien.txt report when all files succeed', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.append).not.toHaveBeenCalledWith(expect.any(Buffer), { name: 'fehlende-dateien.txt' });
			});
		});

		describe('when no files exist', () => {
			const setup = () => {
				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([]);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);

				return { ownerId, archiveName };
			};

			it('should return an empty archive response', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});
		});

		describe('when only directories exist', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: true });
				const file2 = fileDomainFactory.build({ isDirectory: true });

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);

				return { ownerId, archiveName };
			};

			it('should return an archive response with no downloadable files', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});

			it('should not call downloadFile for directories', async () => {
				const { ownerId, archiveName } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(legacyFileStorageAdapter.downloadFile).not.toHaveBeenCalled();
			});
		});

		describe('when files have nested folder structure', () => {
			const setup = () => {
				const rootFolder = fileDomainFactory.build({
					isDirectory: true,
					name: 'Documents',
					parentId: undefined,
				});

				const subFolder = fileDomainFactory.build({
					isDirectory: true,
					name: 'Subfolder',
					parentId: rootFolder.id,
				});

				const file = fileDomainFactory.build({
					isDirectory: false,
					name: 'document.txt',
					parentId: subFolder.id,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				const mockStream = new Readable();
				mockStream.push('content');
				mockStream.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([rootFolder, subFolder, file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValue(mockArchive);
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId, archiveName, file, rootFolder, subFolder, appendFileSpy };
			};

			it('should preserve folder structure in archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
				expect(result.data).toBeDefined();
			});

			it('should call ArchiveFactory with correct nested path', async () => {
				const { ownerId, archiveName, file, rootFolder, subFolder, appendFileSpy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				const expectedPath = `${rootFolder.name}/${subFolder.name}/${file.name}`;
				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toContain(expectedPath);
			});
		});

		describe('when a file download fails', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: false, name: 'failing.txt', parentId: undefined });
				const file2 = fileDomainFactory.build({ isDirectory: false, name: 'success.txt', parentId: undefined });

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				const mockStream = new Readable();
				mockStream.push('content');
				mockStream.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				legacyFileStorageAdapter.downloadFile
					.mockRejectedValueOnce(new Error('download failed'))
					.mockResolvedValueOnce(mockStream);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId, archiveName, file1, file2, appendFileSpy, mockArchive };
			};

			it('should skip the failing file and continue with the remaining files', async () => {
				const { ownerId, archiveName, file2, appendFileSpy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toEqual([file2.name]);
			});

			it('should log a warning for the skipped file', async () => {
				const { ownerId, archiveName, file1 } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(file1.id));
			});

			it('should append a REPORT.txt report to the archive', async () => {
				const { ownerId, archiveName, file1, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.append).toHaveBeenCalledWith(expect.any(Readable), { name: 'REPORT.txt' });
				const reportStream = mockArchive.append.mock.calls[0][0] as Readable;
				const chunks: Buffer[] = [];
				for await (const chunk of reportStream) {
					chunks.push(chunk as Buffer);
				}
				expect(Buffer.concat(chunks).toString()).toContain(file1.name);
			});
		});

		describe('when all file sizes are known', () => {
			const setup = () => {
				const file = fileDomainFactory.build({
					isDirectory: false,
					name: 'test.txt',
					parentId: undefined,
					size: 8,
				});

				const mockStream = new Readable();
				mockStream.push('content1');
				mockStream.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', file, mockArchive };
			};

			it('should return the predicted content length', async () => {
				const { ownerId, archiveName, file } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				const expected = ZipSizeCalculator.storedArchiveSize([
					{ name: file.name, size: 8 },
					{ name: 'REPORT.txt', size: 4096 },
				]);
				expect(result.contentLength).toBe(expected);
			});

			it('should always append the REPORT.txt entry', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.append).toHaveBeenCalledWith(expect.any(Readable), { name: 'REPORT.txt' });
			});
		});

		describe('when a file size is unknown', () => {
			const setup = () => {
				const file = fileDomainFactory.build({
					isDirectory: false,
					name: 'test.txt',
					parentId: undefined,
					size: undefined,
				});

				const mockStream = new Readable();
				mockStream.push('content1');
				mockStream.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', mockArchive };
			};

			it('should not return a content length', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.contentLength).toBeUndefined();
			});

			it('should not append the REPORT.txt entry', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.append).not.toHaveBeenCalled();
			});
		});

		describe('when the archive is built without mocking archiver', () => {
			const setup = (options: { failingFile?: boolean; wrongSize?: boolean } = {}) => {
				const file1 = fileDomainFactory.build({
					isDirectory: false,
					name: 'täst 1.txt',
					parentId: undefined,
					size: options.wrongSize ? 1000 : 8,
				});
				const file2 = fileDomainFactory.build({
					isDirectory: false,
					name: 'test2.bin',
					parentId: undefined,
					size: 70000,
				});

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				legacyFileStorageAdapter.downloadFile
					.mockResolvedValueOnce(Readable.from([Buffer.from('content1')]))
					.mockImplementationOnce(() =>
						options.failingFile
							? Promise.reject(new Error('download failed'))
							: Promise.resolve(Readable.from([Buffer.alloc(70000, 1)]))
					);

				return { ownerId: 'owner123', archiveName: 'test-archive' };
			};

			const collectSize = async (stream: Readable): Promise<number> => {
				let size = 0;
				for await (const chunk of stream) {
					size += (chunk as Buffer).length;
				}

				return size;
			};

			it.each([
				['all files are available', {}],
				['a file download fails', { failingFile: true }],
				['a file is smaller than announced', { wrongSize: true }],
			])('should stream exactly the announced content length when %s', async (_name, options) => {
				const { ownerId, archiveName } = setup(options);

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const streamedSize = await collectSize(result.data);

				expect(streamedSize).toBe(result.contentLength);
			});
		});

		describe('when a user file occupies the report name', () => {
			const setup = (userFileNames: string[]) => {
				const files = userFileNames.map((name) =>
					fileDomainFactory.build({ isDirectory: false, name, parentId: undefined, size: 4 })
				);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce(files);
				files.forEach(() => legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(Readable.from(['user'])));

				return { ownerId: 'owner123', archiveName: 'test-archive' };
			};

			const collect = async (stream: Readable): Promise<Buffer> => {
				const chunks: Buffer[] = [];
				for await (const chunk of stream) {
					chunks.push(chunk as Buffer);
				}

				return Buffer.concat(chunks);
			};

			it.each([
				[['REPORT.txt'], 'REPORT_1.txt'],
				[['report.txt'], 'REPORT_1.txt'],
				[['REPORT.txt', 'REPORT_1.txt'], 'REPORT_2.txt'],
			])('should pick a collision-free name for %j', async (userFileNames, expectedReportName) => {
				const { ownerId, archiveName } = setup(userFileNames);

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);
				const zip = new AdmZip(archiveBuffer);

				const entryNames = zip.getEntries().map((entry) => entry.entryName);
				expect(entryNames).toEqual([...userFileNames, expectedReportName]);
				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});

			it('should announce a content length that matches the longer collision-free report name', async () => {
				const userFileNames = ['REPORT.txt', ...Array.from({ length: 10 }, (_, index) => `REPORT_${index + 1}.txt`)];
				const { ownerId, archiveName } = setup(userFileNames);

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);
				const zip = new AdmZip(archiveBuffer);

				expect(zip.getEntries().map((entry) => entry.entryName)).toContain('REPORT_11.txt');
				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});
		});

		describe('when a file stream fails after partial data', () => {
			const setup = () => {
				const brokenFile = fileDomainFactory.build({
					isDirectory: false,
					name: 'broken.txt',
					parentId: undefined,
					size: 8,
				});
				const intactFile = fileDomainFactory.build({
					isDirectory: false,
					name: 'intact.txt',
					parentId: undefined,
					size: 6,
				});

				const brokenSource = new PassThrough();
				brokenSource.write(Buffer.from('abc'));
				// Fail only once the already written bytes reached the archive, otherwise they would be discarded.
				const failWhenFlushed = (): void => {
					if (brokenSource.readableLength === 0) {
						brokenSource.destroy(new Error('connection reset'));
					} else {
						setImmediate(failWhenFlushed);
					}
				};
				setImmediate(failWhenFlushed);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([brokenFile, intactFile]);
				legacyFileStorageAdapter.downloadFile
					.mockResolvedValueOnce(brokenSource)
					.mockResolvedValueOnce(Readable.from([Buffer.from('intact')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', brokenFile, intactFile };
			};

			const collect = async (stream: Readable): Promise<Buffer> => {
				const chunks: Buffer[] = [];
				for await (const chunk of stream) {
					chunks.push(chunk as Buffer);
				}

				return Buffer.concat(chunks);
			};

			it('should stream exactly the announced content length', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);

				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});

			it('should pad the truncated entry with zero bytes', async () => {
				const { ownerId, archiveName, brokenFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				const entryData = zip.getEntry(brokenFile.name)?.getData();
				expect(entryData).toEqual(Buffer.concat([Buffer.from('abc'), Buffer.alloc(5)]));
			});

			it('should keep the remaining files intact', async () => {
				const { ownerId, archiveName, intactFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(zip.getEntry(intactFile.name)?.getData().toString()).toBe('intact');
			});

			it('should list the incomplete file in the report', async () => {
				const { ownerId, archiveName, brokenFile, intactFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				const report = zip.getEntry('REPORT.txt')?.getData().toString() ?? '';
				expect(report).toContain(brokenFile.name);
				expect(report).not.toContain(intactFile.name);
			});
		});

		describe('when archive emits an error during file append', () => {
			const setup = () => {
				const file = fileDomainFactory.build({
					isDirectory: false,
					name: 'test.txt',
					parentId: undefined,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				const mockStream = new Readable();
				mockStream.push('content');
				mockStream.push(null);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream);

				const mockArchive = createMockArchiveWithError(new Error('archive error'));
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId, archiveName, file, mockArchive };
			};

			it('should remove the entry listener when an error occurs', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.off).toHaveBeenCalledWith('entry', expect.any(Function));
			});

			it('should skip the file and log a warning', async () => {
				const { ownerId, archiveName, file } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(file.id));
			});
		});

		describe('when a file size is invalid', () => {
			const setup = (size: number) => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined, size });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(Readable.from(['content1']));

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive' };
			};

			it.each([
				['negative', -1],
				['fractional', 12.5],
				['above the safe integer range', Number.MAX_SAFE_INTEGER + 2],
			])('should not return a content length for a %s size', async (_name, size) => {
				const { ownerId, archiveName } = setup(size);

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.contentLength).toBeUndefined();
			});
		});

		describe('when a download fails and no content length is announced', () => {
			const setup = () => {
				const file = fileDomainFactory.build({
					isDirectory: false,
					name: 'failing.txt',
					parentId: undefined,
					size: undefined,
				});

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockRejectedValueOnce(new Error('download failed'));

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', file, mockArchive };
			};

			it('should append an unpadded report listing the skipped file', async () => {
				const { ownerId, archiveName, file, mockArchive } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(result.contentLength).toBeUndefined();
				expect(mockArchive.append).toHaveBeenCalledWith(expect.any(Readable), { name: 'REPORT.txt' });

				const reportStream = mockArchive.append.mock.calls[0][0] as Readable;
				const chunks: Buffer[] = [];
				for await (const chunk of reportStream) {
					chunks.push(chunk as Buffer);
				}
				const report = Buffer.concat(chunks);
				expect(report.toString()).toContain(file.name);
				expect(report.length).toBeLessThan(4096);
			});
		});

		describe('when finalizing the archive fails', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(Readable.from(['content1']));

				const error = new Error('finalize failed');
				const mockArchive = createMockArchive();
				mockArchive.finalize.mockRejectedValueOnce(error);
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', error, mockArchive };
			};

			it('should forward the error to the archive stream', async () => {
				const { ownerId, archiveName, error, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.emit).toHaveBeenCalledWith('error', error);
			});
		});

		describe('when selectedFiles parameter is provided', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: false, name: 'file1.txt', parentId: undefined });
				const file2 = fileDomainFactory.build({ isDirectory: false, name: 'file2.txt', parentId: undefined });
				const file3 = fileDomainFactory.build({ isDirectory: false, name: 'file3.txt', parentId: undefined });

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2, file3]);

				const mockStream1 = new Readable();
				const mockStream3 = new Readable();
				mockStream1.push('content1');
				mockStream1.push(null);
				mockStream3.push('content3');
				mockStream3.push(null);

				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(mockStream1).mockResolvedValueOnce(mockStream3);

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId, archiveName, file1, file2, file3, appendFileSpy };
			};

			it('should only download and append the selected files', async () => {
				const { ownerId, archiveName, file1, file2, file3, appendFileSpy } = setup();

				const selectedFiles = [file1.id, file3.id];
				await service.downloadFilesAsArchive(ownerId, archiveName, selectedFiles);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toEqual(expect.arrayContaining([file1.name, file3.name]));
				expect(appendedNames).not.toContain(file2.name);
			});

			it('should ignore fileids that are not part of the owning parent (e.g. teams)', async () => {
				const { ownerId, archiveName, file1, file2, file3, appendFileSpy } = setup();

				const selectedFiles = [file1.id, 'nonexistent-file-id', file2.id];
				await service.downloadFilesAsArchive(ownerId, archiveName, selectedFiles);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toEqual(expect.arrayContaining([file1.name, file2.name]));
				expect(appendedNames).not.toContain(file3.name);
				expect(appendedNames).not.toContain('nonexistent-file-id');
			});
		});
	});

	describe('listDownloadableFiles', () => {
		const setup = () => {
			const ownerId = 'owner123';
			const directory = fileDomainFactory.build({ isDirectory: true });
			const file1 = fileDomainFactory.build({ isDirectory: false, name: 'file1.txt', parentId: directory.id });
			const file2 = fileDomainFactory.build({ isDirectory: false, name: 'file2.txt', parentId: directory.id });
			const fileDos = [directory, file1, file2];

			legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce(fileDos);

			return { ownerId, fileDos };
		};

		it('should return a list of downloadable files', async () => {
			const { ownerId, fileDos } = setup();

			const result = await service.listDownloadableFiles(ownerId);

			expect(result).toEqual(fileDos);
		});
	});
});
