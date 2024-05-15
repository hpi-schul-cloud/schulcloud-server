import { BadRequestException } from '@nestjs/common';
import { MatchCreator } from '@shared/domain/entity';
import { RoleName, SortOrder } from '@shared/domain/interface';
import { MatchCreatorScope } from '@shared/domain/types';
import { importUserFactory, schoolEntityFactory, setupEntities, userFactory } from '@shared/testing/factory';
import {
	FilterImportUserParams,
	FilterMatchType,
	FilterRoleType,
	ImportUserSortOrder,
	SortImportUserParams,
	UserMatchResponse,
} from '../controller/dto';
import { ImportUserMapper } from './import-user.mapper';
import { ImportUserMatchMapper } from './match.mapper';
import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

describe('[ImportUserMapper]', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('[mapSortingQueryToDomain] from query to domain', () => {
		it('should accept firstName', () => {
			const sortingQuery: SortImportUserParams = {
				sortBy: ImportUserSortOrder.FIRSTNAME,
				sortOrder: SortOrder.desc,
			};
			const result = ImportUserMapper.mapSortingQueryToDomain(sortingQuery);
			expect(result).toEqual({ firstName: 'desc' });
		});
		it('should accept lastName', () => {
			const sortingQuery: SortImportUserParams = {
				sortBy: ImportUserSortOrder.LASTNAME,
				sortOrder: SortOrder.desc,
			};
			const result = ImportUserMapper.mapSortingQueryToDomain(sortingQuery);
			expect(result).toEqual({ lastName: 'desc' });
		});
		it('should accept asc order', () => {
			const sortingQuery: SortImportUserParams = {
				sortBy: ImportUserSortOrder.FIRSTNAME,
				sortOrder: SortOrder.asc,
			};
			const result = ImportUserMapper.mapSortingQueryToDomain(sortingQuery);
			expect(result).toEqual({ firstName: 'asc' });
		});
		it('should not accept loginName or others', () => {
			const sortingQuery: SortImportUserParams = {
				sortBy: 'loginName' as ImportUserSortOrder,
				sortOrder: SortOrder.desc,
			};
			expect(() => ImportUserMapper.mapSortingQueryToDomain(sortingQuery)).toThrowError(BadRequestException);
		});
		describe('when sortBy is not given', () => {
			it('should return undefined', () => {
				const sortingQuery: SortImportUserParams = { sortOrder: SortOrder.desc };
				expect(ImportUserMapper.mapSortingQueryToDomain(sortingQuery)).toBeUndefined();
			});
		});
	});

	describe('[mapToResponse] from domain', () => {
		it('should map simple types', () => {
			const importUser = importUserFactory.buildWithId({
				firstName: 'Eva',
				lastName: 'Rakäthe',
				classNames: ['firstClass'],
				roleNames: [RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMINISTRATOR],
				ldapDn: 'uid=Eva_Rak123,foo=bar,...',
				flagged: true,
			});
			const result = ImportUserMapper.mapToResponse(importUser);
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
		it('should skip login name for optional ldapDn', () => {
			const importUser = importUserFactory.build({ ldapDn: undefined });
			const result = ImportUserMapper.mapToResponse(importUser);
			expect(result.loginName).toEqual('');
		});
		it('should skip and not fail for login name for wrong format of ldapDn', () => {
			const importUser = importUserFactory.build({ ldapDn: 'wrong_format=foo,bar...' });
			const result = ImportUserMapper.mapToResponse(importUser);
			expect(result.loginName).toEqual('');
		});
		describe('when user and matchedBy is defined', () => {
			it('should map match', () => {
				const school = schoolEntityFactory.buildWithId();
				const user = userFactory.build({ school });
				const importUser = importUserFactory.matched(MatchCreator.AUTO, user).build({ school });
				const mockResponse = Object.create(UserMatchResponse, {}) as UserMatchResponse;
				const userMapperSpy = jest.spyOn(UserMatchMapper, 'mapToResponse').mockReturnValue(mockResponse);
				const result = ImportUserMapper.mapToResponse(importUser);
				expect(result.match).toEqual(mockResponse);
				expect(userMapperSpy).toBeCalledWith(user, MatchCreator.AUTO);
				userMapperSpy.mockRestore();
			});
		});
	});
	describe('[mapImportUserFilterQueryToDomain]', () => {
		it('should skip all params for empty query to scope', () => {
			const query: FilterImportUserParams = {};
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result).toEqual({});
		});
		it('should map first name from query to scope', () => {
			const query: FilterImportUserParams = { firstName: 'Cinderella' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.firstName).toEqual(query.firstName);
		});
		it('should map last name from query to scope', () => {
			const query: FilterImportUserParams = { lastName: 'Mr. Bond' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.lastName).toEqual(query.lastName);
		});
		it('should map login name from query to scope', () => {
			const query: FilterImportUserParams = { loginName: 'first_last_name_123' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.loginName).toEqual(query.loginName);
		});
		it('should map role names from query to scope', () => {
			const query: FilterImportUserParams = { role: FilterRoleType.STUDENT };
			const roleNameMapperSpy = jest.spyOn(RoleNameMapper, 'mapToDomain').mockReturnValueOnce(RoleName.STUDENT);
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.role).toEqual(RoleName.STUDENT);
			expect(roleNameMapperSpy).toBeCalledWith(FilterRoleType.STUDENT);
			roleNameMapperSpy.mockRestore();
		});
		it('should map classes from query to scope', () => {
			const query: FilterImportUserParams = { classes: 'second class' };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.classes).toEqual(query.classes);
		});
		it('should map match types from query to scope', () => {
			const query: FilterImportUserParams = { match: [FilterMatchType.MANUAL] };
			const importUserMatchMapperSpy = jest
				.spyOn(ImportUserMatchMapper, 'mapImportUserMatchScopeToDomain')
				.mockReturnValueOnce(MatchCreatorScope.MANUAL);
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.matches).toEqual([MatchCreatorScope.MANUAL]);
			expect(importUserMatchMapperSpy).toBeCalledWith(FilterMatchType.MANUAL);
			importUserMatchMapperSpy.mockRestore();
		});
		it('should map flagged true from query to scope', () => {
			const query: FilterImportUserParams = { flagged: true };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.flagged).toEqual(true);
		});
		it('should skip flagged false from query to scope', () => {
			const query: FilterImportUserParams = { flagged: false };
			const result = ImportUserMapper.mapImportUserFilterQueryToDomain(query);
			expect(result.flagged).toBeUndefined();
		});
	});
});
