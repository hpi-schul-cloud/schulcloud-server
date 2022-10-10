import { NotImplementedException } from '@nestjs/common';
import { ShareTokenContextType } from '@shared/domain';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { ShareTokenContextTypeMapper } from './context-type.mapper';

describe('ShareTokenContextTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenContextType.School);
			expect(result).toBe(AllowedAuthorizationEntityType.School);
		});
		it('should throw Error', () => {
			const exec = () => {
				ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType('' as ShareTokenContextType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
