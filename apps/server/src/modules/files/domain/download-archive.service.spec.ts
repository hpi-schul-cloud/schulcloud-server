import { DomainErrorHandler } from '@core/error';
import { Logger } from '@core/logger';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { S3ClientAdapter } from '@infra/s3-client';
import { StorageProviderRepo } from '@modules/school/repo';
import { storageProviderFactory } from '@modules/school/testing';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Archiver } from 'archiver';
import { Readable } from 'stream';
import { fileDomainFactory } from '../testing';
import { DownloadArchiveService } from './download-archive.service';
import { ArchiveFactory } from './factory';
import { LegacyFileStorageAdapter } from './legacy-file-storage.adapter';

describe('DownloadArchiveService', () => {
	let service: DownloadArchiveService;
	let legacyFileStorageAdapter: DeepMocked<LegacyFileStorageAdapter>;
	let storageProviderRepo: DeepMocked<StorageProviderRepo>;
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
				{
					provide: StorageProviderRepo,
					useValue: createMock<StorageProviderRepo>(),
				},
				{
					provide: DomainErrorHandler,
					useValue: createMock<DomainErrorHandler>(),
				},
			],
		}).compile();

		service = module.get(DownloadArchiveService);
		legacyFileStorageAdapter = module.get(LegacyFileStorageAdapter);
		storageProviderRepo = module.get(StorageProviderRepo);
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('downloadFilesAsArchive', () => {
		const jwt = 'test-jwt';

		describe('when repo returns files and download is successful', () => {
			const setup = () => {
				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });
				const file1 = fileDomainFactory.build({
					isDirectory: false,
					storageProviderId: storageProvider.id,
					storageFileName: 'file1.txt',
					bucket: 'bucket1',
					name: 'test1.txt',
					parentId: undefined,
				});
				const file2 = fileDomainFactory.build({
					isDirectory: false,
					storageProviderId: storageProvider.id,
					storageFileName: 'file2.txt',
					bucket: 'bucket2',
					name: 'test2.txt',
					parentId: undefined,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);
				storageProviderRepo.findById.mockResolvedValueOnce(storageProvider);

				const mockStream1 = new Readable();
				const mockStream2 = new Readable();
				mockStream1.push('content1');
				mockStream1.push(null);
				mockStream2.push('content2');
				mockStream2.push(null);

				jest
					.spyOn(S3ClientAdapter.prototype, 'get')
					.mockResolvedValueOnce({ data: mockStream1 })
					.mockResolvedValueOnce({ data: mockStream2 });

				const mockArchive = createMock<Archiver>();
				const spy = jest.spyOn(ArchiveFactory, 'create').mockReturnValueOnce(mockArchive);

				return { ownerId, archiveName, file1, file2, spy };
			};

			it('should return a file response with archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName, jwt);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
			});

			it('should call ArchiveFactory with correct file paths', async () => {
				const { ownerId, archiveName, file1, file2, spy } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName, jwt);

				expect(spy).toHaveBeenCalledWith(
					expect.arrayContaining([
						expect.objectContaining({ name: file1.name }),
						expect.objectContaining({ name: file2.name }),
					]),
					expect.any(Array),
					expect.anything()
				);
			});
		});

		describe('when no files exist', () => {
			const setup = () => {
				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([]);

				return { ownerId, archiveName };
			};

			it('should throw NotFoundException', async () => {
				const { ownerId, archiveName } = setup();

				await expect(service.downloadFilesAsArchive(ownerId, archiveName, jwt)).rejects.toThrow(
					new NotFoundException('No files found to download as archive')
				);
			});
		});

		describe('when only directories exist', () => {
			const setup = () => {
				const file1 = fileDomainFactory.build({ isDirectory: true });
				const file2 = fileDomainFactory.build({ isDirectory: true });

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file1, file2]);

				return { ownerId, archiveName };
			};

			it('should throw NotFoundException', async () => {
				const { ownerId, archiveName } = setup();

				await expect(service.downloadFilesAsArchive(ownerId, archiveName, jwt)).rejects.toThrow(
					new NotFoundException('No files found to download as archive')
				);
			});
		});

		describe('when a file has no storage provider assigned', () => {
			const setup = () => {
				const file = fileDomainFactory.build({
					isDirectory: false,
					storageProviderId: undefined,
					storageFileName: 'file1.txt',
					bucket: 'bucket1',
					name: 'test.txt',
					parentId: undefined,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([file]);

				return { ownerId, archiveName, file };
			};

			it('should throw NotFoundException with file id in message', async () => {
				const { ownerId, archiveName, file } = setup();

				await expect(service.downloadFilesAsArchive(ownerId, archiveName, jwt)).rejects.toThrow(
					new NotFoundException(`File with id ${file.id} does not have a storage provider assigned`)
				);
			});
		});

		describe('when files have nested folder structure', () => {
			const setup = () => {
				const storageProvider = storageProviderFactory.buildWithId({ region: 'us-east-1' });

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
					storageProviderId: storageProvider.id,
					storageFileName: 'file1.txt',
					bucket: 'bucket1',
					name: 'document.txt',
					parentId: subFolder.id,
				});

				const ownerId = 'owner123';
				const archiveName = 'test-archive';

				legacyFileStorageAdapter.getFilesForOwner.mockResolvedValueOnce([rootFolder, subFolder, file]);
				storageProviderRepo.findById.mockResolvedValue(storageProvider);

				const mockStream = new Readable();
				mockStream.push('content');
				mockStream.push(null);

				jest.spyOn(S3ClientAdapter.prototype, 'get').mockResolvedValueOnce({ data: mockStream });

				const mockArchive = createMock<Archiver>();
				jest.spyOn(ArchiveFactory, 'create').mockReturnValue(mockArchive);

				return { ownerId, archiveName, file, rootFolder, subFolder };
			};

			it('should preserve folder structure in archive', async () => {
				const { ownerId, archiveName } = setup();

				const result = await service.downloadFilesAsArchive(ownerId, archiveName, jwt);

				expect(result.name).toBe(`${archiveName}.zip`);
				expect(result.contentType).toBe('application/zip');
				expect(result.data).toBeDefined();
			});

			it('should call ArchiveFactory with correct nested path', async () => {
				const { ownerId, archiveName, file, rootFolder, subFolder } = setup();

				await service.downloadFilesAsArchive(ownerId, archiveName, jwt);

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
