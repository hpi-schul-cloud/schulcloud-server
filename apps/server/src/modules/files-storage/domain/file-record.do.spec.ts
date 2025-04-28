import { BadRequestException } from '@nestjs/common';
import { fileRecordTestFactory } from '../testing';
import { ErrorType } from './error';
import { FileRecord, PreviewOutputMimeTypes, PreviewStatus, ScanStatus } from './file-record.do';
import { ObjectId } from 'bson';

describe('FileRecord', () => {
	describe('hasDuplicateName', () => {
		const setup = () => {
			const fileRecords = [
				fileRecordTestFactory().build({ name: 'file1.txt' }),
				fileRecordTestFactory().build({ name: 'file2.txt' }),
			];

			return { fileRecords };
		};

		it('should return the file record with a duplicate name', () => {
			const { fileRecords } = setup();

			const duplicate = FileRecord.hasDuplicateName(fileRecords, 'file1.txt');

			expect(duplicate?.getName()).toBe('file1.txt');
		});

		describe('WHEN all fileRecords have different names', () => {
			it('should return undefined', () => {
				const { fileRecords } = setup();

				const duplicate = FileRecord.hasDuplicateName(fileRecords, 'file3.txt');

				expect(duplicate).toBeUndefined();
			});
		});
	});

	describe('resolveFileNameDuplicates', () => {
		const setup = () => {
			const fileRecords = [
				fileRecordTestFactory().build({ name: 'file.txt' }),
				fileRecordTestFactory().build({ name: 'file (1).txt' }),
			];

			return { fileRecords };
		};

		it('should append a counter to resolve duplicate file names', () => {
			const { fileRecords } = setup();

			const resolvedName = FileRecord.resolveFileNameDuplicates(fileRecords, 'file.txt');

			expect(resolvedName).toBe('file (2).txt');
		});
	});

	describe('getFormat', () => {
		it('should return the correct format from a MIME type', () => {
			const mimeType = 'image/jpeg';

			const format = FileRecord.getFormat(mimeType);

			expect(format).toBe('jpeg');
		});

		it('should return the correct format from a MIME type', () => {
			const mimeType = 'image/png';

			const format = FileRecord.getFormat(mimeType);

			expect(format).toBe('png');
		});

		it('should throw an error for invalid MIME types', () => {
			const mimeType = 'image';

			expect(() => FileRecord.getFormat(mimeType)).toThrowError(`could not get format from mime type: ${mimeType}`);
		});
	});

	describe('markForDelete', () => {
		describe('WHEN file is unmarked', () => {
			const setup = () => {
				const fileRecord = fileRecordTestFactory().build();
				fileRecord.unmarkForDelete();

				return { fileRecord };
			};

			it('should mark a file record for deletion', () => {
				const { fileRecord } = setup();

				fileRecord.markForDelete();

				expect(fileRecord.getProps().deletedSince).toBeInstanceOf(Date);
			});
		});
	});

	describe('unmarkForDelete', () => {
		describe('WHEN file is marked', () => {
			const setup = () => {
				const fileRecord = fileRecordTestFactory().build();
				fileRecord.markForDelete();

				return { fileRecord };
			};

			it('should unmark a file record for deletion', () => {
				const { fileRecord } = setup();

				fileRecord.unmarkForDelete();

				expect(fileRecord.getProps().deletedSince).toBeUndefined();
			});
		});
	});

	describe('FileRecord.resolveFileNameDuplicates', () => {
		const setup = () => {
			const creatorId = new ObjectId().toHexString();
			const fileRecords = fileRecordTestFactory().buildList(3, { creatorId });

			return { fileRecords };
		};

		it('should mark files for delete', () => {
			const { fileRecords } = setup();

			FileRecord.removeCreatorId(fileRecords);

			expect(fileRecords[0].getProps().creatorId).toEqual(undefined);
			expect(fileRecords[1].getProps().creatorId).toEqual(undefined);
			expect(fileRecords[2].getProps().creatorId).toEqual(undefined);
		});
	});

	describe('FileRecord.markForDelete', () => {
		const setup = () => {
			const fileRecords = fileRecordTestFactory().buildList(3);

			return { fileRecords };
		};

		it('should mark files for delete', () => {
			const { fileRecords } = setup();

			FileRecord.markForDelete(fileRecords);

			expect(fileRecords[0].getProps().deletedSince).toEqual(expect.any(Date));
			expect(fileRecords[1].getProps().deletedSince).toEqual(expect.any(Date));
			expect(fileRecords[2].getProps().deletedSince).toEqual(expect.any(Date));
		});
	});

	describe('FileRecord.unmarkForDelete', () => {
		const setup = () => {
			const fileRecords = fileRecordTestFactory().withDeletedSince().buildList(3);

			return { fileRecords };
		};

		it('should mark files for delete', () => {
			const { fileRecords } = setup();

			FileRecord.unmarkForDelete(fileRecords);

			expect(fileRecords[0].getProps().deletedSince).toEqual(undefined);
			expect(fileRecords[1].getProps().deletedSince).toEqual(undefined);
			expect(fileRecords[2].getProps().deletedSince).toEqual(undefined);
		});
	});

	describe('setName', () => {
		it('should update the name if a valid name is provided', () => {
			const newName = 'new-name.txt';
			const fileRecord = fileRecordTestFactory().build();

			fileRecord.setName(newName);

			expect(fileRecord.getName()).toBe(newName);
		});

		it('should throw BadRequestException if the name is empty', () => {
			const fileRecord = fileRecordTestFactory().build();

			expect(() => fileRecord.setName('')).toThrow(BadRequestException);
			expect(() => fileRecord.setName('')).toThrowError(ErrorType.FILE_NAME_EMPTY);
		});
	});

	describe('createPath', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build();
			const props = fileRecord.getProps();
			const expectedPath = props.storageLocationId + '/' + fileRecord.id;

			return { fileRecord, expectedPath };
		};

		it('should create path', () => {
			const { fileRecord, expectedPath } = setup();

			const path = fileRecord.createPath();

			expect(path).toBe(expectedPath);
		});
	});

	describe('FileRecord.getPaths', () => {
		it('should return paths for all file records', () => {
			const fileRecord1 = fileRecordTestFactory().build();
			const fileRecord2 = fileRecordTestFactory().build();
			const path1 = fileRecord1.createPath();
			const path2 = fileRecord2.createPath();

			const paths = FileRecord.getPaths([fileRecord1, fileRecord2]);

			expect(paths).toEqual([path1, path2]);
		});
	});

	describe('getPreviewStatus', () => {
		it('should return PREVIEW_POSSIBLE if security check is verified and MIME type is valid', () => {
			const fileRecord = fileRecordTestFactory().withScanStatus(ScanStatus.VERIFIED).build({ mimeType: 'image/png' });

			const status = fileRecord.getPreviewStatus();

			expect(status).toBe(PreviewStatus.PREVIEW_POSSIBLE);
		});

		it('should return PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE if MIME type is invalid', () => {
			const fileRecord = fileRecordTestFactory().build();

			jest.spyOn(fileRecord, 'isPreviewPossible').mockReturnValue(false);

			const status = fileRecord.getPreviewStatus();

			expect(status).toBe(PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE);
		});

		it('should return PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK if securtiy check status is WONT_CHECK and MIME type is valid', () => {
			const fileRecord = fileRecordTestFactory().withScanStatus(ScanStatus.WONT_CHECK).build({ mimeType: 'image/png' });

			const status = fileRecord.getPreviewStatus();

			expect(status).toBe(PreviewStatus.PREVIEW_NOT_POSSIBLE_SCAN_STATUS_WONT_CHECK);
		});
	});

	describe('getPreviewName', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build({ name: 'file.txt' });

			return { fileRecord };
		};

		it('should return the original name if no output format is provided', () => {
			const { fileRecord } = setup();

			const previewName = fileRecord.getPreviewName();

			expect(previewName).toBe(fileRecord.getName());
		});

		it('should return the correct preview file name with the specified output format', () => {
			const { fileRecord } = setup();

			const previewName = fileRecord.getPreviewName(PreviewOutputMimeTypes.IMAGE_WEBP);

			expect(previewName).toBe('file.webp');
		});
	});

	describe('setSizeInByte', () => {
		it('should set the size if it is within valid range', () => {
			const fileRecord = fileRecordTestFactory().build();
			const newSize = 2048;
			const maxSize = 4096;

			// Call the function
			fileRecord['setSizeInByte'](newSize, maxSize);

			// Assert the size is updated
			expect(fileRecord.sizeInByte).toBe(newSize);
		});

		it('should throw BadRequestException if size is less than or equal to 0', () => {
			const fileRecord = fileRecordTestFactory().build();
			const invalidSize = 0;
			const maxSize = 4096;

			// Assert exception is thrown
			expect(() => fileRecord['setSizeInByte'](invalidSize, maxSize)).toThrow(BadRequestException);
			expect(() => fileRecord['setSizeInByte'](invalidSize, maxSize)).toThrowError(ErrorType.FILE_IS_EMPTY);
		});

		it('should throw BadRequestException if size exceeds maxSizeInByte', () => {
			const fileRecord = fileRecordTestFactory().build();
			const invalidSize = 8192;
			const maxSize = 4096;

			// Assert exception is thrown
			expect(() => fileRecord['setSizeInByte'](invalidSize, maxSize)).toThrow(BadRequestException);
			expect(() => fileRecord['setSizeInByte'](invalidSize, maxSize)).toThrowError(ErrorType.FILE_TOO_BIG);
		});
	});

	describe('createPreviewFilePath', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build({ name: 'file.txt' });
			const inputHash = 'randomHash';
			const props = fileRecord.getProps();
			const expectedPath = ['previews', props.storageLocationId, props.id, inputHash].join('/');

			return { fileRecord, inputHash, expectedPath };
		};

		it('should create path', () => {
			const { fileRecord, inputHash, expectedPath } = setup();

			const path = fileRecord.createPreviewFilePath(inputHash);

			expect(path).toBe(expectedPath);
		});
	});

	describe('createPreviewDirectoryPath', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build({ name: 'file.txt' });
			const props = fileRecord.getProps();
			const expectedPath = ['previews', props.storageLocationId, props.id].join('/');

			return { fileRecord, expectedPath };
		};

		it('should create path', () => {
			const { fileRecord, expectedPath } = setup();

			const path = fileRecord.createPreviewDirectoryPath();

			expect(path).toBe(expectedPath);
		});
	});
});
