import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
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
});
