import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FilesStorageHelper } from './files-storage.helper';

describe('FilesStorageHelper', () => {
	let module: TestingModule;
	let fileStorageHelper: FilesStorageHelper;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [FilesStorageHelper],
		}).compile();

		fileStorageHelper = module.get(FilesStorageHelper);
	});

	afterEach(async () => {
		await module.close();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should be defined', () => {
		expect(fileStorageHelper).toBeDefined();
	});

	describe('createPath', () => {
		const errorMessage = `Couldn't create path. SchoolId or FileRecordId is empty.`;
		it('should create path', () => {
			const path = fileStorageHelper.createPath('schoolId', 'fileRecordId');
			expect(path).toBe('schoolId/fileRecordId');
		});

		it('should throw error on empty schoolId', () => {
			expect(() => {
				fileStorageHelper.createPath('', 'fileRecordId');
			}).toThrowError(errorMessage);
		});

		it('should throw error on empty fileRecordId', () => {
			expect(() => {
				fileStorageHelper.createPath('schoolId', '');
			}).toThrowError(errorMessage);
		});

		it('should throw error on empty fileRecordId and schoolId', () => {
			expect(() => {
				fileStorageHelper.createPath('', '');
			}).toThrowError(errorMessage);
		});
	});

	describe('getPaths', () => {
		it('should return paths', () => {
			const fileRecords = [fileRecordFactory.buildWithId(), fileRecordFactory.buildWithId()];

			const paths = fileStorageHelper.getPaths(fileRecords);

			const fileRecordId1 = fileRecords[0].id;
			const fileRecordId2 = fileRecords[1].id;
			const schoolId1 = fileRecords[0].schoolId;
			const schoolId2 = fileRecords[1].schoolId;

			expect(paths).toEqual(expect.arrayContaining([`${schoolId1}/${fileRecordId1}`, `${schoolId2}/${fileRecordId2}`]));
		});

		it('should throw error on empty fileRecordsArray', () => {
			expect(() => {
				fileStorageHelper.getPaths([]);
			}).toThrowError(`FileRecordsArray is empty. Couldn't get paths`);
		});
	});
});
