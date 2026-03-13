import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Archiver } from 'archiver';
import { Readable } from 'node:stream';
import { fileDomainFactory } from '../testing';
import { DownloadArchiveService } from './download-archive.service';
import { ArchiveFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';

describe('DownloadArchiveService', () => {
	let service: DownloadArchiveService;
	let legacyFileStorageAdapter: DeepMocked<LegacyFileStorageAdapter>;
	let module: TestingModule;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				DownloadArchiveService,
				{
					provide: Logger,
					useValue: {
						setContext: jest.fn(),
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

				const mockArchive = createMock<Archiver>();
				const spy = jest.spyOn(ArchiveFactory, 'create').mockReturnValueOnce(mockArchive);

				return { ownerId, archiveName, file1, file2, spy };
			};

			it('should return a file response with archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});

			it('should call ArchiveFactory with correct file paths', async () => {
				const { ownerId, archiveName, file1, file2, spy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(spy).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ name: file1.name }),
						expect.objectContaining({ name: file2.name }),
					]),
					expect.any(Array),
					expect.anything()
				);
			});

			it('should call downloadFile on the adapter for each file', async () => {
				const { ownerId, archiveName, file1, file2 } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(legacyFileStorageAdapter.downloadFile).toHaveBeenCalledWith(file1.id, file1.name);
				expect(legacyFileStorageAdapter.downloadFile).toHaveBeenCalledWith(file2.id, file2.name);
			});
		});

		describe('when no files exist', () => {
			const setup = () => {
				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([]);

				const mockArchive = createMock<Archiver>();
				jest.spyOn(ArchiveFactory, 'create').mockReturnValueOnce(mockArchive);

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

				const mockArchive = createMock<Archiver>();
				jest.spyOn(ArchiveFactory, 'create').mockReturnValueOnce(mockArchive);

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

				const mockArchive = createMock<Archiver>();
				jest.spyOn(ArchiveFactory, 'create').mockReturnValue(mockArchive);

				return { ownerId, archiveName, file, rootFolder, subFolder };
			};

			it('should preserve folder structure in archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
				expect(result.data).toBeDefined();
			});

			it('should call ArchiveFactory with correct nested path', async () => {
				const { ownerId, archiveName, file, rootFolder, subFolder } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName);

				const expectedPath = `${rootFolder.name}/${subFolder.name}/${file.name}`;
				expect(ArchiveFactory.create).toHaveBeenCalledWith(
					expect.arrayContaining([expect.objectContaining({ name: expectedPath })]),
					expect.any(Array),
					expect.anything()
				);
			});
		});
	});
});
