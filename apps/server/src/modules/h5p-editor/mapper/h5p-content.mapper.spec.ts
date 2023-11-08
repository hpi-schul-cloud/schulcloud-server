import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { NotImplementedException } from '@nestjs/common';
import { H5PContentParentType } from '../entity';
import { H5PContentMapper } from './h5p-content.mapper';

describe('H5PContentMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = H5PContentMapper.mapToAllowedAuthorizationEntityType(H5PContentParentType.Lesson);
			expect(result).toBe(AuthorizableReferenceType.Lesson);
		});

		it('should throw NotImplementedException', () => {
			const exec = () => {
				H5PContentMapper.mapToAllowedAuthorizationEntityType('' as H5PContentParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
