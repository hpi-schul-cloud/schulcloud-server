import { NotImplementedException } from '@nestjs/common';
import { ShareTokenParentType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { ShareTokenParentTypeMapper } from './parent-type.mapper';

describe('ShareTokenParentTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Course);
			expect(result).toBe(AllowedAuthorizationEntityType.Course);
		});
		it('should throw Error', () => {
			const exec = () => {
				ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType('' as ShareTokenParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
