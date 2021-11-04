import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@src/core/logger';
import { File, StorageProvider } from '@shared/domain/entity';
import { FilesRepo } from '@shared/repo';
import { DeleteFilesUc } from './delete-files.uc';

describe('DeleteFileUC', () => {
	let uc: DeleteFilesUc;
	let filesRepo: FilesRepo;
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
		exampleFiles[0].id = 'failed_removal_id';
		exampleFiles[1].id = 'other_id';
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DeleteFilesUc,
				{
					provide: FilesRepo,
					useValue: {
						findAllFilesForCleanup() {
							return Promise.resolve(exampleFiles);
						},
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
	});

	it('should be defined', () => {
		expect(uc).toBeDefined();
	});

	describe('removeDeletedFilesData', () => {
		it('should delete all file database documents that are marked for cleanup', async () => {
			const deleteFileSpy = jest.spyOn(filesRepo, 'deleteFile');
			await uc.removeDeletedFilesData(new Date());
			expect(deleteFileSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileSpy).toHaveBeenCalledWith(file);
			}
		});

		it('should continue after a file could not be deleted', async () => {
			const errorLogSpy = jest.spyOn(logger, 'error');
			const deleteFileStorageSpy = jest.spyOn(filesRepo, 'deleteFile');
			deleteFileStorageSpy.mockImplementationOnce(() => {
				throw new Error();
			});
			await uc.removeDeletedFilesData(new Date());
			expect(errorLogSpy).toHaveBeenCalled();
			expect(errorLogSpy).toHaveBeenCalledWith('the following files could not be deleted:', ['failed_removal_id']);
			expect(deleteFileStorageSpy).toHaveBeenCalledTimes(exampleFiles.length);
			// eslint-disable-next-line no-restricted-syntax
			for (const file of exampleFiles) {
				expect(deleteFileStorageSpy).toHaveBeenCalledWith(file);
			}
		});
	});
});
