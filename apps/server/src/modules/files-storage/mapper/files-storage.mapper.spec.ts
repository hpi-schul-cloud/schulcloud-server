import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { NotImplementedException } from '@nestjs/common';
import { FileRecordListResponse, FileRecordParams, FileRecordResponse } from '../api/dto';
import { PreviewStatus } from '../domain';
import { FileRecordParentType } from '../domain/interface';
import { fileRecordTestFactory } from '../testing';
import { FilesStorageMapper } from './files-storage.mapper';

describe('FilesStorageMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Course);
			expect(result).toBe(AuthorizableReferenceType.Course);
		});

		it('should return allowed type equal Task', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Task);
			expect(result).toBe(AuthorizableReferenceType.Task);
		});

		it('should return allowed type equal School', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.School);
			expect(result).toBe(AuthorizableReferenceType.School);
		});

		it('should return allowed type equal User', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.User);
			expect(result).toBe(AuthorizableReferenceType.User);
		});

		it('should return allowed type equal Submission', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Submission);
			expect(result).toBe(AuthorizableReferenceType.Submission);
		});

		it('should return allowed type equal ExternalTool', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.ExternalTool);
			expect(result).toBe(AuthorizableReferenceType.ExternalTool);
		});

		it('should throw Error', () => {
			const exec = () => {
				FilesStorageMapper.mapToAllowedAuthorizationEntityType('' as FileRecordParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});

	describe('mapFileRecordToFileRecordParams is called', () => {
		const setup = () => {
			const fileRecord = fileRecordTestFactory().build();

			return {
				fileRecord,
			};
		};

		it('should return expected instance of params', () => {
			const { fileRecord } = setup();

			const result = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);

			expect(result).toBeInstanceOf(FileRecordParams);
		});

		it('should return correct mapped values', () => {
			const { fileRecord } = setup();
			const parentInfo = fileRecord.getParentInfo();

			const result = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);

			expect(result).toEqual({
				storageLocationId: parentInfo.storageLocationId,
				storageLocation: parentInfo.storageLocation,
				parentId: parentInfo.parentId,
				parentType: parentInfo.parentType,
			});
		});
	});

	describe('mapToFileRecordResponse is called', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = fileRecordTestFactory().build();
			const props = fileRecord.getProps();
			const securityCheckProps = fileRecord.getSecurityCheckProps();

			const result = FilesStorageMapper.mapToFileRecordResponse(fileRecord);

			const expectedFileRecordResponse: FileRecordResponse = {
				id: props.id,
				name: props.name,
				url: expect.any(String),
				size: props.size,
				securityCheckStatus: securityCheckProps.status,
				parentId: props.parentId,
				creatorId: props.creatorId,
				mimeType: props.mimeType,
				parentType: props.parentType,
				deletedSince: props.deletedSince,
				previewStatus: PreviewStatus.PREVIEW_NOT_POSSIBLE_WRONG_MIME_TYPE,
				createdAt: props.createdAt,
				updatedAt: props.updatedAt,
			};

			expect(result).toEqual(expectedFileRecordResponse);
		});
	});

	describe('mapToFileRecordListResponse is called', () => {
		it('should return instance of FileRecordListResponse', () => {
			const fileRecords = fileRecordTestFactory().buildList(3);

			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result).toBeInstanceOf(FileRecordListResponse);
		});

		it('should contains props [data, total, skip, limit]', () => {
			const fileRecords = fileRecordTestFactory().buildList(3);

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
			const fileRecords = fileRecordTestFactory().buildList(3);

			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result.data).toBeInstanceOf(Array);
			expect(result.data[0]).toBeInstanceOf(FileRecordResponse);
		});
	});
});
