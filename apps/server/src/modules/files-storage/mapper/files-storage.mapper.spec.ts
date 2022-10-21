import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { fileRecordFactory } from '@shared/testing';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { DownloadFileParams, FileRecordParams, SingleFileParams } from '../controller/dto';
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
});
