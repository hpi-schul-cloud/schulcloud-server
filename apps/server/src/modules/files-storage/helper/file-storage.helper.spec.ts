import { MikroORM } from '@mikro-orm/core';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { ErrorStatus } from '../error';
import { ErrorType } from '../files-storage.const';
import { FilesStorageHelper } from './files-storage.helper';

describe('FilesStorageHelper', () => {
	let module: TestingModule;
	let fileStorageHelper: FilesStorageHelper;
	let orm: MikroORM;

	const setupFileRecords = () => {
		const userId: EntityId = new ObjectId().toHexString();
		const schoolId: EntityId = new ObjectId().toHexString();

		const fileRecords = [
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
		];

		return fileRecords;
	};

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
		it('should create path', () => {
			const path = fileStorageHelper.createPath('schoolId', 'fileRecordId');
			expect(path).toBe('schoolId/fileRecordId');
		});

		it('should throw error on empty schoolId', () => {
			expect(() => {
				fileStorageHelper.createPath('', 'fileRecordId');
			}).toThrowError(ErrorStatus.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId', () => {
			expect(() => {
				fileStorageHelper.createPath('schoolId', '');
			}).toThrowError(ErrorStatus.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId and schoolId', () => {
			expect(() => {
				fileStorageHelper.createPath('', '');
			}).toThrowError(ErrorStatus.COULD_NOT_CREATE_PATH);
		});
	});

	describe('getPaths', () => {
		it('should return paths', () => {
			const fileRecords = setupFileRecords();
			const paths = fileStorageHelper.getPaths(fileRecords);

			const fileRecordId1 = fileRecords[0].id;
			const fileRecordId2 = fileRecords[1].id;
			const schoolId1 = fileRecords[0].schoolId;
			const schoolId2 = fileRecords[1].schoolId;

			expect(paths).toEqual(expect.arrayContaining([`${schoolId1}/${fileRecordId1}`, `${schoolId2}/${fileRecordId2}`]));
		});

		it('should return empty array on empty fileRecordsArray', () => {
			const paths = fileStorageHelper.getPaths([]);

			expect(paths).toEqual([]);
		});
	});

	describe('markForDelete()', () => {
		it('should mark files for delete', () => {
			const fileRecords = setupFileRecords();
			const markedFileRecords = fileStorageHelper.markForDelete(fileRecords);
			expect(markedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) as Date }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) as Date }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) as Date }),
				])
			);
		});
	});

	describe('unmarkForDelete()', () => {
		it('should reset deletedSince params', () => {
			const fileRecords = setupFileRecords();
			const unmarkedFileRecords = fileStorageHelper.unmarkForDelete(fileRecords);
			expect(unmarkedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: undefined }),
				])
			);
		});
	});

	describe('GIVEN checkDuplicatedNames is called', () => {
		describe('WHEN all fileRecords has different names', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('THEN it should do nothing', () => {
				const { fileRecords, newFileName } = setup();

				const result = fileStorageHelper.checkDuplicatedNames(fileRecords, newFileName);

				expect(result).toBeUndefined();
			});
		});

		describe('WHEN fileRecords with new FileName already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';
				fileRecords[0].name = newFileName;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('THEN it should throw with specific error', () => {
				const { fileRecords, newFileName } = setup();

				expect(() => fileStorageHelper.checkDuplicatedNames(fileRecords, newFileName)).toThrowError(
					new ConflictException(ErrorType.FILE_NAME_EXISTS)
				);
			});
		});
	});

	describe('GIVEN modifiedFileNameInScope is called', () => {
		// TODO: add tests
	});

	describe('GIVEN mapFileRecordToFileRecordParams is called', () => {
		// TODO: add tests
	});
});
