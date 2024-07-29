import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { StorageProviderRepo } from '@shared/repo/storageprovider';
import { storageProviderFactory } from '@shared/testing';
import { LegacyLogger } from '@src/core/logger';
import { DeleteFilesUc } from './delete-files.uc';
import { FilesRepo } from '../repo';
import { fileEntityFactory, filePermissionEntityFactory } from '../entity/testing';

describe(DeleteFilesUc.name, () => {
	let module: TestingModule;
	let service: DeleteFilesUc;
	let filesRepo: DeepMocked<FilesRepo>;
	let storageProviderRepo: DeepMocked<StorageProviderRepo>;
	let logger: DeepMocked<LegacyLogger>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
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
		jest.resetAllMocks();
	});

	afterAll(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('deleteMarkedFiles', () => {
		describe('when flow is normal', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;

				const userId = new ObjectId().toHexString();
				const storageProvider = storageProviderFactory.build();

				const exampleFiles = [
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
						isDirectory: false,
					}),
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
						isDirectory: false,
					}),
				];

				const s3ClientMock = {
					send: jest.fn(),
				};

				// Please note the second try, that found no more files that needs to be deleted.
				filesRepo.findForCleanup.mockResolvedValueOnce(exampleFiles).mockResolvedValueOnce([]);
				filesRepo.delete.mockResolvedValueOnce();
				storageProviderRepo.findAll.mockResolvedValueOnce([storageProvider]);
				const spy = jest
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.spyOn(DeleteFilesUc.prototype as any, 'getClientForFile')
					.mockImplementation(() => s3ClientMock);

				return { thresholdDate, batchSize, exampleFiles, spy };
			};

			it('should create correct log result', async () => {
				const { thresholdDate, batchSize, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(logger.log).toBeCalledTimes(4);
				expect(logger.error).toBeCalledTimes(0);

				spy.mockRestore();
			});

			it('should delete all marked files in S3', async () => {
				const { thresholdDate, batchSize, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(spy).toHaveBeenCalledTimes(2);

				spy.mockRestore();
			});

			it('should delete all marked files in database', async () => {
				const { thresholdDate, batchSize, exampleFiles, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				for (const file of exampleFiles) {
					expect(filesRepo.delete).toHaveBeenCalledWith(file);
				}

				spy.mockRestore();
			});
		});

		describe('when deletion in storage throws an error', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;
				const error = new Error();

				const userId = new ObjectId().toHexString();
				const storageProvider = storageProviderFactory.build();

				const exampleFiles = [
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					}),
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					}),
				];

				// Please note the second try, that found no more files that needs to be deleted.
				filesRepo.findForCleanup.mockResolvedValueOnce(exampleFiles).mockResolvedValueOnce([]);
				storageProviderRepo.findAll.mockResolvedValueOnce([storageProvider]);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const spy = jest.spyOn(DeleteFilesUc.prototype as any, 'deleteFileInStorage').mockImplementation(() => {
					throw error;
				});

				return { thresholdDate, batchSize, error, spy };
			};

			it('should log the error', async () => {
				const { thresholdDate, batchSize, error, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(logger.error).toHaveBeenCalledWith(error);

				spy.mockRestore();
			});

			it('should not call delete on repo for that file', async () => {
				const { thresholdDate, batchSize, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(filesRepo.delete).toBeCalledTimes(0);

				spy.mockRestore();
			});

			it('should continue with other files', async () => {
				const { thresholdDate, batchSize, spy } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(spy).toBeCalledTimes(2);

				spy.mockRestore();
			});
		});

		describe('when no provider exists', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;

				const userId = new ObjectId().toHexString();
				const storageProvider = storageProviderFactory.build();

				const exampleFiles = [
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					}),
				];

				// Please note the second try, that found no more files that needs to be deleted.
				filesRepo.findForCleanup.mockResolvedValueOnce(exampleFiles).mockResolvedValueOnce([]);
				storageProviderRepo.findAll.mockResolvedValueOnce([]);

				return { thresholdDate, batchSize };
			};

			it('should log errors', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(logger.error).toBeCalledTimes(2);
			});
		});

		describe('when file without provider exists', () => {
			const setup = () => {
				const thresholdDate = new Date();
				const batchSize = 3;

				const userId = new ObjectId().toHexString();
				const storageProvider = storageProviderFactory.build();

				const exampleFiles = [
					fileEntityFactory.buildWithId({
						storageProvider,
						ownerId: userId,
						creatorId: userId,
						permissions: [filePermissionEntityFactory.build({ refId: userId })],
					}),
				];

				exampleFiles[0].storageProvider = undefined;

				// Please note the second try, that found no more files that needs to be deleted.
				filesRepo.findForCleanup.mockResolvedValueOnce(exampleFiles).mockResolvedValueOnce([]);
				storageProviderRepo.findAll.mockResolvedValueOnce([storageProvider]);

				return { thresholdDate, batchSize };
			};

			it('should log errors', async () => {
				const { thresholdDate, batchSize } = setup();

				await service.deleteMarkedFiles(thresholdDate, batchSize);

				expect(logger.error).toBeCalledTimes(2);
			});
		});
	});
});
