import { MikroORM } from '@mikro-orm/core';
import { ConflictException } from '@nestjs/common';
import { EntityId } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { ObjectId } from 'bson';
import { checkDuplicatedNames, modifyFileNameInScope } from '.';
import { ErrorType } from '../../error';

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
});
