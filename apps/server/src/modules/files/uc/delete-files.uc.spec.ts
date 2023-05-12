import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { File, StorageProvider } from '@shared/domain/entity';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { FilesRepo } from '@shared/repo';
import { LegacyLogger } from '@src/core/logger';
import { DeleteFilesUc } from './delete-files.uc';

describe('DeleteFileUC', () => {
	let service: DeleteFilesUc;
	let filesRepo: DeepMocked<FilesRepo>;
	let fileStorageAdapter: DeepMocked<FileStorageAdapter>;
	let logger: DeepMocked<LegacyLogger>;

	const exampleStorageProvider = new StorageProvider({
		endpointUrl: 'endpointUrl',
		accessKeyId: 'accessKey',
		secretAccessKey: 'secret',
	});

	const exampleFiles = [
		new File({
			storageProvider: exampleStorageProvider,
			storageFileName: 'file1',
			bucket: 'bucket',
			name: 'filename1',
		}),
		new File({
			storageProvider: exampleStorageProvider,
			storageFileName: 'file2',
			bucket: 'bucket',
			name: 'filename2',
		}),
	];

	beforeAll(async () => {
		exampleFiles[0].id = 'failed_removal_id';
		exampleFiles[1].id = 'other_id';
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeleteFilesUc,
				{
					provide: FilesRepo,
					useValue: createMock<FilesRepo>(),
				},
				{
					provide: FileStorageAdapter,
					useValue: createMock<FileStorageAdapter>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(DeleteFilesUc);
		filesRepo = module.get(FilesRepo);
		fileStorageAdapter = module.get(FileStorageAdapter);
		logger = module.get(LegacyLogger);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('deleteMarkedFiles', () => {
		it('should delete all files in storage', async () => {
			const deletedSince = new Date();
			const batchSize = 3;
			filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
			filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);

			await service.deleteMarkedFiles(deletedSince, batchSize);

			for (const file of exampleFiles) {
				expect(fileStorageAdapter.deleteFile).toHaveBeenCalledWith(file);
			}
		});

		it('should delete all files in database that are marked for deletion', async () => {
			const deletedSince = new Date();
			const batchSize = 3;
			filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
			filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);

			await service.deleteMarkedFiles(deletedSince, batchSize);

			for (const file of exampleFiles) {
				expect(filesRepo.delete).toHaveBeenCalledWith(file);
			}
		});

		describe('when storage adapter throws an error', () => {
			const setup = () => {
				const deletedSince = new Date();
				const batchSize = 3;
				const error = new Error();

				filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
				filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);
				fileStorageAdapter.deleteFile.mockRejectedValueOnce(error);

				return { deletedSince, batchSize, error };
			};

			it('should log the error', async () => {
				const { deletedSince, batchSize, error } = setup();

				await service.deleteMarkedFiles(deletedSince, batchSize);

				expect(logger.error).toHaveBeenCalledWith(error);
			});

			it('should not call delete on repo for that file', async () => {
				const { deletedSince, batchSize } = setup();

				await service.deleteMarkedFiles(deletedSince, batchSize);

				expect(filesRepo.delete).toBeCalledTimes(exampleFiles.length - 1);
			});

			it('should continue with other files', async () => {
				const { deletedSince, batchSize } = setup();

				await service.deleteMarkedFiles(deletedSince, batchSize);

				expect(fileStorageAdapter.deleteFile).toBeCalledTimes(exampleFiles.length);
			});
		});
	});
});
