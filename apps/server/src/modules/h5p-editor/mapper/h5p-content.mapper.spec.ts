import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { NotImplementedException } from '@nestjs/common';
import { H5PContentParentType } from '../types';
import { H5PContentMapper } from './h5p-content.mapper';

describe(H5PContentMapper.name, () => {
	describe('mapToAllowedAuthorizationEntityType', () => {
		describe('when H5PContentParentType is Board_Element', () => {
			it('should return allowed AuthorizableReferenceType equal to BoardNode', () => {
				const result = H5PContentMapper.mapToAllowedAuthorizationEntityType(H5PContentParentType.BoardElement);

				expect(result).toBe(AuthorizableReferenceType.BoardNode);
			});
		});

		describe('when H5PContentParentType is unknown', () => {
			it('should throw NotImplementedException', () => {
				const exec = () => {
					H5PContentMapper.mapToAllowedAuthorizationEntityType('' as H5PContentParentType);
				};
				expect(exec).toThrowError(NotImplementedException);
			});
		});
	});
});
