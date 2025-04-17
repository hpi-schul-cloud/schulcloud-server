import { fileRecordTestFactory } from '../testing';
import { FileRecord, PreviewOutputMimeTypes, PreviewStatus, ScanStatus } from './file-record.do';

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

	describe('FileRecord.markForDelete', () => {
		const setup = () => {
			const fileRecords = fileRecordTestFactory().buildList(3);

			return { fileRecords };
		};

		it('should mark files for delete', () => {
			const { fileRecords } = setup();

			const markedFileRecords = FileRecord.markForDelete(fileRecords);

			expect(markedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: expect.any(Date) }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: expect.any(Date) }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: expect.any(Date) }),
				])
			);
		});
	});

	describe('FileRecord.unmarkForDelete', () => {
		const setup = () => {
			const fileRecords = fileRecordTestFactory().withDeletedSince().buildList(3);

			return { fileRecords };
		};

		it('should mark files for delete', () => {
			const { fileRecords } = setup();

			const markedFileRecords = FileRecord.unmarkForDelete(fileRecords);

			expect(markedFileRecords).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ ...fileRecords[0], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[1], deletedSince: undefined }),
					expect.objectContaining({ ...fileRecords[2], deletedSince: undefined }),
				])
			);
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
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build();

			return { fileRecord };
		};

		it('should return PREVIEW_POSSIBLE if security check is verified and MIME type is valid', () => {
			const fileRecord = fileRecordTestFactory().withScanStatus(ScanStatus.VERIFIED).build({ mimeType: 'image/png' });

			const status = fileRecord.getPreviewStatus();

			expect(status).toBe(PreviewStatus.PREVIEW_POSSIBLE);
		});

		it('should return PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE if MIME type is invalid', () => {
			const { fileRecord } = setup();

			jest.spyOn(fileRecord, 'isPreviewPossible').mockReturnValue(false);

			const status = fileRecord.getPreviewStatus();

			expect(status).toBe(PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE);
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
