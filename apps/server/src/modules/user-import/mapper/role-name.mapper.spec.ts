import { RoleName } from '@shared/domain';
import { RoleNameFilterQuery, RoleNameResponse } from '../controller/dto';
import { RoleNameMapper } from './role-name.mapper';

describe('[RoleNameMapper]', () => {
	describe('mapToResponse (from domain)', () => {
		it('should map admin role to response', () => {
			const roleName = RoleName.ADMIN;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(RoleNameResponse.ADMIN);
		});
		it('should map teacher role to response', () => {
			const roleName = RoleName.TEACHER;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(RoleNameResponse.TEACHER);
		});
		it('should map student role to response', () => {
			const roleName = RoleName.STUDENT;
			const result = RoleNameMapper.mapToResponse(roleName);
			expect(result).toEqual(RoleNameResponse.STUDENT);
		});
		it('should fail for invalid input', () => {
			const roleName = 'foo' as unknown as RoleName;
			expect(() => RoleNameMapper.mapToResponse(roleName)).toThrowError('invalid role name from domain');
		});
	});
	describe('mapToDomain (from query)', () => {
		it('should map admin role to domain', () => {
			const roleName = RoleNameFilterQuery.ADMIN;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.ADMIN);
		});
		it('should map teacher role to domain', () => {
			const roleName = RoleNameFilterQuery.TEACHER;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.TEACHER);
		});
		it('should map student role to domain', () => {
			const roleName = RoleNameFilterQuery.STUDENT;
			const result = RoleNameMapper.mapToDomain(roleName);
			expect(result).toEqual(RoleName.STUDENT);
		});
		it('should fail for invalid input', () => {
			const roleName = 'foo' as unknown as RoleNameFilterQuery;
			expect(() => RoleNameMapper.mapToDomain(roleName)).toThrowError('invalid role name from query');
		});
	});
});
