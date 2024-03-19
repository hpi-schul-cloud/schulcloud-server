import { EntityId } from '@shared/domain/types';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { createCopyFiles, createPath, createPreviewDirectoryPath, createPreviewFilePath, getPaths } from '.';
import { FileRecord } from '../entity';
import { ErrorType } from '../error';

describe('Path Helper', () => {
	beforeAll(async () => {
		await setupEntities([FileRecord]);
	});

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

	describe('createPath', () => {
		it('should create path', () => {
			const path = createPath('schoolId', 'fileRecordId');
			expect(path).toBe('schoolId/fileRecordId');
		});

		it('should throw error on empty schoolId', () => {
			expect(() => {
				createPath('', 'fileRecordId');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId', () => {
			expect(() => {
				createPath('schoolId', '');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});

		it('should throw error on empty fileRecordId and schoolId', () => {
			expect(() => {
				createPath('', '');
			}).toThrowError(ErrorType.COULD_NOT_CREATE_PATH);
		});
	});

	describe('createPreviewFilePath', () => {
		it('should create path', () => {
			const path = createPreviewFilePath('schoolId', 'previewId', 'fileRecordId');
			expect(path).toBe('previews/schoolId/fileRecordId/previewId');
		});
	});

	describe('createPreviewDirectoryPath', () => {
		it('should create path', () => {
			const path = createPreviewDirectoryPath('schoolId', 'fileRecordId');
			expect(path).toBe('previews/schoolId/fileRecordId');
		});
	});

	describe('getPaths', () => {
		const setup = () => {
			return { fileRecords: setupFileRecords() };
		};

		it('should return paths', () => {
			const { fileRecords } = setup();
			const paths = getPaths(fileRecords);

			const fileRecordId1 = fileRecords[0].id;
			const fileRecordId2 = fileRecords[1].id;
			const schoolId1 = fileRecords[0].schoolId;
			const schoolId2 = fileRecords[1].schoolId;

			expect(paths).toEqual(expect.arrayContaining([`${schoolId1}/${fileRecordId1}`, `${schoolId2}/${fileRecordId2}`]));
		});

		it('should return empty array on empty fileRecordsArray', () => {
			const paths = getPaths([]);

			expect(paths).toEqual([]);
		});
	});

	describe('createICopyFiles is called', () => {
		const setup = () => {
			return { fileRecords: setupFileRecords() };
		};

		it('should return iCopyFiles', () => {
			const { fileRecords } = setup();
			const sourceFile = fileRecords[0];
			const targetFile = fileRecords[1];

			const expectedICopyFiles = {
				sourcePath: createPath(sourceFile.schoolId, sourceFile.id),
				targetPath: createPath(targetFile.schoolId, targetFile.id),
			};

			const result = createCopyFiles(sourceFile, targetFile);

			expect(result).toEqual(expectedICopyFiles);
		});
	});
});
