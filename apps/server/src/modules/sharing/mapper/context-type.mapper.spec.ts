import { NotImplementedException } from '@nestjs/common';
import { AuthorizableReferenceType } from '@src/modules/authorization';
import { ShareTokenContextType } from '../domainobject/share-token.do';
import { ShareTokenContextTypeMapper } from './context-type.mapper';

describe('ShareTokenContextTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenContextType.School);
			expect(result).toBe(AuthorizableReferenceType.School);
		});
		it('should throw Error', () => {
			const exec = () => {
				ShareTokenContextTypeMapper.mapToAllowedAuthorizationEntityType('' as ShareTokenContextType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
