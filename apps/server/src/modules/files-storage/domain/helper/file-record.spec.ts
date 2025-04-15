import { ObjectId } from '@mikro-orm/mongodb';
import { EntityId } from '@shared/domain/types';
import { setupEntities } from '@testing/database';
import { getFormat, getPreviewName, markForDelete, unmarkForDelete } from '.';
import { FileRecordEntity } from '../../repo';
import { fileRecordTestFactory } from '../../testing';
import { PreviewOutputMimeTypes } from '../interface';

describe('File Record Helper', () => {
	const setupFileRecords = () => {
		const userId: EntityId = new ObjectId().toHexString();
		const storageLocationId: EntityId = new ObjectId().toHexString();

		const fileRecords = fileRecordTestFactory().buildList(3, { parentId: userId, storageLocationId });

		return { fileRecords, userId };
	};

	beforeAll(async () => {
		await setupEntities([FileRecordEntity]);
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
			const fileRecord = fileRecordTestFactory().build();
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
