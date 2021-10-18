import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger/logger.module';
import { Logger } from '@src/core/logger';
import { File, StorageProvider } from '@shared/domain/entity';
import { DeleteFilesUc } from './delete-files.uc';

import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFileUC', () => {
	let service: DeleteFilesUc;
	let filesRepo: FilesRepo;
	let fileStorageRepo: FileStorageRepo;
	let logger: Logger;

	const exampleStorageProvider = new StorageProvider({
		endpointUrl: 'endpointUrl',
		accessKeyId: 'accessKey',
		secretAccessKey: 'secret',
	});
	const exampleFiles = [
		new File({ storageProvider: exampleStorageProvider, storageFileName: 'file1', bucket: 'bucket' }),
		new File({ storageProvider: exampleStorageProvider, storageFileName: 'file1', bucket: 'bucket' }),
	];

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			imports: [LoggerModule],
			providers: [
				DeleteFilesUc,
				{
					provide: FilesRepo,
					useValue: {
						getFilesForCleanup() {
							return Promise.resolve(exampleFiles);
						},
						removeAndFlush() {
							return Promise.resolve();
						},
					},
				},
				{
					provide: FileStorageRepo,
					useValue: {
						deleteFile() {
							return Promise.resolve();
						},
					},
				},
			],
		}).compile();

		logger = await module.resolve<Logger>(Logger);
		service = module.get(DeleteFilesUc);
		filesRepo = module.get(FilesRepo);
		fileStorageRepo = module.get(FileStorageRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should delete all file database documents that are marked for cleanup', async () => {
			const deleteFileSpy = jest.spyOn(filesRepo, 'removeAndFlush');
			await service.removeDeletedFilesData(new Date());
			expect(deleteFileSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should delete all file storage data that are marked for cleanup', async () => {
			const deleteFileStorageSpy = jest.spyOn(fileStorageRepo, 'deleteFile');
			await service.removeDeletedFilesData(new Date());
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should continue after a file could not be deleted', async () => {
			const errorLogSpy = jest.spyOn(logger, 'error');
			const deleteFileStorageSpy = jest.spyOn(fileStorageRepo, 'deleteFile');
			deleteFileStorageSpy.mockImplementationOnce(() => {
				throw new Error();
			});
			await service.removeDeletedFilesData(new Date());
			expect(errorLogSpy).toHaveBeenCalled();
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});
	});
});
