import { S3Client } from '@aws-sdk/client-s3';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { File, StorageProvider } from '@shared/domain/entity';
import { FilesRepo } from '@shared/repo';
import { StorageProviderRepo } from '@shared/repo/storageprovider/storageprovider.repo';
import { storageProviderFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import { DeleteFilesUc } from './delete-files.uc';

describe('DeleteFileUC', () => {
	let service: DeleteFilesUc;
	let filesRepo: DeepMocked<FilesRepo>;
	let storageProviderRepo: DeepMocked<StorageProviderRepo>;
	let s3Mock: AwsClientStub<S3Client>;
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
					provide: StorageProviderRepo,
					useValue: createMock<StorageProviderRepo>(),
				},
				{
					provide: LegacyLogger,
					useValue: createMock<LegacyLogger>(),
				},
			],
		}).compile();

		service = module.get(DeleteFilesUc);
		filesRepo = module.get(FilesRepo);
		storageProviderRepo = module.get(StorageProviderRepo);
		logger = module.get(LegacyLogger);
	});

	beforeEach(() => {
		s3Mock = mockClient(S3Client);
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

				const storageProvider = storageProviderFactory.build();
				storageProviderRepo.findAll.mockResolvedValueOnce([storageProvider]);

				return { thresholdDate, batchSize };
			};

			it('should delete all marked files in storage', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(s3Mock.send.callCount).toEqual(2);
			});

			it('should delete all marked files in database', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				for (const file of exampleFiles) {
					expect(filesRepo.delete).toHaveBeenCalledWith(file);
				}
			});
		});

		describe('when deletion in storage throws an error', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;
				const error = new Error();

				filesRepo.findFilesForCleanup.mockResolvedValueOnce(exampleFiles);
				filesRepo.findFilesForCleanup.mockResolvedValueOnce([]);

				const storageProvider = storageProviderFactory.build();
				storageProviderRepo.findAll.mockResolvedValueOnce([storageProvider]);

				const spy = jest.spyOn(DeleteFilesUc.prototype as any, 'deleteFileInStorage');
				spy.mockRejectedValueOnce(error);

				return { thresholdDate, batchSize, error, spy };
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
				const { thresholdDate, batchSize, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(spy).toBeCalledTimes(exampleFiles.length);
			});
		});
	});
});
