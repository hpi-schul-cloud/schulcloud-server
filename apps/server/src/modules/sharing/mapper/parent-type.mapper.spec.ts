import { NotImplementedException } from '@nestjs/common';
import { AuthorizableReferenceType } from '@modules/authorization/domain';
import { ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenParentTypeMapper } from './parent-type.mapper';

describe('ShareTokenParentTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Course);
			expect(result).toBe(AuthorizableReferenceType.Course);
		});
		it('should return allowed type equal Lesson', () =>
			expect(ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Lesson)).toBe(
				AuthorizableReferenceType.Lesson
			));
		it('should return allowed type equal Task', () =>
			expect(ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Task)).toBe(
				AuthorizableReferenceType.Task
			));
		it('should return allowed type equal BoardNode', () =>
			expect(ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.ColumnBoard)).toBe(
				AuthorizableReferenceType.BoardNode
			));
		it('should throw Error', () => {
			const exec = () => {
				ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType('' as ShareTokenParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
