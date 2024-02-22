import { EntityId } from '@shared/domain/types';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { createFileRecord, getFormat, getPreviewName, markForDelete, unmarkForDelete } from '.';
import { FileRecord } from '../entity';
import { PreviewOutputMimeTypes } from '../interface';

describe('File Record Helper', () => {
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
		await setupEntities([FileRecord]);
	});

	describe('markForDelete()', () => {
		it('should mark files for delete', () => {
			const { fileRecords } = setupFileRecords();

			const markedFileRecords = markForDelete(fileRecords);

			expect(markedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) }),
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
			expect(newFileRecord).toEqual(expect.any(FileRecord));
		});
	});

	describe('getFormat is called', () => {
		it('should return format', () => {
			const mimeType = 'image/jpeg';

			const result = getFormat(mimeType);

			expect(result).toEqual('jpeg');
		});

		it('should throw error', () => {
			const mimeType = 'image';

			expect(() => getFormat(mimeType)).toThrowError(`could not get format from mime type: ${mimeType}`);
		});
	});

	describe('getPreviewName is called', () => {
		const setup = () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const outputFormat = PreviewOutputMimeTypes.IMAGE_WEBP;

			return { fileRecord, outputFormat };
		};

		it('should return origin file name', () => {
			const { fileRecord } = setup();

			const result = getPreviewName(fileRecord, undefined);

			expect(result).toEqual(fileRecord.name);
		});

		it('should return preview name with format', () => {
			const { fileRecord, outputFormat } = setup();

			const result = getPreviewName(fileRecord, outputFormat);

			expect(result).toEqual(`${fileRecord.name.split('.')[0]}.webp`);
		});
	});
});
