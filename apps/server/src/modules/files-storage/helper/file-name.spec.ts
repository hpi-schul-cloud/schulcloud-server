import { MikroORM } from '@mikro-orm/core';
import { ConflictException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { checkDuplicatedNames, hasDuplicateName, modifyFileNameInScope, resolveFileNameDuplicates } from '.';
import { ErrorType } from '../error';

describe('File Name Helper', () => {
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

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
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

				const result = checkDuplicatedNames(fileRecords, newFileName);

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

				expect(() => checkDuplicatedNames(fileRecords, newFileName)).toThrowError(
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

				const result = modifyFileNameInScope(fileRecord, fileRecords, newFileName);

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

				expect(() => modifyFileNameInScope(fileRecord, fileRecords, newFileName)).toThrowError(
					new ConflictException(ErrorType.FILE_NAME_EXISTS)
				);
			});
		});
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
});
