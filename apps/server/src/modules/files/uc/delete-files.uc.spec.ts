import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from '@src/core/logger/logger.module';
import { ObjectId } from '@mikro-orm/mongodb';
import { DeleteFilesUc } from './delete-files.uc';

import { FilesRepo, FileStorageRepo } from '../repo';

describe('DeleteFileUC', () => {
	let service: DeleteFilesUc;
	let filesRepo: FilesRepo;
	let fileStorageRepo: FileStorageRepo;

	const exampleFiles = [
		{
			_id: new ObjectId().toString(),
		},
		{
			_id: new ObjectId().toString(),
		},
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
						deleteFile() {
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
			const deleteFileSpy = jest.spyOn(filesRepo, 'deleteFile');
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
	});
});
