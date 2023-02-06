import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FileRecordParentType, FileRecordTestFactory } from '../domain';
import { FilesStorageMapper } from './files-storage.mapper';

describe('FilesStorageMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Course);
			expect(result).toBe(AllowedAuthorizationEntityType.Course);
		});

		it('should return allowed type equal Task', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Task);
			expect(result).toBe(AllowedAuthorizationEntityType.Task);
		});

		it('should return allowed type equal School', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.School);
			expect(result).toBe(AllowedAuthorizationEntityType.School);
		});

		it('should return allowed type equal User', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.User);
			expect(result).toBe(AllowedAuthorizationEntityType.User);
		});

		it('should return allowed type equal Submission', () => {
			const result = FilesStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Submission);
			expect(result).toBe(AllowedAuthorizationEntityType.Submission);
		});

		it('should throw Error', () => {
			const exec = () => {
				FilesStorageMapper.mapToAllowedAuthorizationEntityType('' as FileRecordParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});

	describe('mapToSingleFileParams is called', () => {
		const setup = () => {
			const fileRecord = FileRecordTestFactory.build();
			const fileRecordId = fileRecord.id;
			const fileName = fileRecord.getName();
			const downloadFileParams: DownloadFileParams = { fileRecordId, fileName };

			return { downloadFileParams, fileRecordId };
		};

		it('should return single file params', () => {
			const { downloadFileParams, fileRecordId } = setup();
			const epectedSingleFileParams: SingleFileParams = { fileRecordId };

			const result = FilesStorageMapper.mapToSingleFileParams(downloadFileParams);

			expect(result).toEqual(epectedSingleFileParams);
		});
	});

	describe('mapFileRecordToFileRecordParams is called', () => {
		const setup = () => {
			const fileRecord = FileRecordTestFactory.build();

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

			const result = FilesStorageMapper.mapFileRecordToFileRecordParams(fileRecord);
			const props = fileRecord.getProps();

			expect(result).toEqual({
				schoolId: props.schoolId,
				parentId: props.parentId,
				parentType: props.parentType,
			});
		});
	});

	describe('mapToFileRecordResponse is called', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = FileRecordTestFactory.build();

			const result = FilesStorageMapper.mapToFileRecordResponse(fileRecord);

			const props = fileRecord.getProps();

			const expectedFileRecordResponse: FileRecordResponse = {
				id: fileRecord.id,
				name: props.name,
				size: props.size,
				securityCheckStatus: props.securityCheck.status,
				parentId: props.parentId,
				creatorId: props.creatorId,
				type: props.mimeType,
				parentType: props.parentType,
				deletedSince: props.deletedSince,
			};

			expect(result).toEqual(expectedFileRecordResponse);
		});
	});

	describe('mapToFileRecordListResponse is called', () => {
		it('should return instance of FileRecordListResponse', () => {
			const fileRecords = FileRecordTestFactory.buildList(3);

			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result).toBeInstanceOf(FileRecordListResponse);
		});

		it('should contains props [data, total, skip, limit]', () => {
			const fileRecords = FileRecordTestFactory.buildList(3);

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
			const fileRecords = FileRecordTestFactory.buildList(3);

			const result = FilesStorageMapper.mapToFileRecordListResponse(fileRecords, fileRecords.length);

			expect(result.data).toBeInstanceOf(Array);
			expect(result.data[0]).toBeInstanceOf(FileRecordResponse);
		});
	});
});
