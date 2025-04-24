import { AuthorizationBodyParamsReferenceType } from '@infra/authorization-client';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { NotImplementedException } from '@nestjs/common';
import { PreviewStatus, StorageLocation } from '../../domain';
import { FileRecordParentType } from '../../domain/interface';
import { fileRecordTestFactory } from '../../testing';
import { FileRecordListResponse, FileRecordResponse } from '../dto';
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

	describe('mapToAllowedStorageLocationType()', () => {
		it('should return allowed type equal SCHOOL', () => {
			const result = FilesStorageMapper.mapToAllowedStorageLocationType(StorageLocation.SCHOOL);
			expect(result).toBe(AuthorizationBodyParamsReferenceType.SCHOOLS);
		});

		it('should return allowed type equal INSTANCES', () => {
			const result = FilesStorageMapper.mapToAllowedStorageLocationType(StorageLocation.INSTANCE);
			expect(result).toBe(AuthorizationBodyParamsReferenceType.INSTANCES);
		});

		it('should throw Error', () => {
			const exec = () => {
				FilesStorageMapper.mapToAllowedStorageLocationType('' as StorageLocation);
			};
			expect(exec).toThrowError(NotImplementedException);
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
