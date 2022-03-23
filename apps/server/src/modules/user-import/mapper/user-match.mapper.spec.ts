import { MikroORM } from '@mikro-orm/core';
import { MatchCreator } from '@shared/domain';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { MatchCreatorResponse, RoleNameResponse } from '../controller/dto';
import { UserFilterParams } from '../controller/dto/user-filter-params';
import { ImportUserMatchMapper } from './match.mapper';
import { UserMatchMapper } from './user-match.mapper';

describe('[UserMatchMapper]', () => {
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	describe('[mapToDomain] from query', () => {
		it('should map name to fullname if trimmed string not empty ', () => {
			const query: UserFilterParams = { name: ' Nala ' };
			const result = UserMatchMapper.mapToDomain(query);
			expect(result.name).toEqual(query.name);
		});
		it('should fail for whitespace name string', () => {
			const query: UserFilterParams = { name: ' ' };
			const result = () => UserMatchMapper.mapToDomain(query);
			expect(result).toThrowError('invalid name from query');
		});
		it('should skip name mapper if no name is provided without failing', () => {
			const query: UserFilterParams = {};
			const result = UserMatchMapper.mapToDomain(query);
			expect(result.name).toEqual(undefined);
		});
	});
	describe('[mapToResponse] from domain', () => {
		describe('When having a user provided only', () => {
			it('should map role name student', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: 'student' })] });
				const result = UserMatchMapper.mapToResponse(user);
				expect(result.roleNames).toContainEqual(RoleNameResponse.STUDENT);
			});
			it('should map role name admin', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: 'administrator' })] });
				const result = UserMatchMapper.mapToResponse(user);
				expect(result.roleNames).toContainEqual(RoleNameResponse.ADMIN);
			});
			it('should map role name teacher', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: 'teacher' })] });
				const result = UserMatchMapper.mapToResponse(user);
				expect(result.roleNames).toContainEqual(RoleNameResponse.TEACHER);
			});
			it('should not map other role names like superhero', () => {
				const user = userFactory.build({ roles: [roleFactory.build({ name: 'superhero' })] });
				const result = UserMatchMapper.mapToResponse(user);
				expect(result.roleNames.length).toEqual(0);
			});
			it('should not set matchedBy', () => {
				const user = userFactory.build();
				const result = UserMatchMapper.mapToResponse(user);
				expect(result.matchedBy).toBeUndefined();
			});
		});
		describe('when having a match provided', () => {
			it('should set matchedBy property by the mapped value', () => {
				const user = userFactory.build();
				const ImportUserMatchMapperSpy = jest
					.spyOn(ImportUserMatchMapper, 'mapMatchCreatorToResponse')
					.mockReturnValue('MAPPED_MATCH_VALUE' as MatchCreatorResponse);
				const result = UserMatchMapper.mapToResponse(user, MatchCreator.AUTO);
				expect(result.matchedBy).toEqual('MAPPED_MATCH_VALUE');
				expect(ImportUserMatchMapperSpy).toBeCalledTimes(1);
				expect(ImportUserMatchMapperSpy).toBeCalledWith(MatchCreator.AUTO);
				ImportUserMatchMapperSpy.mockClear();
			});
		});
	});
});
