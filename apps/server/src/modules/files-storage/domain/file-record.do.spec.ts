import { fileRecordTestFactory } from '../testing';
import { FileRecord, PreviewOutputMimeTypes, PreviewStatus, ScanStatus } from './file-record.do';

describe('FileRecord', () => {
	let fileRecord: FileRecord;

	beforeEach(() => {
		fileRecord = fileRecordTestFactory().build({});
	});

	describe('hasDuplicateName', () => {
		it('should return the file record with a duplicate name', () => {
			const fileRecords = [
				fileRecordTestFactory().build({ name: 'file1.txt' }),
				fileRecordTestFactory().build({ name: 'file2.txt' }),
			];
			const duplicate = FileRecord.hasDuplicateName(fileRecords, 'file1.txt');
			expect(duplicate?.getName()).toBe('file1.txt');
		});

		it('should return undefined if no duplicate name exists', () => {
			const fileRecords = [
				fileRecordTestFactory().build({ name: 'file1.txt' }),
				fileRecordTestFactory().build({ name: 'file2.txt' }),
			];
			const duplicate = FileRecord.hasDuplicateName(fileRecords, 'file3.txt');
			expect(duplicate).toBeUndefined();
		});
	});

	describe('resolveFileNameDuplicates', () => {
		it('should append a counter to resolve duplicate file names', () => {
			const fileRecords = [
				fileRecordTestFactory().build({ name: 'file.txt' }),
				fileRecordTestFactory().build({ name: 'file (1).txt' }),
			];
			const resolvedName = FileRecord.resolveFileNameDuplicates(fileRecords, 'file.txt');
			expect(resolvedName).toBe('file (2).txt');
		});
	});

	describe('getFormat', () => {
		it('should return the correct format from a MIME type', () => {
			const format = FileRecord.getFormat('image/png');
			expect(format).toBe('png');
		});

		it('should throw an error for invalid MIME types', () => {
			expect(() => FileRecord.getFormat('invalid-mime')).toThrowError(
				'could not get format from mime type: invalid-mime'
			);
		});
	});

	describe('markForDelete and unmarkForDelete', () => {
		it('should mark a file record for deletion', () => {
			fileRecord.markForDelete();
			expect(fileRecord.getProps().deletedSince).toBeInstanceOf(Date);
		});

		it('should unmark a file record for deletion', () => {
			fileRecord.markForDelete();
			fileRecord.unmarkForDelete();
			expect(fileRecord.getProps().deletedSince).toBeUndefined();
		});
	});

	describe('getPaths', () => {
		it('should return paths for all file records', () => {
			const fileRecords = [
				fileRecordTestFactory().build({ id: '1', storageLocationId: 'loc1' }),
				fileRecordTestFactory().build({ id: '2', storageLocationId: 'loc2' }),
			];
			const paths = FileRecord.getPaths(fileRecords);
			expect(paths).toEqual(['loc1/1', 'loc2/2']);
		});
	});

	describe('getPreviewStatus', () => {
		it('should return PREVIEW_POSSIBLE if security check is verified and MIME type is valid', () => {
			jest.spyOn(fileRecord, 'isPreviewPossible').mockReturnValue(true);
			jest.spyOn(fileRecord, 'isBlocked').mockReturnValue(false);
			jest.spyOn(fileRecord, 'isPending').mockReturnValue(false);
			jest
				.spyOn(fileRecord, 'getSecurityCheckProps')
				.mockReturnValue({ status: ScanStatus.VERIFIED, reason: 'verified', updatedAt: new Date() });

			const status = fileRecord.getPreviewStatus();
			expect(status).toBe(PreviewStatus.PREVIEW_POSSIBLE);
		});

		it('should return PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE if MIME type is invalid', () => {
			jest.spyOn(fileRecord, 'isPreviewPossible').mockReturnValue(false);

			const status = fileRecord.getPreviewStatus();
			expect(status).toBe(PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE);
		});
	});

	describe('getPreviewName', () => {
		it('should return the original name if no output format is provided', () => {
			const previewName = fileRecord.getPreviewName();
			expect(previewName).toBe(fileRecord.getName());
		});

		it('should return the correct preview file name with the specified output format', () => {
			jest.spyOn(fileRecord, 'getName').mockReturnValue('file.txt');
			const previewName = fileRecord.getPreviewName(PreviewOutputMimeTypes.IMAGE_WEBP);
			expect(previewName).toBe('file.webp');
		});
	});
});
