import { MikroORM } from '@mikro-orm/core';
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, ScanStatus } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { FileRecordParams, ScanResultParams } from '../controller/dto';
import { ErrorType } from '../error';
import { FilesStorageHelper } from './files-storage.helper';

describe('FilesStorageHelper', () => {
	let module: TestingModule;
	let filesStorageHelper: FilesStorageHelper;
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

	const setupFileRecord = () => {
		const userId: EntityId = new ObjectId().toHexString();
		const schoolId: EntityId = new ObjectId().toHexString();

		const fileRecord = fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' });

		return fileRecord;
	};

	beforeAll(async () => {
		orm = await setupEntities();
	});

	beforeEach(async () => {
		module = await Test.createTestingModule({
			providers: [FilesStorageHelper],
		}).compile();

		filesStorageHelper = module.get(FilesStorageHelper);
	});

	afterEach(async () => {
		await module.close();
	});

	afterAll(async () => {
		await orm.close();
	});

	it('should be defined', () => {
		expect(filesStorageHelper).toBeDefined();
	});

	describe('createPath', () => {
		it('should create path', () => {
			const path = filesStorageHelper.createPath('schoolId', 'fileRecordId');
			expect(path).toBe('schoolId/fileRecordId');
		});

		it('should throw error on empty schoolId', () => {
			expect(() => {
				filesStorageHelper.createPath('', 'fileRecordId');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId', () => {
			expect(() => {
				filesStorageHelper.createPath('schoolId', '');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId and schoolId', () => {
			expect(() => {
				filesStorageHelper.createPath('', '');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});
	});

	describe('getPaths', () => {
		it('should return paths', () => {
			const fileRecords = setupFileRecords();
			const paths = filesStorageHelper.getPaths(fileRecords);

			const fileRecordId1 = fileRecords[0].id;
			const fileRecordId2 = fileRecords[1].id;
			const schoolId1 = fileRecords[0].schoolId;
			const schoolId2 = fileRecords[1].schoolId;

			expect(paths).toEqual(expect.arrayContaining([`${schoolId1}/${fileRecordId1}`, `${schoolId2}/${fileRecordId2}`]));
		});

		it('should return empty array on empty fileRecordsArray', () => {
			const paths = filesStorageHelper.getPaths([]);

			expect(paths).toEqual([]);
		});
	});

	describe('markForDelete()', () => {
		it('should mark files for delete', () => {
			const fileRecords = setupFileRecords();
			const markedFileRecords = filesStorageHelper.markForDelete(fileRecords);
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
			const unmarkedFileRecords = filesStorageHelper.unmarkForDelete(fileRecords);
			expect(unmarkedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: undefined }),
				])
			);
		});
	});

	describe('checkDuplicatedNames is called', () => {
		describe('WHEN all fileRecords has different names', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should do nothing', () => {
				const { fileRecords, newFileName } = setup();

				const result = filesStorageHelper.checkDuplicatedNames(fileRecords, newFileName);

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

			it('should throw with specific error', () => {
				const { fileRecords, newFileName } = setup();

				expect(() => filesStorageHelper.checkDuplicatedNames(fileRecords, newFileName)).toThrowError(
					new ConflictException(ErrorType.FILE_NAME_EXISTS)
				);
			});
		});
	});

	describe('modifyFileNameInScope is called', () => {
		describe('WHEN all fileRecords has different names', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const fileRecord = fileRecords[0];
				const newFileName = 'renamed';

				return {
					newFileName,
					fileRecords,
					fileRecord,
				};
			};

			it('should rename fileRecord', () => {
				const { fileRecords, fileRecord, newFileName } = setup();

				const result = filesStorageHelper.modifyFileNameInScope(fileRecord, fileRecords, newFileName);

				expect(result.name).toEqual(newFileName);
			});
		});

		describe('WHEN fileRecords with new FileName already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const fileRecord = fileRecords[0];
				const newFileName = 'renamed';
				fileRecord.name = newFileName;

				return {
					newFileName,
					fileRecords,
					fileRecord,
				};
			};

			it('should throw with specific error', () => {
				const { fileRecords, fileRecord, newFileName } = setup();

				expect(() => filesStorageHelper.modifyFileNameInScope(fileRecord, fileRecords, newFileName)).toThrowError(
					new ConflictException(ErrorType.FILE_NAME_EXISTS)
				);
			});
		});
	});

	describe('mapFileRecordToFileRecordParams is called', () => {
		const setup = () => {
			const fileRecord = setupFileRecord();

			return {
				fileRecord,
			};
		};

		it('should return expected instance of params', () => {
			const { fileRecord } = setup();

			const result = filesStorageHelper.mapFileRecordToFileRecordParams(fileRecord);

			expect(result).toBeInstanceOf(FileRecordParams);
		});

		it('should return correct mapped values', () => {
			const { fileRecord } = setup();

			const result = filesStorageHelper.mapFileRecordToFileRecordParams(fileRecord);

			expect(result).toEqual({
				schoolId: fileRecord.schoolId,
				parentId: fileRecord.parentId,
				parentType: fileRecord.parentType,
			});
		});
	});

	describe('getStatusFromScanResult is called', () => {
		describe('WHEN virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_signature: 'bla',
					virus_detected: true,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = filesStorageHelper.getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.BLOCKED);
			});
		});

		describe('WHEN no virus is detected', () => {
			const setup = () => {
				const scanResultParams: ScanResultParams = {
					virus_detected: false,
				};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				const result = filesStorageHelper.getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.VERIFIED);
			});
		});

		describe('WHEN empty scanResult is passed', () => {
			const setup = () => {
				const scanResultParams = {};

				return {
					scanResultParams,
				};
			};

			it('should return blocked scan status', () => {
				const { scanResultParams } = setup();

				// @ts-expect-error type do not match
				const result = filesStorageHelper.getStatusFromScanResult(scanResultParams);

				expect(result).toEqual(ScanStatus.BLOCKED);
			});
		});
	});
});
