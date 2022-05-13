import { NotImplementedException } from '@nestjs/common';
import { FileRecordParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { FileStorageMapper } from './parent-type.mapper';

describe('ParentTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = FileStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Course);
			expect(result).toBe(AllowedAuthorizationEntityType.Course);
		});
		it('should return allowed type equal Task', () => {
			const result = FileStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.Task);
			expect(result).toBe(AllowedAuthorizationEntityType.Task);
		});
		it('should return allowed type equal School', () => {
			const result = FileStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.School);
			expect(result).toBe(AllowedAuthorizationEntityType.School);
		});
		it('should return allowed type equal User', () => {
			const result = FileStorageMapper.mapToAllowedAuthorizationEntityType(FileRecordParentType.User);
			expect(result).toBe(AllowedAuthorizationEntityType.User);
		});
		it('should throw Error', () => {
			const exec = () => {
				FileStorageMapper.mapToAllowedAuthorizationEntityType('' as FileRecordParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
