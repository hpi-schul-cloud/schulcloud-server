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
		exampleFiles[0].id = '123';
		exampleFiles[1].id = '456';

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
		describe('when flow is normal', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;
				filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
				filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);

				return { thresholdDate, batchSize };
			};

			it('should delete all marked files in storage', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				for (const file of exampleFiles) {
					expect(fileStorageAdapter.deleteFile).toHaveBeenCalledWith(file);
				}
			});

			it('should delete all marked files in database', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				for (const file of exampleFiles) {
					expect(filesRepo.delete).toHaveBeenCalledWith(file);
				}
			});
		});

		describe('when storage adapter throws an error', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;
				const error = new Error();

				filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
				filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);
				fileStorageAdapter.deleteFile.mockRejectedValueOnce(error);

				return { thresholdDate, batchSize, error };
			};

			it('should log the error', async () => {
				const { thresholdDate, batchSize, error } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(logger.error).toHaveBeenCalledWith(error);
			});

			it('should not call delete on repo for that file', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(filesRepo.delete).toBeCalledTimes(exampleFiles.length - 1);
			});

			it('should continue with other files', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(fileStorageAdapter.deleteFile).toBeCalledTimes(exampleFiles.length);
			});
		});
	});
});
