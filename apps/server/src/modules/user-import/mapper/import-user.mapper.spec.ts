import { MikroORM, Reference } from '@mikro-orm/core';
import { MatchCreator, MatchCreatorScope, RoleName } from '@shared/domain';
import { importUserFactory, setupEntities, userFactory } from '@shared/testing';
import { ImportUserFilterQuery, MatchFilterQuery, RoleNameFilterQuery, UserResponse } from '../controller/dto';
import { ImportUserMapper } from './import-user.mapper';
import { ImportUserMatchMapper } from './match.mapper';
import { RoleNameMapper } from './role-name.mapper';
import { UserMapper } from './user.mapper';

describe('[ImportUserMapper]', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('[mapToResponse] from domain', () => {
		it('should map simple types', async () => {
			const importUser = importUserFactory.buildWithId({
				firstName: 'Eva',
				lastName: 'Rakäthe',
				classNames: ['firstClass'],
				roleNames: [RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMIN],
				ldapDn: 'uid=Eva_Rak123,foo=bar,...',
				flagged: true,
			});
			const result = await ImportUserMapper.mapToResponse(importUser);
			const expected = {
				flagged: true,
				importUserId: importUser.id,
				loginName: 'Eva_Rak123',
				firstName: 'Eva',
				lastName: 'Rakäthe',
				roleNames: ['student', 'teacher', 'admin'],
				classNames: ['firstClass'],
			};
			expect(result).toEqual(expected);
		});
		it('should skip login name for optional ldapDn', async () => {
			const importUser = importUserFactory.build({ ldapDn: undefined });
			const result = await ImportUserMapper.mapToResponse(importUser);
			expect(result.loginName).toEqual('');
		});
		it('should skip and not fail for login name for wrong format of ldapDn', async () => {
			const importUser = importUserFactory.build({ ldapDn: 'wrong_format=foo,bar...' });
			const result = await ImportUserMapper.mapToResponse(importUser);
			expect(result.loginName).toEqual('');
		});
		describe('when user and matchedBy is defined', () => {
			it('should map match', async () => {
				const user = userFactory.build();
				const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build();
				const mockResponse = Object.create(UserResponse, {}) as UserResponse;
				const userMapperSpy = jest.spyOn(UserMapper, 'mapToResponse').mockResolvedValueOnce(mockResponse);
				const result = await ImportUserMapper.mapToResponse(importUser);
				expect(result.match).toEqual(mockResponse);
				expect(userMapperSpy).toBeCalledWith(new Reference(user), MatchCreator.AUTO);
				userMapperSpy.mockRestore();
			});
		});
	});
	describe('[mapImportUserFilterQueryToDomain]', () => {
		it('should skip all params for empty query to scope', () => {
			const query: ImportUserFilterQuery = {};
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result).toEqual({});
		});
		it('should map first name from query to scope', () => {
			const query: ImportUserFilterQuery = { firstName: 'Cinderella' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.firstName).toEqual(query.firstName);
		});
		it('should map last name from query to scope', () => {
			const query: ImportUserFilterQuery = { lastName: 'Mr. Bond' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.lastName).toEqual(query.lastName);
		});
		it('should map login name from query to scope', () => {
			const query: ImportUserFilterQuery = { loginName: 'first_last_name_123' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.loginName).toEqual(query.loginName);
		});
		it('should map role names from query to scope', () => {
			const query: ImportUserFilterQuery = { role: RoleNameFilterQuery.STUDENT };
			const roleNameMapperSpy = jest.spyOn(RoleNameMapper, 'mapToDomain').mockReturnValueOnce(RoleName.STUDENT);
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.role).toEqual(RoleName.STUDENT);
			expect(roleNameMapperSpy).toBeCalledWith(RoleNameFilterQuery.STUDENT);
			roleNameMapperSpy.mockRestore();
		});
		it('should map classes from query to scope', () => {
			const query: ImportUserFilterQuery = { classes: 'second class' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.classes).toEqual(query.classes);
		});
		it('should map match types from query to scope', () => {
			const query: ImportUserFilterQuery = { match: [MatchFilterQuery.MANUAL] };
			const importUserMatchMapperSpy = jest
				.spyOn(ImportUserMatchMapper, 'mapImportUserMatchScopeToDomain')
				.mockReturnValueOnce(MatchCreatorScope.MANUAL);
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.matches).toEqual([MatchCreatorScope.MANUAL]);
			expect(importUserMatchMapperSpy).toBeCalledWith(MatchFilterQuery.MANUAL);
			importUserMatchMapperSpy.mockRestore();
		});
		it('should map flagged true from query to scope', () => {
			const query: ImportUserFilterQuery = { flagged: true };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.flagged).toEqual(true);
		});
		it('should skip flagged false from query to scope', () => {
			const query: ImportUserFilterQuery = { flagged: false };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.flagged).toBeUndefined();
		});
	});
});
