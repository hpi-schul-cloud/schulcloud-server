import { MikroORM } from '@mikro-orm/core';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { FileRecordListResponse, FileRecordResponse } from '../controller/dto';
import { FileRecord } from '../entity';
import { FilesStorageMapper } from './file-record.mapper';

describe('FilesStorageMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities([FileRecord]);
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('mapToFileRecordResponse()', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = fileRecordFactory.buildWithId();
			const result = FilesStorageMapper.mapToFileRecordResponse(fileRecord);
			expect(result).toEqual(
				expect.objectContaining({
					creatorId: expect.any(String),
					deletedSince: undefined,
					id: expect.any(String),
					name: 'file-record #1',
					parentId: expect.any(String),
					parentType: 'courses',
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					type: 'application/octet-stream',
				})
			);
		});
	});
	describe('mapToFileRecordListResponse()', () => {
		it('should return instance of FileRecordListResponse', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);
			expect(result).toBeInstanceOf(FileRecordListResponse);
		});
		it('should contains props [data, total, skip, limit]', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length, 0, 5);
			expect(result).toEqual(
				expect.objectContaining({
					data: expect.any(Array) as FileRecordResponse[],
					total: fileRecords.length,
					skip: 0,
					limit: 5,
				})
			);
		});
		it('should contains instances of FileRecordResponse', () => {
			const fileRecords = fileRecordFactory.buildList(3);
			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result.data).toBeInstanceOf(Array);
			expect(result.data[0]).toBeInstanceOf(FileRecordResponse);
		});
	});
});
