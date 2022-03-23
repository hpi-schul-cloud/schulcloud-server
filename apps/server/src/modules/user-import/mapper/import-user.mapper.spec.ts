import { MikroORM } from '@mikro-orm/core';
import { BadRequestException } from '@nestjs/common';
import { MatchCreator, MatchCreatorScope, RoleName, SortOrder } from '@shared/domain';
import { importUserFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import {
	ImportUserFilterParams,
	ImportUserSortByParams,
	ImportUserSortingParams,
	MatchFilterParams,
	RoleNameFilterParams,
	UserMatchResponse,
} from '../controller/dto';
import { ImportUserMapper } from './import-user.mapper';
import { ImportUserMatchMapper } from './match.mapper';
import { RoleNameMapper } from './role-name.mapper';
import { UserMatchMapper } from './user-match.mapper';

describe('[ImportUserMapper]', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('[mapSortingParamsToDomain] from params to domain', () => {
		it('should accept firstName', () => {
			const sortingParams: ImportUserSortingParams = {
				sortBy: ImportUserSortByParams.FIRSTNAME,
				sortOrder: SortOrder.desc,
			};
			const result = ImportUserMapper.mapSortingParamsToDomain(sortingParams);
			expect(result).toEqual({ firstName: 'desc' });
		});
		it('should accept lastName', () => {
			const sortingParams: ImportUserSortingParams = {
				sortBy: ImportUserSortByParams.LASTNAME,
				sortOrder: SortOrder.desc,
			};
			const result = ImportUserMapper.mapSortingParamsToDomain(sortingParams);
			expect(result).toEqual({ lastName: 'desc' });
		});
		it('should accept asc order', () => {
			const sortingParams: ImportUserSortingParams = {
				sortBy: ImportUserSortByParams.FIRSTNAME,
				sortOrder: SortOrder.asc,
			};
			const result = ImportUserMapper.mapSortingParamsToDomain(sortingParams);
			expect(result).toEqual({ firstName: 'asc' });
		});
		it('should not accept loginName or others', () => {
			const sortingParams: ImportUserSortingParams = {
				sortBy: 'loginName' as ImportUserSortByParams,
				sortOrder: SortOrder.desc,
			};
			expect(() => ImportUserMapper.mapSortingParamsToDomain(sortingParams)).toThrowError(BadRequestException);
		});
		describe('when sortBy is not given', () => {
			it('should return undefined', () => {
				const sortingParams: ImportUserSortingParams = { sortOrder: SortOrder.desc };
				expect(ImportUserMapper.mapSortingParamsToDomain(sortingParams)).toBeUndefined();
			});
		});
	});

	describe('[mapToResponse] from domain', () => {
		it('should map simple types', () => {
			const importUser = importUserFactory.buildWithId({
				firstName: 'Eva',
				lastName: 'Rakäthe',
				classNames: ['firstClass'],
				roleNames: [RoleName.STUDENT, RoleName.TEACHER, RoleName.ADMIN],
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
				const school = schoolFactory.buildWithId();
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
	describe('[mapImportUserFilterParamsToDomain]', () => {
		it('should skip all params for empty query to scope', () => {
			const query: ImportUserFilterParams = {};
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(query);
			expect(result).toEqual({});
		});
		it('should map first name from params to scope', () => {
			const params: ImportUserFilterParams = { firstName: 'Cinderella' };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.firstName).toEqual(params.firstName);
		});
		it('should map last name from params to scope', () => {
			const params: ImportUserFilterParams = { lastName: 'Mr. Bond' };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.lastName).toEqual(params.lastName);
		});
		it('should map login name from params to scope', () => {
			const params: ImportUserFilterParams = { loginName: 'first_last_name_123' };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.loginName).toEqual(params.loginName);
		});
		it('should map role names from params to scope', () => {
			const params: ImportUserFilterParams = { role: RoleNameFilterParams.STUDENT };
			const roleNameMapperSpy = jest.spyOn(RoleNameMapper, 'mapToDomain').mockReturnValueOnce(RoleName.STUDENT);
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.role).toEqual(RoleName.STUDENT);
			expect(roleNameMapperSpy).toBeCalledWith(RoleNameFilterParams.STUDENT);
			roleNameMapperSpy.mockRestore();
		});
		it('should map classes from params to scope', () => {
			const params: ImportUserFilterParams = { classes: 'second class' };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.classes).toEqual(params.classes);
		});
		it('should map match types from params to scope', () => {
			const params: ImportUserFilterParams = { match: [MatchFilterParams.MANUAL] };
			const importUserMatchMapperSpy = jest
				.spyOn(ImportUserMatchMapper, 'mapImportUserMatchScopeToDomain')
				.mockReturnValueOnce(MatchCreatorScope.MANUAL);
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.matches).toEqual([MatchCreatorScope.MANUAL]);
			expect(importUserMatchMapperSpy).toBeCalledWith(MatchFilterParams.MANUAL);
			importUserMatchMapperSpy.mockRestore();
		});
		it('should map flagged true from params to scope', () => {
			const params: ImportUserFilterParams = { flagged: true };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.flagged).toEqual(true);
		});
		it('should skip flagged false from params to scope', () => {
			const params: ImportUserFilterParams = { flagged: false };
			const result = ImportUserMapper.mapImportUserFilterParamsToDomain(params);
			expect(result.flagged).toBeUndefined();
		});
	});
});
