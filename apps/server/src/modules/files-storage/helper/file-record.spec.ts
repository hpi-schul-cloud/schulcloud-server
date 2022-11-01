import { MikroORM } from '@mikro-orm/core';
import { EntityId, FileRecord } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { createFileRecord, markForDelete, unmarkForDelete } from '.';

describe('File Record Helper', () => {
	let orm: MikroORM;

	const setupFileRecords = () => {
		const userId: EntityId = new ObjectId().toHexString();
		const schoolId: EntityId = new ObjectId().toHexString();

		const fileRecords = [
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-two.txt' }),
			fileRecordFactory.buildWithId({ parentId: userId, schoolId, name: 'text-tree.txt' }),
		];

		return { fileRecords, userId };
	};

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('markForDelete()', () => {
		it('should mark files for delete', () => {
			const { fileRecords } = setupFileRecords();

			const markedFileRecords = markForDelete(fileRecords);

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
			const { fileRecords } = setupFileRecords();

			const unmarkedFileRecords = unmarkForDelete(fileRecords);

			expect(unmarkedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: undefined }),
				])
			);
		});
	});

	describe('getNewFileRecord is called', () => {
		const setup = () => {
			const { fileRecords, userId } = setupFileRecords();
			const name = 'testName';
			const size = 256;
			const mimeType = 'image/jpeg';
			const fileRecord = fileRecords[0];
			const fileRecordParams = {
				schoolId: fileRecord.schoolId,
				parentId: fileRecord.parentId,
				parentType: fileRecord.parentType,
			};

			return { name, size, mimeType, fileRecord, fileRecordParams, userId };
		};
		it('should return new fileRecord', () => {
			const { name, size, mimeType, fileRecord, fileRecordParams, userId } = setup();

			const newFileRecord = createFileRecord(name, size, mimeType, fileRecordParams, userId);

			const expectedObject = {
				size,
				name,
				mimeType,
				parentType: fileRecord.parentType,
				parentId: fileRecord.parentId,
				creatorId: userId,
				schoolId: fileRecord.schoolId,
			};

			expect(newFileRecord).toEqual(expect.objectContaining({ ...expectedObject }));
			expect(newFileRecord).toEqual(expect.any(FileRecord) as FileRecord);
		});
	});
});
