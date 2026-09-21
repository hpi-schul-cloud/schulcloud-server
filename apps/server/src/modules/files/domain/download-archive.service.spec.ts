import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { Logger } from '@infra/logger';
import { InternalServerErrorException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import AdmZip from 'adm-zip';
import { type Archiver } from 'archiver';
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

const collect = async (stream: Readable): Promise<Buffer> => {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}

	return Buffer.concat(chunks);
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
		describe('when all files are reachable', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: false, name: 'test1.txt', parentId: undefined });
				const file2 = fileDomainFactory.build({ isDirectory: false, name: 'test2.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				legacyFileStorageAdapter.probeFile
					.mockResolvedValueOnce({ url: 'https://storage/1', size: 8 })
					.mockResolvedValueOnce({ url: 'https://storage/2', size: 8 });
				legacyFileStorageAdapter.downloadFileFromUrl
					.mockResolvedValueOnce(Readable.from([Buffer.from('content1')]))
					.mockResolvedValueOnce(Readable.from([Buffer.from('content2')]));

				const mockArchive = createMockArchive();
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', file1, file2, appendFileSpy, mockArchive };
			};

			it('should return a file response with archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});

			it('should probe every file before streaming', async () => {
				const { ownerId, archiveName, file1, file2 } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(legacyFileStorageAdapter.probeFile).toHaveBeenCalledWith(file1.id, file1.name);
				expect(legacyFileStorageAdapter.probeFile).toHaveBeenCalledWith(file2.id, file2.name);
			});

			it('should download from the url returned by the probe', async () => {
				const { ownerId, archiveName } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(legacyFileStorageAdapter.downloadFileFromUrl).toHaveBeenCalledWith('https://storage/1');
				expect(legacyFileStorageAdapter.downloadFileFromUrl).toHaveBeenCalledWith('https://storage/2');
				expect(legacyFileStorageAdapter.downloadFile).not.toHaveBeenCalled();
			});

			it('should append every file to the archive', async () => {
				const { ownerId, archiveName, file1, file2, appendFileSpy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toEqual([file1.name, file2.name]);
			});

			it('should not append a report', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.append).not.toHaveBeenCalled();
			});

			it('should announce the predicted content length', async () => {
				const { ownerId, archiveName, file1, file2 } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				const expected = ZipSizeCalculator.storedArchiveSize([
					{ name: file1.name, size: 8 },
					{ name: file2.name, size: 8 },
				]);
				expect(result.contentLength).toBe(expected);
			});
		});

		describe('when no files exist', () => {
			const setup = () => {
				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([]);
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(createMockArchive());

				return { ownerId: 'owner123', archiveName: 'test-archive' };
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
				const dir1 = fileDomainFactory.build({ isDirectory: true });
				const dir2 = fileDomainFactory.build({ isDirectory: true });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([dir1, dir2]);
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(createMockArchive());

				return { ownerId: 'owner123', archiveName: 'test-archive' };
			};

			it('should not probe or download anything', async () => {
				const { ownerId, archiveName } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(legacyFileStorageAdapter.probeFile).not.toHaveBeenCalled();
				expect(legacyFileStorageAdapter.downloadFileFromUrl).not.toHaveBeenCalled();
			});
		});

		describe('when files have a nested folder structure', () => {
			const setup = () => {
				const rootFolder = fileDomainFactory.build({ isDirectory: true, name: 'Documents', parentId: undefined });
				const subFolder = fileDomainFactory.build({ isDirectory: true, name: 'Subfolder', parentId: rootFolder.id });
				const file = fileDomainFactory.build({ isDirectory: false, name: 'document.txt', parentId: subFolder.id });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([rootFolder, subFolder, file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: 7 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('content')]));

				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(createMockArchive());
				const appendFileSpy = jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', file, rootFolder, subFolder, appendFileSpy };
			};

			it('should preserve the folder structure in the entry name', async () => {
				const { ownerId, archiveName, file, rootFolder, subFolder, appendFileSpy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				const appendedNames = appendFileSpy.mock.calls.map(([, r]) => r.name);
				expect(appendedNames).toContain(`${rootFolder.name}/${subFolder.name}/${file.name}`);
			});
		});

		describe('when a file is not reachable', () => {
			const setup = () => {
				const missingFile = fileDomainFactory.build({ isDirectory: false, name: 'missing.txt', parentId: undefined });
				const intactFile = fileDomainFactory.build({ isDirectory: false, name: 'intact.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([missingFile, intactFile]);
				legacyFileStorageAdapter.probeFile
					.mockRejectedValueOnce(new Error('not found'))
					.mockResolvedValueOnce({ url: 'https://storage/2', size: 6 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('intact')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', missingFile, intactFile };
			};

			it('should log a warning with the reason for the unreachable file', async () => {
				const { ownerId, archiveName, missingFile } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(missingFile.id, 'not found'));
			});

			it('should not try to download the unreachable file', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				await collect(result.data);

				expect(legacyFileStorageAdapter.downloadFileFromUrl).toHaveBeenCalledTimes(1);
			});

			it('should exclude it from the archive and list it in the report', async () => {
				const { ownerId, archiveName, missingFile, intactFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(zip.getEntries().map((entry) => entry.entryName)).toEqual([intactFile.name, 'REPORT.txt']);
				const report = zip.getEntry('REPORT.txt')?.getData().toString() ?? '';
				expect(report).toContain(missingFile.name);
				expect(report).not.toContain(intactFile.name);
			});

			it('should announce a content length without the unreachable file', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);

				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});
		});

		describe('when a probe rejects with a non error value', () => {
			const setup = () => {
				const missingFile = fileDomainFactory.build({ isDirectory: false, name: 'missing.txt', parentId: undefined });
				const intactFile = fileDomainFactory.build({ isDirectory: false, name: 'intact.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([missingFile, intactFile]);
				legacyFileStorageAdapter.probeFile

					.mockRejectedValueOnce('boom')
					.mockResolvedValueOnce({ url: 'https://storage/2', size: 6 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('intact')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', missingFile };
			};

			it('should log a generic reason', async () => {
				const { ownerId, archiveName, missingFile } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(missingFile.id, 'unknown error'));
			});
		});

		describe('when no file is reachable at all', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: false, name: 'one.txt', parentId: undefined });
				const file2 = fileDomainFactory.build({ isDirectory: false, name: 'two.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				legacyFileStorageAdapter.probeFile.mockRejectedValue(new Error('status 403'));

				return { ownerId: 'owner123', archiveName: 'test-archive' };
			};

			it('should throw instead of returning an archive containing only the report', async () => {
				const { ownerId, archiveName } = setup();

				await expect(service.downloadFilesAsArchive(ownerId, archiveName)).rejects.toThrow(
					InternalServerErrorException
				);
			});
		});

		describe('when the report name is taken by a user file', () => {
			const setup = (userFileNames: string[]) => {
				const files = userFileNames.map((name) => fileDomainFactory.build({ isDirectory: false, name }));
				const missingFile = fileDomainFactory.build({ isDirectory: false, name: 'missing.txt' });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([...files, missingFile]);
				files.forEach((_, index) =>
					legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: `https://storage/${index}`, size: 4 })
				);
				legacyFileStorageAdapter.probeFile.mockRejectedValueOnce(new Error('not found'));
				files.forEach(() =>
					legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('user')]))
				);

				return { ownerId: 'owner123', archiveName: 'test-archive' };
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

				expect(zip.getEntries().map((entry) => entry.entryName)).toEqual([...userFileNames, expectedReportName]);
				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});

			it('should announce a content length that matches the longer collision-free name', async () => {
				// 'REPORT.txt' up to 'REPORT_10.txt' are taken, so the report name grows by three bytes.
				const userFileNames = ['REPORT.txt', ...Array.from({ length: 10 }, (_, index) => `REPORT_${index + 1}.txt`)];
				const { ownerId, archiveName } = setup(userFileNames);

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);
				const zip = new AdmZip(archiveBuffer);

				expect(zip.getEntries().map((entry) => entry.entryName)).toContain('REPORT_11.txt');
				expect(archiveBuffer).toHaveLength(result.contentLength as number);
			});
		});

		describe('when the probed url expired before the download', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/expired', size: 6 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockRejectedValueOnce(new Error('expired'));
				legacyFileStorageAdapter.downloadFile.mockResolvedValueOnce(Readable.from([Buffer.from('intact')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', file };
			};

			it('should fall back to a freshly signed url', async () => {
				const { ownerId, archiveName, file } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(legacyFileStorageAdapter.downloadFile).toHaveBeenCalledWith(file.id, file.name);
				expect(zip.getEntry(file.name)?.getData().toString()).toBe('intact');
			});
		});

		describe('when a download fails despite a successful probe', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: 6 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockRejectedValueOnce(new Error('gone'));
				legacyFileStorageAdapter.downloadFile.mockRejectedValueOnce(new Error('gone'));

				return { ownerId: 'owner123', archiveName: 'test-archive', file };
			};

			it('should pad the entry so the announced content length still holds', async () => {
				const { ownerId, archiveName, file } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);
				const zip = new AdmZip(archiveBuffer);

				expect(archiveBuffer).toHaveLength(result.contentLength as number);
				expect(zip.getEntry(file.name)?.getData()).toEqual(Buffer.alloc(6));
				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(file.id, 'gone'));
			});
		});

		describe('when a file stream fails after partial data', () => {
			const setup = () => {
				const brokenFile = fileDomainFactory.build({ isDirectory: false, name: 'broken.txt', parentId: undefined });
				const intactFile = fileDomainFactory.build({ isDirectory: false, name: 'intact.txt', parentId: undefined });

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
				legacyFileStorageAdapter.probeFile
					.mockResolvedValueOnce({ url: 'https://storage/1', size: 8 })
					.mockResolvedValueOnce({ url: 'https://storage/2', size: 6 });
				legacyFileStorageAdapter.downloadFileFromUrl
					.mockResolvedValueOnce(brokenSource)
					.mockResolvedValueOnce(Readable.from([Buffer.from('intact')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', brokenFile, intactFile };
			};

			it('should pad the truncated entry and keep the announced content length', async () => {
				const { ownerId, archiveName, brokenFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const archiveBuffer = await collect(result.data);
				const zip = new AdmZip(archiveBuffer);

				expect(archiveBuffer).toHaveLength(result.contentLength as number);
				expect(zip.getEntry(brokenFile.name)?.getData()).toEqual(Buffer.concat([Buffer.from('abc'), Buffer.alloc(5)]));
			});

			it('should keep the remaining files intact', async () => {
				const { ownerId, archiveName, intactFile } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(zip.getEntry(intactFile.name)?.getData().toString()).toBe('intact');
			});
		});

		describe('when the probe does not report a size', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: undefined });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('content')]));

				return { ownerId: 'owner123', archiveName: 'test-archive', file };
			};

			it('should not announce a content length but still stream the file', async () => {
				const { ownerId, archiveName, file } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(result.contentLength).toBeUndefined();
				expect(zip.getEntry(file.name)?.getData().toString()).toBe('content');
			});
		});

		describe('when a download fails and no content length is announced', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'failing.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: undefined });
				legacyFileStorageAdapter.downloadFileFromUrl.mockRejectedValueOnce(new Error('gone'));
				legacyFileStorageAdapter.downloadFile.mockRejectedValueOnce(new Error('gone'));

				return { ownerId: 'owner123', archiveName: 'test-archive', file };
			};

			it('should skip the entry entirely', async () => {
				const { ownerId, archiveName, file } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				const zip = new AdmZip(await collect(result.data));

				expect(result.contentLength).toBeUndefined();
				expect(zip.getEntries()).toHaveLength(0);
				expect(logger.warning).toHaveBeenCalledWith(new SkipFileLoggable(file.id, 'gone'));
			});
		});

		describe('when many files have to be probed', () => {
			const setup = () => {
				const files = Array.from({ length: 30 }, (_, index) =>
					fileDomainFactory.build({ isDirectory: false, name: `file${index}.txt`, parentId: undefined })
				);

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce(files);

				let running = 0;
				let maxRunning = 0;
				legacyFileStorageAdapter.probeFile.mockImplementation(async () => {
					running += 1;
					maxRunning = Math.max(maxRunning, running);
					await new Promise((resolve) => setImmediate(resolve));
					running -= 1;

					return { url: 'https://storage/1', size: 4 };
				});
				legacyFileStorageAdapter.downloadFileFromUrl.mockImplementation(() =>
					Promise.resolve(Readable.from([Buffer.from('user')]))
				);

				return { ownerId: 'owner123', archiveName: 'test-archive', files, getMaxRunning: () => maxRunning };
			};

			it('should limit the number of concurrent probes', async () => {
				const { ownerId, archiveName, files, getMaxRunning } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);
				await collect(result.data);

				expect(legacyFileStorageAdapter.probeFile).toHaveBeenCalledTimes(files.length);
				expect(getMaxRunning()).toBeLessThanOrEqual(10);
			});
		});

		describe('when archive emits an error during file append', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: 7 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('content')]));

				const mockArchive = createMockArchiveWithError(new Error('archive error'));
				jest.spyOn(ArchiveFactory, 'createEmpty').mockReturnValueOnce(mockArchive);
				jest.spyOn(ArchiveFactory, 'appendFile').mockReturnValue(undefined);

				return { ownerId: 'owner123', archiveName: 'test-archive', file, mockArchive };
			};

			it('should remove the entry listener when an error occurs', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.off).toHaveBeenCalledWith('entry', expect.any(Function));
			});

			it('should forward the error to the archive stream', async () => {
				const { ownerId, archiveName, mockArchive } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);
				await flushPromises();

				expect(mockArchive.emit).toHaveBeenCalledWith('error', expect.any(Error));
			});
		});

		describe('when finalizing the archive fails', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false, name: 'test.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);
				legacyFileStorageAdapter.probeFile.mockResolvedValueOnce({ url: 'https://storage/1', size: 7 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockResolvedValueOnce(Readable.from([Buffer.from('content')]));

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

		describe('when selectedFiles is provided', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: false, name: 'file1.txt', parentId: undefined });
				const file2 = fileDomainFactory.build({ isDirectory: false, name: 'file2.txt', parentId: undefined });
				const file3 = fileDomainFactory.build({ isDirectory: false, name: 'file3.txt', parentId: undefined });

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2, file3]);
				legacyFileStorageAdapter.probeFile.mockResolvedValue({ url: 'https://storage/1', size: 4 });
				legacyFileStorageAdapter.downloadFileFromUrl.mockImplementation(() =>
					Promise.resolve(Readable.from([Buffer.from('user')]))
				);

				return { ownerId: 'owner123', archiveName: 'test-archive', file1, file2, file3 };
			};

			it('should only probe and archive the selected files', async () => {
				const { ownerId, archiveName, file1, file3 } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName, [file1.id, file3.id]);
				const zip = new AdmZip(await collect(result.data));

				expect(legacyFileStorageAdapter.probeFile).toHaveBeenCalledTimes(2);
				expect(zip.getEntries().map((entry) => entry.entryName)).toEqual([file1.name, file3.name]);
			});
		});
	});

	describe('listDownloadableFiles', () => {
		describe('when the adapter returns files', () => {
			const setup = () => {
				const file = fileDomainFactory.build({ isDirectory: false });
				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);

				return { ownerId: 'owner123', file };
			};

			it('should return them unchanged', async () => {
				const { ownerId, file } = setup();

				const result = await service.listDownloadableFiles(ownerId);

				expect(result).toEqual([file]);
			});
		});
	});
});
