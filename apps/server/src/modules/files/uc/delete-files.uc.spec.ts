import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { File, StorageProvider } from '@shared/domain/entity';
import { FileStorageAdapter } from '@shared/infra/filestorage';
import { DeleteFilesUc } from './delete-files.uc';
import { FilesRepo } from '../repo';

describe('DeleteFileUC', () => {
	let uc: DeleteFilesUc;
	let filesRepo: FilesRepo;
	let fileStorageAdapter: FileStorageAdapter;
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
			providers: [
				DeleteFilesUc,
				{
					provide: FilesRepo,
					useValue: {
						findAllFilesForCleanup() {
							return Promise.resolve(exampleFiles);
						},
						removeAndFlush() {
							return Promise.resolve();
						},
					},
				},
				{
					provide: FileStorageAdapter,
					useValue: {
						deleteFile() {
							return Promise.resolve();
						},
					},
				},
				{
					provide: Logger,
					useValue: {
						setContext() {},
						log() {},
						error() {},
					},
				},
			],
		}).compile();

		logger = module.get(Logger);
		uc = module.get(DeleteFilesUc);
		filesRepo = module.get(FilesRepo);
		fileStorageAdapter = module.get(FileStorageAdapter);
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should delete all file database documents that are marked for cleanup', async () => {
			const deleteFileSpy = jest.spyOn(filesRepo, 'removeAndFlush');
			await uc.removeDeletedFilesData(new Date());
			expect(deleteFileSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should delete all file storage data that are marked for cleanup', async () => {
			// TODO move to repo
			const deleteFileStorageSpy = jest.spyOn(fileStorageAdapter, 'deleteFile');
			await uc.removeDeletedFilesData(new Date());
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should continue after a file could not be deleted', async () => {
			const errorLogSpy = jest.spyOn(logger, 'error');
			const deleteFileStorageSpy = jest.spyOn(fileStorageAdapter, 'deleteFile');
			deleteFileStorageSpy.mockImplementationOnce(() => {
				throw new Error();
			});
			await uc.removeDeletedFilesData(new Date());
			expect(errorLogSpy).toHaveBeenCalled();
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});
	});
});
