import { MikroORM } from '@mikro-orm/core';
import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { fileRecordFactory, setupEntities } from '@shared/testing';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import {
	DownloadFileParams,
	FileRecordListResponse,
	FileRecordParams,
	FileRecordResponse,
	SingleFileParams,
} from '../controller/dto';
import { FilesStorageMapper } from './files-storage.mapper';

describe('FilesStorageMapper', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

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
		it('should throw Error', () => {
			const exec = () => {
				FilesStorageMapper.mapToAllowedAuthorizationEntityType('' as FileRecordParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});

	describe('mapToSingleFileParams is called', () => {
		const setup = () => {
			const { id: fileRecordId, name: fileName } = fileRecordFactory.buildWithId();
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
			const fileRecord = fileRecordFactory.buildWithId();

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

			expect(result).toEqual({
				schoolId: fileRecord.schoolId,
				parentId: fileRecord.parentId,
				parentType: fileRecord.parentType,
			});
		});
	});

	describe('mapToFileRecordResponse is called', () => {
		it('should return FileRecordResponse DO', () => {
			const fileRecord = fileRecordFactory.buildWithId();

			const result = FilesStorageMapper.mapToFileRecordResponse(fileRecord);

			const expectedFileRecordResponse: FileRecordResponse = {
				id: fileRecord.id,
				name: fileRecord.name,
				size: fileRecord.size,
				securityCheckStatus: fileRecord.securityCheck.status,
				parentId: fileRecord.parentId,
				creatorId: fileRecord.creatorId,
				type: fileRecord.mimeType,
				parentType: fileRecord.parentType,
				deletedSince: fileRecord.deletedSince,
			};

			expect(result).toEqual(expectedFileRecordResponse);
		});
	});

	describe('mapToFileRecordListResponse is called', () => {
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
