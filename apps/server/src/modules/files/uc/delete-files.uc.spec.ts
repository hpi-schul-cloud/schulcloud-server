import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger/logger.module';
import { File, StorageProvider } from '@shared/domain/entity';
import { DeleteFilesUc } from './delete-files.uc';

import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFileUC', () => {
	let service: DeleteFilesUc;
	let filesRepo: FilesRepo;
	let fileStorageRepo: FileStorageRepo;

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
						getExpiredFiles() {
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

		service = module.get<DeleteFilesUc>(DeleteFilesUc);
		filesRepo = module.get<FilesRepo>(FilesRepo);
		fileStorageRepo = module.get<FileStorageRepo>(FileStorageRepo);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should delete all file database documents that are expired', async () => {
			const deleteFileSpy = jest.spyOn(filesRepo, 'removeAndFlush');
			await service.removeDeletedFilesData(new Date());
			expect(deleteFileSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should delete all file storage data that are expired', async () => {
			const deleteFileStorageSpy = jest.spyOn(fileStorageRepo, 'deleteFile');
			await service.removeDeletedFilesData(new Date());
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should continue after a file could not be deleted', async () => {
			const deleteFileStorageSpy = jest.spyOn(fileStorageRepo, 'deleteFile');
			deleteFileStorageSpy.mockImplementationOnce(() => {
				throw new Error();
			});
			await service.removeDeletedFilesData(new Date());
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});
	});
});
