import { NotImplementedException } from '@nestjs/common';
import { AllowedAuthorizationEntityType } from '@src/modules/authorization/interfaces';
import { ShareTokenParentType } from '../domainobject/share-token.do';
import { ShareTokenParentTypeMapper } from './parent-type.mapper';

describe('ShareTokenParentTypeMapper', () => {
	describe('mapToAllowedAuthorizationEntityType()', () => {
		it('should return allowed type equal Course', () => {
			const result = ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Course);
			expect(result).toBe(AllowedAuthorizationEntityType.Course);
		});
		it('should return allowed type equal Lesson', () =>
			expect(ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Lesson)).toBe(
				AllowedAuthorizationEntityType.Lesson
			));
		it('should return allowed type equal Task', () =>
			expect(ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType(ShareTokenParentType.Task)).toBe(
				AllowedAuthorizationEntityType.Task
			));
		it('should throw Error', () => {
			const exec = () => {
				ShareTokenParentTypeMapper.mapToAllowedAuthorizationEntityType('' as ShareTokenParentType);
			};
			expect(exec).toThrowError(NotImplementedException);
		});
	});
});
