import { RoleName } from '@shared/domain/interface';
import { FilterRoleType, UserRole } from '../controller/dto';
import { ImportUserRoleName } from '../entity';
import { RoleNameMapper } from './role-name.mapper';

describe('[RoleNameMapper]', () => {
	describe('mapToResponse (from domain)', () => {
		it('should map admin role to response', () => {
			const roleName = RoleName.ADMINISTRATOR;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(UserRole.ADMIN);
		});
		it('should map teacher role to response', () => {
			const roleName = RoleName.TEACHER;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(UserRole.TEACHER);
		});
		it('should map student role to response', () => {
			const roleName = RoleName.STUDENT;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(UserRole.STUDENT);
		});
		it('should fail for invalid input', () => {
			const roleName = 'foo' as unknown as ImportUserRoleName;
			expect(() => RoleNameMapper.mapToResponse(roleName)).toThrowError('invalid role name from domain');
		});
	});
	describe('mapToDomain (from query)', () => {
		it('should map admin role to domain', () => {
			const roleName = FilterRoleType.ADMIN;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.ADMINISTRATOR);
		});
		it('should map teacher role to domain', () => {
			const roleName = FilterRoleType.TEACHER;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.TEACHER);
		});
		it('should map student role to domain', () => {
			const roleName = FilterRoleType.STUDENT;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.STUDENT);
		});
		it('should fail for invalid input', () => {
			const roleName = 'foo' as unknown as FilterRoleType;
			expect(() => RoleNameMapper.mapToDomain(roleName)).toThrowError('invalid role name from query');
		});
	});
});
