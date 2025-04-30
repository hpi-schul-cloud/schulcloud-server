import { fileRecordTestFactory } from '../../testing';
import { FileRecordListResponse, FileRecordResponse } from '../dto';
import { FileRecordMapper } from './file-record.mapper';

describe('FilesStorageMapper', () => {
	describe('mapToFileRecordResponse()', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = fileRecordTestFactory().build();
			const result = FileRecordMapper.mapToFileRecordResponse(fileRecord);
			expect(result).toEqual(
				expect.objectContaining({
					creatorId: expect.any(String),
					deletedSince: undefined,
					id: expect.any(String),
					name: 'file-record-name #0',
					parentId: expect.any(String),
					parentType: 'courses',
					securityCheckStatus: 'pending',
					size: expect.any(Number),
					mimeType: 'application/octet-stream',
				})
			);
		});
	});

	describe('mapToFileRecordListResponse()', () => {
		it('should return instance of FileRecordListResponse', () => {
			const fileRecords = fileRecordTestFactory().buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);
			expect(result).toBeInstanceOf(FileRecordListResponse);
		});
		it('should contains props [data, total, skip, limit]', () => {
			const fileRecords = fileRecordTestFactory().buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length, 0, 5);
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
			const fileRecords = fileRecordTestFactory().buildList(3);
			const result = FileRecordMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result.data).toBeInstanceOf(Array);
			expect(result.data[0]).toBeInstanceOf(FileRecordResponse);
		});
	});
});
