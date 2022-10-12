import { MikroORM } from '@mikro-orm/core';
import { EntityId } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { createPath, getPaths } from '.';
import { ErrorType } from '../../error';

describe('Path Helper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

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

	describe('getPaths', () => {
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

		it('should return paths', () => {
			const fileRecords = setupFileRecords();

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
});
