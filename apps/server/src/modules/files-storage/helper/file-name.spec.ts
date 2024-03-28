import { EntityId } from '@shared/domain/types';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import crypto from 'crypto';
import { createPreviewNameHash, hasDuplicateName, resolveFileNameDuplicates } from '.';
import { FileRecord } from '../entity';
import { PreviewOutputMimeTypes } from '../interface/preview-output-mime-types.enum';

describe('File Name Helper', () => {
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
		await setupEntities([FileRecord]);
	});

	describe('hasDuplicateName is called', () => {
		describe('WHEN all fileRecords have different names', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return undefined', () => {
				const { fileRecords, newFileName } = setup();

				const result = hasDuplicateName(fileRecords, newFileName);

				expect(result).toBeUndefined();
			});
		});

		describe('WHEN fileRecords with new FileName already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';
				fileRecords[1].name = newFileName;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file record with duplicate name', () => {
				const { fileRecords, newFileName } = setup();

				const result = hasDuplicateName(fileRecords, newFileName);

				expect(result).toEqual(fileRecords[1]);
			});
		});
	});

	describe('resolveFileNameDuplicates is called', () => {
		describe('WHEN no duplicate without file type suffix exists', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return original file name', () => {
				const { newFileName, fileRecords } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(newFileName);
			});
		});

		describe('WHEN no duplicate with file type suffix exists', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed.txt';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return original file name', () => {
				const { newFileName, fileRecords } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(newFileName);
			});
		});

		describe('WHEN no duplicate with file type suffix and second dot exists', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed.file.txt';

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return original file name', () => {
				const { newFileName, fileRecords } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(newFileName);
			});
		});

		describe('WHEN one fileRecord with file name and file type suffix already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed.jpeg';
				fileRecords[0].name = newFileName;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file name with (1) suffix', () => {
				const { fileRecords, newFileName } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(`renamed (1).jpeg`);
			});
		});

		describe('WHEN one fileRecord with file name and without file type suffix already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed';
				fileRecords[0].name = newFileName;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file name with (1) suffix', () => {
				const { fileRecords, newFileName } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(`renamed (1)`);
			});
		});

		describe('WHEN one fileRecord with file name and file type suffix and number suffix already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed (1).jpeg';
				fileRecords[0].name = newFileName;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file name with (1) suffix', () => {
				const { fileRecords, newFileName } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(`renamed (1) (1).jpeg`);
			});
		});

		describe('WHEN two fileRecords with file name already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed.jpeg';
				fileRecords[0].name = newFileName;
				fileRecords[1].name = `renamed (1).jpeg`;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file name with (1) suffix', () => {
				const { fileRecords, newFileName } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(`renamed (2).jpeg`);
			});
		});

		describe('WHEN two fileRecords with without and with number suffix (2) in file name already exist', () => {
			const setup = () => {
				const fileRecords = setupFileRecords();
				const newFileName = 'renamed.jpeg';
				fileRecords[0].name = newFileName;
				fileRecords[1].name = `renamed (2).jpeg`;

				return {
					newFileName,
					fileRecords,
				};
			};

			it('should return file name with (1) suffix', () => {
				const { fileRecords, newFileName } = setup();

				const result = resolveFileNameDuplicates(newFileName, fileRecords);

				expect(result).toBe(`renamed (1).jpeg`);
			});
		});
	});

	describe('createPreviewNameHash is called', () => {
		describe('when preview params are set', () => {
			it('should return hash', () => {
				const fileRecordId = new ObjectId().toHexString();
				const width = 100;
				const outputFormat = PreviewOutputMimeTypes.IMAGE_WEBP;
				const previewParams = {
					width,
					outputFormat,
				};
				const fileParamsString = `${fileRecordId}${width}${outputFormat}`;
				const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

				const result = createPreviewNameHash(fileRecordId, previewParams);

				expect(result).toBe(hash);
			});
		});

		describe('when preview params are not set', () => {
			it('should return hash', () => {
				const fileRecordId = new ObjectId().toHexString();
				const fileParamsString = `${fileRecordId}${PreviewOutputMimeTypes.IMAGE_WEBP}`;
				const hash = crypto.createHash('md5').update(fileParamsString).digest('hex');

				const result = createPreviewNameHash(fileRecordId, { outputFormat: PreviewOutputMimeTypes.IMAGE_WEBP });

				expect(result).toBe(hash);
			});
		});
	});
});
